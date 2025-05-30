import pandas as pd
import numpy as np
import Levenshtein

def calculate_distance(val1, val2, transformation_class):
    """
    Calculates the distance between two values based on transformation class.
    """
    if pd.isna(val1) or pd.isna(val2):
        return np.inf # Consider NaN as infinite distance

    if transformation_class in ["String-based", "Algorithmic"]:
        # Levenshtein distance for strings
        return Levenshtein.distance(str(val1), str(val2))
    elif transformation_class == "Numerical":
        try:
            # Absolute difference for numerical values
            return abs(float(val1) - float(val2))
        except ValueError:
            # If conversion to float fails, treat as infinite distance
            return np.inf
    # Add other transformation classes if needed
    return np.inf # Default for unknown classes

def perform_fuzzy_join(source_df, target_df, transformed_source_col, target_col_to_join_on, transformation_class, max_distance_threshold):
    """
    Performs a fuzzy left join between two DataFrames based on a calculated distance.
    """
    # Ensure columns are of appropriate type for distance calculation
    source_df[transformed_source_col] = source_df[transformed_source_col].astype(str) if transformation_class in ["String-based", "Algorithmic"] else pd.to_numeric(source_df[transformed_source_col], errors='coerce')
    target_df[target_col_to_join_on] = target_df[target_col_to_join_on].astype(str) if transformation_class in ["String-based", "Algorithmic"] else pd.to_numeric(target_df[target_col_to_join_on], errors='coerce')

    # Create a new DataFrame for results
    joined_data = []

    # Iterate through each row in the source DataFrame
    for idx_s, row_s in source_df.iterrows():
        source_val = row_s[transformed_source_col]
        best_match_row = None
        min_distance = np.inf

        # Find the best match in the target DataFrame
        for idx_t, row_t in target_df.iterrows():
            target_val = row_t[target_col_to_join_on]
            distance = calculate_distance(source_val, target_val, transformation_class)

            if distance <= max_distance_threshold and distance < min_distance:
                min_distance = distance
                best_match_row = row_t.to_dict()

        # Combine source row with best match from target
        combined_row = row_s.to_dict()
        if best_match_row:
            # Add target columns, prefixing to avoid name conflicts
            for key, value in best_match_row.items():
                if key != target_col_to_join_on: # Don't duplicate the join key from target
                    combined_row[f'target_{key}'] = value
            combined_row[f'target_{target_col_to_join_on}'] = best_match_row[target_col_to_join_on] # Add the joined-on column
            combined_row['join_distance'] = min_distance
        else:
            # If no match, add NaN for target columns and infinite distance
            for col in target_df.columns:
                combined_row[f'target_{col}'] = np.nan
            combined_row['join_distance'] = np.inf

        joined_data.append(combined_row)

    # Convert the list of dicts to a DataFrame
    joined_df = pd.DataFrame(joined_data)
    return joined_df
