from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv # Added to load .env file
import requests 
from apply_transformation import apply_transformation_main, generate_general_transformation, log_error # Added generate_general_transformation, log_error
from classify_transformation import classify_transformation_main
from fuzzy_join import perform_fuzzy_join
from langchain_google_genai import ChatGoogleGenerativeAI # Added for LLM
import os # Added for environment variables
import traceback
import json
import pandas as pd
import logging
import sys

load_dotenv() # Load environment variables from .env file

app = Flask(__name__)
# Enable CORS with explicit configuration
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": "*", "methods": ["GET", "POST", "OPTIONS"]}})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



# NGROK_BASE_URL = "https://743e-34-143-229-65.ngrok-free.app/" 
# def classify_llm(data):
#     try:
#         response = requests.post(f"{NGROK_BASE_URL}/classify", json=data, timeout=10)
#         response.raise_for_status() 
#         return response.json()
#     except requests.exceptions.RequestException as e:
#         logger.error(f"Error calling ngrok /classify: {e}")
#         return {'error': True, 'message': f'Failed to connect to ngrok /classify: {str(e)}'}

# def transform_llm(data):
#     try:
#         response = requests.post(f"{NGROK_BASE_URL}/transform", json=data, timeout=10)
#         response.raise_for_status()
#         return response.json()
#     except requests.exceptions.RequestException as e:
#         logger.error(f"Error calling ngrok /transform: {e}")
#         return {'error': True, 'message': f'Failed to connect to ngrok /transform: {str(e)}'}
# if USE_NGROK_SERVICES: 
#     classification_result = classify_llm(data)
#     transformation_result = transform_llm(data)


