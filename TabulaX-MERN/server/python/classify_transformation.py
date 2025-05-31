import sys
import json
import pandas as pd
import numpy as np
import re
import os
import traceback
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage
from apply_transformation import generate_general_transformation


# Set your Gemini API key here or ensure it's in the environment variable GOOGLE_API_KEY
api_key = os.environ.get("GOOGLE_API_KEY", "")
genai.configure(api_key=api_key)
llm = genai.GenerativeModel('gemini-pro')

# Set up error logging
def log_error(message):
    with open("error_log.txt", "a") as f:
        f.write(f"{message}\n")

def classify_transformation_main(data_info):
    try:
        # Expecting data_info = {'source_data': [...], 'target_data': [...]}
        source_data = data_info['source_data']
        target_data = data_info['target_data']
        if not source_data or not target_data:
            raise ValueError("Source or target data is empty")
        source_series = pd.Series(source_data)
        target_series = pd.Series(target_data)

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

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",  # or "gemini-1.5-flash" for faster responses
            temperature=0.7,
            google_api_key=api_key
        )

        # Perform classification
        transformation_type = classify_transformation(source_series, target_series, llm)
        transformation_code = None
        transformation_details_for_response = None
        description = None

        if transformation_type == "General":
            # For General type, get description from apply_transformation.generate_general_transformation
            source_examples = source_data[:10] # Use first 10 examples, or adjust as needed
            target_examples = target_data[:10]
            
            # Construct details needed by generate_general_transformation
            # Ensure this matches the structure expected by generate_general_transformation
            current_transformation_details_for_general = {
                "sourceExamples": source_examples,
                "targetExamples": target_examples,
                # Add any other fields generate_general_transformation might expect from transformation_details
            }
            
            # We pass an empty Series for new_input_series as we only want the relationship description here.
            # The llm instance is already initialized in classify_transformation_main.
            general_result = generate_general_transformation(current_transformation_details_for_general, pd.Series([], dtype='object'), llm)
            
            if general_result and general_result.get('success'):
                description = general_result.get('relationship', "General transformation identified. Specifics to be determined during application.")
            else:
                description = "Failed to determine relationship for General transformation."
                log_error(f"generate_general_transformation failed or returned no description. Result: {general_result}")
            
            transformation_details_for_response = {"description": description}
            # For 'General' type, the transformation_code is essentially a comment pointing to the description
            # as the actual transformation is handled by the LLM in apply_transformation.
            transformation_code = f"## General Transformation - Logic applied via LLM ##\n# Description: {description}\n# This transformation is handled by a generative model based on the provided examples."

        elif transformation_type == "Numerical":
            transformation_code = generate_numerical_transformation(source_series, target_series)
        elif transformation_type == "String-based":
            transformation_code = generate_string_transformation(source_series, target_series, llm)
        elif transformation_type == "Algorithmic":
            transformation_code = generate_algorithmic_transformation(source_series, target_series, llm)

        result = {
            "success": True,
            "transformation_type": transformation_type,
            "transformation_code": transformation_code,
            "transformation_details": transformation_details_for_response
        }
        return result
    except Exception as e:
        error_details = traceback.format_exc()
        log_error(f"Error in classify_transformation.py: {str(e)}\n{error_details}")
        return {
            "error": True,
            "message": str(e)
        }

def classify_transformation(source_series, target_series, llm):
    """
    Classify transformation type between source and target columns using an LLM.
    Returns only the transformation type string.
    """
    source_target_pairs = list(zip(source_series.head(5), target_series.head(5)))
    examples = [f'("{s}" -> "{t}")' for s, t in source_target_pairs]
    serialized_examples = ', '.join(examples)

    prompt = f"""You are an expert transformation classifier for the TabulaX framework.
    Your task is to classify the transformation type between source and target values.
    Output your response in JSON format with a single key: "transformation_type".

    The transformation classes are:
    1. String-based: Uses string manipulation functions like splitting, case conversion, abbreviation, etc.
    2. Numerical: Applies mathematical functions to transform values.
    3. Algorithmic: Uses specific algorithms without external knowledge for transformations.
    4. General: Requires external knowledge, complex mappings, or context-dependent logic.

    Analyze the following examples of source to target transformations:
    {serialized_examples}

    Based on these examples, determine the most appropriate transformation_type.
    Respond ONLY with a valid JSON object. For example:
    {{"transformation_type": "String-based"}}
    {{"transformation_type": "Numerical"}}
    {{"transformation_type": "Algorithmic"}}
    {{"transformation_type": "General"}}
    """

    # Use the appropriate method based on the LLM type
    if hasattr(llm, 'invoke'):
        response = llm.invoke([HumanMessage(content=prompt)])
        result_text = response.content
    else:
        response = llm.generate_content(prompt)
        result_text = response.text if hasattr(response, 'text') else str(response)
    
    try:
        cleaned_result_text = result_text.strip()
        if cleaned_result_text.startswith('```json'):
            cleaned_result_text = cleaned_result_text[len('```json'):].strip()
        if cleaned_result_text.startswith('```'):
            cleaned_result_text = cleaned_result_text[len('```'):].strip()
        if cleaned_result_text.endswith('```'):
            cleaned_result_text = cleaned_result_text[:-len('```')].strip()

        parsed_result = json.loads(cleaned_result_text)
        transformation_type = parsed_result.get("transformation_type", "General") # Default to General
        return transformation_type
    except json.JSONDecodeError as je:
        log_error(f"JSONDecodeError in classify_transformation: {str(je)}. Raw: {result_text}")
        # Basic fallback if JSON parsing fails
        if "String-based" in result_text: return "String-based"
        if "Numerical" in result_text: return "Numerical"
        if "Algorithmic" in result_text: return "Algorithmic"
        return "General" # Fallback to General
    except Exception as e:
        log_error(f"Error in classify_transformation: {str(e)}. Raw: {result_text}")
        return "General" # Fallback to General

