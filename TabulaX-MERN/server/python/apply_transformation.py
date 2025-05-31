import os
import json
import pandas as pd
import traceback
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

def log_error(message):
    with open("error_log.txt", "a") as f:
        f.write(f"{message}\n")

def generate_general_transformation(transformation_details, new_input_series, llm):
    """
    Applies general transformation on new input values using:
    1. A lookup table built from example source-target pairs stored in transformation_details.
    2. LLM inference for unseen inputs.
    Returns a dictionary with transformed outputs, provenances, and relationship.
    """
    log_error("Starting generate_general_transformation with transformation_details")

    source_examples = transformation_details.get('sourceExamples', [])
    target_examples = transformation_details.get('targetExamples', [])

    # Step 0: Create example mapping dictionary with normalization
    examples_dict = {}
    normalized_dict = {}
    
    valid_pairs = []
    if len(source_examples) != len(target_examples):
        log_error(f"Warning: Mismatch in lengths of sourceExamples ({len(source_examples)}) and targetExamples ({len(target_examples)}). Proceeding with common length.")
        min_len = min(len(source_examples), len(target_examples))
        source_examples = source_examples[:min_len]
        target_examples = target_examples[:min_len]

    for s, t in zip(source_examples, target_examples):
        if pd.notna(s) and pd.notna(t) and str(s).strip() and str(t).strip():
            valid_pairs.append((str(s).strip(), str(t).strip()))
    
    log_error(f"Found {len(valid_pairs)} valid source-target pairs from transformation_details")
    
    if not valid_pairs:
        log_error("No valid example pairs found in transformation_details. Cannot perform lookup or infer relationship effectively.")
        # Return original values as a fallback if no examples
        outputs = new_input_series.tolist()
        provenances = ['no_examples_provided'] * len(new_input_series)
        return {'success': True, 'outputs': outputs, 'provenances': provenances, 'relationship': 'Unknown (no examples)'}

    for s, t in valid_pairs:
        examples_dict[s] = t
        normalized_dict[s.lower()] = t
    
    pairs_formatted = [f'"{s}" -> "{t}"' for s, t in valid_pairs]
    pairs_str = "\n".join(pairs_formatted)
    log_error(f"Created lookup table with {len(examples_dict)} entries from transformation_details")
    
    # Step 1: Identify the relationship type
    relationship_examples_text = """
    Examples of relationships:
    - "Einstein" -> "Scientist" = Person to Profession
    - "Japan" -> "Tokyo" = Country to Capital City
    # ... (other examples can be added or kept concise)
    """
    relationship_prompt = f"""
    Given these mappings between source and target values:
    {pairs_str}
    {relationship_examples_text}
    Identify the specific relationship. Format: [Source Type] to [Target Type]. Only output the relationship.
    """
    relationship_line = "Unknown"
    try:
        if pairs_str: # Only attempt if there are pairs to analyze
            relationship_response = llm.invoke([HumanMessage(content=relationship_prompt)])
            relationship_result = relationship_response.content.strip()
            relationship_line = next((line.strip() for line in relationship_result.split('\n') if ' to ' in line.lower()), relationship_result)
        log_error(f"Detected relationship: {relationship_line}")
    except Exception as e:
        log_error(f"Error detecting relationship: {str(e)}")
        relationship_line = "Error detecting relationship"
    
    # Step 2: Process new inputs
    outputs = []
    provenances = []
    for val in new_input_series:
        try:
            if pd.isna(val) or str(val).strip() == '':
                outputs.append("") # Or None, depending on desired output for nulls
                provenances.append("empty_input")
                continue
                
            val_str = str(val).strip()
            
            if val_str in examples_dict:
                outputs.append(examples_dict[val_str])
                provenances.append("exact_match")
                continue
                
            val_lower = val_str.lower()
            if val_lower in normalized_dict:
                outputs.append(normalized_dict[val_lower])
                provenances.append("case_insensitive_match")
                continue
            
            llm_prompt = f"""
            Examples of transformation ({relationship_line}):
            {pairs_str}
            New input: "{val_str}"
            Predict the target value. Only output the predicted target value. If uncertain, output the original input "{val_str}".
            """
            try:
                response = llm.invoke([HumanMessage(content=llm_prompt)])
                transformed_val = response.content.strip()
                
                if transformed_val == val_str or not transformed_val:
                    outputs.append(val_str)
                    provenances.append("llm_fallback_uncertain")
                else:
                    outputs.append(transformed_val)
                    provenances.append("llm_generated")
            except Exception as e:
                log_error(f"LLM inference error for '{val_str}': {str(e)}")
                outputs.append(val_str)
                provenances.append("llm_error")
        except Exception as e:
            log_error(f"Error processing value '{val}': {str(e)}")
            outputs.append(str(val) if pd.notna(val) else "")
            provenances.append("processing_error")
            
    log_error(f"Finished processing {len(new_input_series)} inputs.")
    return {'success': True, 'outputs': outputs, 'provenances': provenances, 'relationship': relationship_line}