@app.route('/apply', methods=['POST'])
def apply():
    try:
        data = request.json
        result = apply_transformation_main(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': True, 'message': str(e), 'traceback': traceback.format_exc()}), 500

@app.route('/classify', methods=['POST'])
def classify():
    try:
        data = request.json
        result = classify_transformation_main(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': True, 'message': str(e), 'traceback': traceback.format_exc()}), 500



@app.route('/execute-transformation', methods=['POST'])
def execute_transformation_route():
    try:
        data = request.json
        table_data = data.get('table_data')
        input_column_name = data.get('input_column_name')
        output_column_name = data.get('output_column_name')
        transformation_type = data.get('transformation_type')
        
        # Core parameters validation
        if not all([table_data, input_column_name, output_column_name, transformation_type]):
            return jsonify({"success": False, "message": "Missing required parameters: table_data, input_column_name, output_column_name, or transformation_type"}), 400

        if not isinstance(table_data, list) or not all(isinstance(row, dict) for row in table_data):
            return jsonify({"success": False, "message": "table_data must be a list of dictionaries."}), 400
        
        if not table_data:
             return jsonify({"success": False, "message": "table_data cannot be empty."}), 400

        df = pd.DataFrame(table_data)

        if input_column_name not in df.columns:
            return jsonify({"success": False, "message": f"Input column '{input_column_name}' not found in the uploaded data."}), 400

        transformed_data_list = []

        llm = None
        if transformation_type == 'General':
            google_api_key = os.environ.get("GOOGLE_API_KEY")
            if not google_api_key:
                logger.error("GOOGLE_API_KEY not found in environment variables for General Transformation.")
                return jsonify({"success": False, "message": "Server configuration error: GOOGLE_API_KEY missing for General Transformation."}), 500
            try:
                llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", google_api_key=google_api_key)
            except Exception as e:
                logger.error(f"Failed to initialize LLM for General Transformation: {str(e)}")
                return jsonify({"success": False, "message": f"Failed to initialize LLM for General Transformation: {str(e)}"}), 500

        if transformation_type == 'General':
            transformation_details = data.get('transformation_details')
            if not transformation_details:
                return jsonify({"success": False, "message": "Missing 'transformation_details' for General transformation type."}), 400
            
            logger.info(f"Executing General transformation with ID: {transformation_details.get('_id')}, Input Column: {input_column_name}, Output Column: {output_column_name}")
            
            try:
                # Ensure the input column exists before trying to access it
                if input_column_name not in df.columns:
                    return jsonify({"success": False, "message": f"Input column '{input_column_name}' not found in the data for General transformation."}), 400

                gen_trans_result = generate_general_transformation(transformation_details, df[input_column_name], llm)
                
                if gen_trans_result.get('success'):
                    df[output_column_name] = gen_trans_result['outputs']
                    # Optionally, add provenance and relationship if needed for the response
                    # df['provenance'] = gen_trans_result['provenances']
                    # df['relationship_detected'] = gen_trans_result['relationship']
                    transformed_data_list = df.to_dict(orient='records')
                    logger.info(f"General transformation successful. Relationship: {gen_trans_result['relationship']}")
                else:
                    error_msg = gen_trans_result.get('message', 'General transformation failed due to an unknown error.')
                    logger.error(f"General transformation failed: {error_msg}")
                    return jsonify({"success": False, "message": error_msg}), 500
            except Exception as e:
                logger.error(f"Exception during General transformation call: {str(e)}\n{traceback.format_exc()}")
                return jsonify({'success': False, 'message': f'Error during general transformation: {str(e)}', 'traceback': traceback.format_exc()}), 500

        else: # For non-General types (e.g., Python, SQL)
            transformation_code = data.get('transformation_code')
            if not transformation_code:
                return jsonify({"success": False, "message": "Missing 'transformation_code' for non-General transformation type."}), 400

            local_scope = {}
            exec_globals = {'pd': pd} 
            exec(transformation_code, exec_globals, local_scope)
            
            transform_func = local_scope.get('transform_value')
            if not callable(transform_func):
                for key, value in local_scope.items():
                    if callable(value) and key != '__builtins__':
                        transform_func = value
                        logger.info(f"Found callable function '{key}' in transformation_code, using it.")
                        break
                if not callable(transform_func):
                     logger.error("No callable function (e.g., 'transform_value') found in the provided transformation_code.")
                     return jsonify({"success": False, "message": "Transformation function (e.g., 'transform_value') not found or is invalid in the provided code."}), 400

            def apply_transform_safely(value):
                try:
                    return transform_func(value)
                except Exception as e:
                    logger.warning(f"Error applying transformation to value '{value}': {str(e)}. Returning original value.")
                    return value
            
            df[output_column_name] = df[input_column_name].apply(apply_transform_safely)
            transformed_data_list = df.to_dict(orient='records')

        return jsonify({"success": True, "data": transformed_data_list, "message": "Transformation executed successfully."})

    except Exception as e:
        logger.error(f"Error in /execute-transformation: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e), 'traceback': traceback.format_exc()}), 500

@app.route('/fuzzy-join', methods=['POST'])
def fuzzy_join_route():
    try:
        data = request.json
        source_data = data.get('source_data')
        target_data = data.get('target_data')
        transformed_source_col = data.get('transformed_source_col')
        target_col_to_join_on = data.get('target_col_to_join_on')
        transformation_class = data.get('transformation_class')
        max_distance_threshold = data.get('max_distance_threshold')

        if not all([
            data.get('source_data') is not None, 
            data.get('target_data') is not None, 
            data.get('transformed_source_col'), 
            data.get('target_col_to_join_on'), 
            data.get('transformation_class'), 
            data.get('max_distance_threshold') is not None
        ]):
            return jsonify({'success': False, 'message': 'Missing one or more required parameters.'}), 400

        source_df = pd.DataFrame(source_data)
        target_df = pd.DataFrame(target_data)

        if source_df.empty:
            return jsonify({'success': False, 'message': 'Source data is empty or invalid.'}), 400
        if target_df.empty:
            return jsonify({'success': False, 'message': 'Target data is empty or invalid.'}), 400
        
        if transformed_source_col not in source_df.columns:
            return jsonify({'success': False, 'message': f"Source column '{transformed_source_col}' not found in source data."}), 400
        if target_col_to_join_on not in target_df.columns:
            return jsonify({'success': False, 'message': f"Target column '{target_col_to_join_on}' not found in target data."}), 400

        try:
            threshold_value = float(max_distance_threshold)
        except ValueError:
            return jsonify({'success': False, 'message': 'Max distance threshold must be a valid number.'}), 400

        joined_df = perform_fuzzy_join(
            source_df,
            target_df,
            transformed_source_col,
            target_col_to_join_on,
            transformation_class,
            threshold_value
        )
        
        if joined_df is None or not isinstance(joined_df, pd.DataFrame):
             logger.error(f"perform_fuzzy_join returned an unexpected type or None")
             return jsonify({'success': False, 'message': 'Fuzzy join process resulted in an error or no data.'}), 500

        # Convert DataFrame to a list of dictionaries, ensuring NaN becomes null for JSON
        if joined_df.empty:
            data_list = []
        else:
            # Pandas to_json converts NaN to null, then json.loads converts null to None (Python)
            # jsonify will then convert None to null in the final JSON string.
            # Using date_format='iso' for consistent datetime serialization if any.
            json_string_data = joined_df.to_json(orient='records', date_format='iso')
            data_list = json.loads(json_string_data)

        return jsonify({'success': True, 'data': data_list})
    except Exception as e:
        logger.error(f"Error in /fuzzy-join: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e), 'traceback': traceback.format_exc()}), 500

# Add a simple health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Flask server is running"})

# Add a catch-all route for debugging
@app.route('/', defaults={'path': ''}, methods=['GET', 'POST'])
@app.route('/<path:path>', methods=['GET', 'POST'])
def catch_all(path):
    if path and path != '/':
        return jsonify({
            "error": True,
            "message": f"Endpoint /{path} not found. Available endpoints: /execute-transformation, /apply, /classify, /fuzzy-join, /health"
        }), 404
    return jsonify({
        "message": "TabulaX Flask API Server",
        "endpoints": ["/execute-transformation", "/apply", "/classify", "/fuzzy-join", "/health"],
        "status": "running"
    })

if __name__ == '__main__':
    # Print diagnostic information
    print("Starting Flask server for TabulaX...")
    print(f"Python version: {sys.version}")
    print(f"Available routes: {[rule.rule for rule in app.url_map.iter_rules()]}")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)