def generate_numerical_transformation(source_series, target_series):
    source_nums = pd.to_numeric(source_series)
    target_nums = pd.to_numeric(target_series)

    best_mse = float('inf')
    best_func = None
    best_params = None

    functions = [
        ("Linear", lambda x, a, b: a * x + b),
        ("Polynomial", lambda x, a, b, c: a * x**2 + b * x + c),
        ("Exponential", lambda x, a, b: a * np.exp(b * x)),
        ("Rational", lambda x, a, b, c: (a * x + b) / (x + c))
    ]

    for name, func in functions:
        try:
            from scipy import optimize
            params, _ = optimize.curve_fit(func, source_nums, target_nums)
            y_pred = func(source_nums, *params)
            mse = np.mean((y_pred - target_nums) ** 2)

            if mse < best_mse:
                best_mse = mse
                best_func = name
                best_params = params
        except:
            continue

    if best_func == "Linear":
        a, b = best_params
        return f"""def transform(value):
                        try:
                            x = float(value)
                            return {a:.6f} * x + {b:.6f}
                        except:
                            return value
                    """
    elif best_func == "Polynomial":
        a, b, c = best_params
        return f"""def transform(value):
                        try:
                            x = float(value)
                            return {a:.6f} * x**2 + {b:.6f} * x + {c:.6f}
                        except:
                            return value
                    """
    elif best_func == "Exponential":
        a, b = best_params
        return f"""def transform(value):
                        import math
                        try:
                            x = float(value)
                            return {a:.6f} * math.exp({b:.6f} * x)
                        except:
                            return value
                    """
    elif best_func == "Rational":
        a, b, c = best_params
        return f"""def transform(value):
                        try:
                            x = float(value)
                            return ({a:.6f} * x + {b:.6f}) / (x + {c:.6f}) if abs(x + {c:.6f}) > 1e-10 else value
                        except:
                            return value
                    """
    else:
        return "def transform(value): return value"

def generate_string_transformation(source_series, target_series, llm):
    examples = [f"Input: {s}\nExpected output: {t}" for s, t in zip(source_series.head(10), target_series.head(10))]
    example_text = "\n\n".join(examples)

    prompt = f"""
                You are a helpful Python developer. Based on the input-output mappings, write a clean Python function named transform(value).
                Create a Python function named transform(value) that converts values from a source column to a target column.

                The source values are from column \"{source_series}\" and target values are from column \"{target_series}\".
                Here are the paired examples (source→target):

                SOURCE → TARGET

                Each transformation follows a consistent string pattern. Follow these requirements:

                - Handle None or empty input gracefully
                - Use only standard Python (no external libraries)
                - Return the function only (no extra text)
                - No notes and explanations
                - No Test cases to print
                - Return only the Python function code
                - Return python function with correct syntax
                - Follow the examples given below to identify the transformations
                Examples:
                {example_text}

                Only return the Python function code below:
                """

    # Use the appropriate method based on the LLM type
    if hasattr(llm, 'invoke'):
        # LangChain interface
        response = llm.invoke([HumanMessage(content=prompt)])
        result = response.content
    else:
        # Direct Google Generative AI interface
        response = llm.generate_content(prompt)
        result = response.text if hasattr(response, 'text') else str(response)

    # Clean up markdown-style triple backticks if present
    result = result.replace("```python", "").replace("```", "").strip()

    # Extract only the function
    match = re.search(r"(def transform\(value\):[\s\S]+?)(?=\n{2,}|\Z)", result)
    return match.group(1).strip() if match else result