def apply_transformation_main(data_info):
    try:
        data = data_info['data']
        column_to_transform = data_info['column']
        transformation_type = data_info.get('transformation_type', 'General')
        code_file_content = data_info.get('code_file_content', None)
        transformation_details = data_info.get('transformation_details', {})

        # Validate data
        if not data or not isinstance(data, list):
            raise ValueError("Data must be a non-empty list")

        # Convert to pandas DataFrame
        df = pd.DataFrame(data)

        # Check if column exists in DataFrame
        if column_to_transform not in df.columns:
            raise ValueError(f"Column '{column_to_transform}' not found in data")

        log_error(f"Data loaded successfully with {len(df)} rows")

        # Get Google API key from environment or .env file
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            try:
                env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
                if os.path.exists(env_path):
                    with open(env_path, 'r') as env_file:
                        for line in env_file:
                            if line.startswith('GOOGLE_API_KEY='):
                                api_key = line.strip().split('=', 1)[1].strip()
                                break
            except Exception as e:
                log_error(f"Error reading API key from .env file: {str(e)}")
        if not api_key:
            api_key = "AIzaSyBNFQX9eI7V6TmeDuuuqQ5JhxFpgZj19BY"

        # Initialize Gemini model for General transformations
        llm = None
        if transformation_type == "General":
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                temperature=0.7,
                google_api_key=api_key
            )

        # Apply transformation based on type
        if transformation_type == "General":
            if llm is None:
                raise ValueError("LLM could not be initialized for General transformation.")
                
            log_error(f"Applying General transformation to {column_to_transform}")
            
            # Check if we have enough data for examples
            if len(df) < 2:
                raise ValueError("Need at least 2 rows of data for General transformation (1 for example, 1 for transformation)")
            
            # Determine if we have a target column or if we're using the same data for examples and transformation
            target_column = None
            possible_targets = [col for col in df.columns if col != column_to_transform]
            
            if possible_targets:
                # We have a separate target column
                target_column = possible_targets[0]
                log_error(f"Using column '{target_column}' as target for examples")
                
                # Use first N rows as examples, rest as new inputs
                example_size = min(10, len(df) - 1)  # Leave at least 1 row for transformation
                source_series = df[column_to_transform][:example_size]
                target_series = df[target_column][:example_size]
                new_input_series = df[column_to_transform][example_size:]
            else:
                # No target column - assume all data is for examples, and we'll transform the same data
                log_error("No separate target column found. Using all data as examples and transforming the same data.")
                example_size = len(df)
                source_series = df[column_to_transform]
                target_series = df[column_to_transform]  # Same as source for placeholder
                new_input_series = df[column_to_transform]  # Transform the same data
            
            # Generate the transformation
            output_path = "transformed_output.csv"
            generate_general_transformation(source_series, target_series, new_input_series, llm, output_path=output_path)
            
            try:
                # Read the output CSV
                df_output = pd.read_csv(output_path)
                log_error(f"Successfully generated output with {len(df_output)} rows")
                
                # Create result DataFrame
                if possible_targets:
                    # We had separate target column - merge results
                    df_result = pd.concat([
                        df.iloc[:example_size].assign(Output=target_series.values, Provenance="example"),
                        df.iloc[example_size:].assign(Output=df_output["Output"].values, Provenance=df_output["Provenance"].values)
                    ], ignore_index=True)
                else:
                    # No separate target - just use the transformation results
                    df_result = df.copy()
                    df_result['Output'] = df_output["Output"].values
                    df_result['Provenance'] = df_output["Provenance"].values
                    
                # Add relationship information if available
                if 'Relationship' in df_output.columns:
                    relationship = df_output['Relationship'].iloc[0] if len(df_output) > 0 else "Unknown"
                    df_result['Relationship'] = relationship
                    log_error(f"Detected relationship: {relationship}")
                
                result = {
                    "transformed_data": df_result.to_dict(orient='records')
                }
                return result
                
            except Exception as e:
                log_error(f"Error processing transformation output: {str(e)}")
                raise ValueError(f"Error processing transformation output: {str(e)}")

        else:
            # For other transformations, load and execute the transformation code
            if code_file_content:
                exec_globals = {}
                exec(code_file_content, exec_globals)
                transform_func = exec_globals.get('transform')
                if not transform_func:
                    raise ValueError("Transformation code must define a 'transform' function")
                df[f'transformed_{column_to_transform}'] = df[column_to_transform].apply(transform_func)
            else:
                # No transformation code provided
                df[f'transformed_{column_to_transform}'] = df[column_to_transform]

            # Output result as JSON
            result = {
                "transformed_data": df.to_dict(orient='records')
            }
            return result
    except Exception as e:
        error_details = traceback.format_exc()
        log_error(f"Error in apply_transformation.py: {str(e)}\n{error_details}")
        return {
            "error": True,
            "message": str(e)
        }