def generate_algorithmic_transformation(source_series, target_series, llm):
    examples = [f'("{s}" -> "{t}")' for s, t in zip(source_series.head(10), target_series.head(10))]
    serialized_examples = ", ".join(examples)

    relationship_prompt = f"""
                        You are a helpful Python developer. Identify the transformation rule from these input-output examples:
                        {serialized_examples}
                        What is the transformation relationship (e.g., 'email to domain', 'reverse string', etc)? Only write the relationship.

                        You are given a set of source and target pairs. Find what is the relationship between the source and target values.
                        Format the answer as [type of source] to [type of target]

                        Examples:
                        Data: ("arash@gmail.com" -> "gmail.com"), ("adargah@ualberta.ca" -> "ualberta.ca"),
                        Relationship: email to domain

                        Data: ("2024/09/05" -> "1403/06/16"), ("1886/06/27" -> "1265/04/06"),
                        Relationship: Gregorian date to Jalali (Solar Hijri) date

                        Data: {serialized_examples}
                        Relationship:
                        """.strip()

    # Use the appropriate method based on the LLM type
    if hasattr(llm, 'invoke'):
        # LangChain interface
        relationship_response = llm.invoke([HumanMessage(content=relationship_prompt)])
        relationship_result = relationship_response.content
    else:
        # Direct Google Generative AI interface
        relationship_response = llm.generate_content(relationship_prompt)
        relationship_result = relationship_response.text if hasattr(relationship_response, 'text') else str(relationship_response)
    relationship_line = next((line.strip() for line in reversed(relationship_result.split('\n')) if 'to' in line), relationship_result)

    test_cases = "\n".join([f"Input: {s}\nExpected output: {t}" for s, t in zip(source_series.head(10), target_series.head(10))])

    function_prompt = f"""
                        Write a Python function called `transform` to perform this transformation: {relationship_line}.
                        Avoid using any libraries that are not installed by default.
                        Do not use nested functions.
                        Output only a single function named transform with one input: a string called `value`.
                        Return a transformed string. Handle None and empty strings by returning "".
                        Handle exceptions gracefully.
                        Keenly observe the examples provided.
                        Generate the function with valid transformation logic same as in target values.
                        Ensure that every variable in the function is declared.
                        The generated function should be valid for a wide number of data.
                        No comments, no explanations.

                        Test cases:
                        {test_cases}

                        Only output the function code:
                        """.strip()

    # Use the appropriate method based on the LLM type
    if hasattr(llm, 'invoke'):
        # LangChain interface
        function_response = llm.invoke([HumanMessage(content=function_prompt)])
        function_result = function_response.content
    else:
        # Direct Google Generative AI interface
        function_response = llm.generate_content(function_prompt)
        function_result = function_response.text if hasattr(function_response, 'text') else str(function_response)
    
    # Clean up and extract the function
    function_result = function_result.replace("```python", "").replace("```", "").strip()
    match = re.search(r"(def transform\(value\):\s*(?:\n\s+.+)+)", function_result)
    return match.group(1).strip() if match else function_result.strip()

# Main executionif __name__ == "__main__":
    # Initialize to prevent NameError if reading from stdin fails or is skipped
    source_series = pd.Series([], dtype=object)
    target_series = pd.Series([], dtype=object)
    api_key = None # Initialize api_key

    try:
        # Attempt to get API key from environment or .env file
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

        # Log API key status (without revealing the key)
        log_error(f"API Key status: {'Available' if api_key else 'Missing'}")

        # Perform classification
        transformation_type = classify_transformation(source_series, target_series, llm)
        log_error(f"Classification result: {transformation_type}")

        # Generate transformation code based on type
        transformation_code = None
        if transformation_type == "Numerical":
            transformation_code = generate_numerical_transformation(source_series, target_series)
        elif transformation_type == "String-based":
            transformation_code = generate_string_transformation(source_series, target_series, llm)
        elif transformation_type == "Algorithmic":
            transformation_code = generate_algorithmic_transformation(source_series, target_series, llm)

        # Output result as JSON
        result = {
            "transformation_type": transformation_type,
            "transformation_code": transformation_code
        }

        print(json.dumps(result))
    except Exception as e:
        error_details = traceback.format_exc()
        log_error(f"Error in classify_transformation.py: {str(e)}\n{error_details}")

        # Return error as JSON
        error_result = {
            "error": True,
            "message": str(e)
        }
        print(json.dumps(error_result))
