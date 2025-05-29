#!/usr/bin/env python
import sys
import os
import json
import traceback

def check_dependency(module_name):
    """Check if a Python module is installed and return its version."""
    try:
        module = __import__(module_name)
        version = getattr(module, '__version__', 'Unknown version')
        return {
            'name': module_name,
            'installed': True,
            'version': version
        }
    except ImportError:
        return {
            'name': module_name,
            'installed': False,
            'version': None
        }

def check_environment():
    """Check the Python environment and dependencies."""
    results = {
        'python_version': sys.version,
        'executable': sys.executable,
        'platform': sys.platform,
        'environment_variables': {
            'GOOGLE_API_KEY': os.environ.get('GOOGLE_API_KEY', 'Not set'),
            'PATH': os.environ.get('PATH', 'Not set')
        },
        'dependencies': []
    }
    
    # List of dependencies to check
    dependencies = [
        'pandas',
        'numpy',
        'Levenshtein',
        'langchain_google_genai',
        'langchain',
        'scipy'
    ]
    
    for dep in dependencies:
        results['dependencies'].append(check_dependency(dep))
    
    return results

def check_file_paths():
    """Check if important files exist."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    files_to_check = [
        'classify_transformation.py',
        'apply_transformation.py',
        'fuzzy_join.py'
    ]
    
    results = {}
    for file in files_to_check:
        file_path = os.path.join(script_dir, file)
        results[file] = {
            'exists': os.path.exists(file_path),
            'path': file_path,
            'size': os.path.getsize(file_path) if os.path.exists(file_path) else None
        }
    
    return results

def main():
    """Main function to run all checks and print results."""
    try:
        print("Running environment diagnostics...")
        
        env_results = check_environment()
        file_results = check_file_paths()
        
        results = {
            'environment': env_results,
            'files': file_results
        }
        
        # Check for error logs
        error_log_path = 'error_log.txt'
        if os.path.exists(error_log_path):
            with open(error_log_path, 'r') as f:
                error_logs = f.readlines()
                results['error_logs'] = error_logs[-20:] if len(error_logs) > 20 else error_logs
        else:
            results['error_logs'] = []
        
        # Print results as JSON
        print(json.dumps(results, indent=2))
        
        # Check for missing dependencies
        missing_deps = [dep['name'] for dep in env_results['dependencies'] if not dep['installed']]
        if missing_deps:
            print("\nWARNING: The following dependencies are missing:")
            for dep in missing_deps:
                print(f"  - {dep}")
            print("\nInstall them using pip:")
            print(f"pip install {' '.join(missing_deps)}")
        
        # Check for Google API key
        if env_results['environment_variables']['GOOGLE_API_KEY'] == 'Not set':
            print("\nWARNING: GOOGLE_API_KEY environment variable is not set.")
            print("Set it using:")
            print("  - Windows (Command Prompt): set GOOGLE_API_KEY=your_api_key")
            print("  - Windows (PowerShell): $env:GOOGLE_API_KEY = 'your_api_key'")
            print("  - Linux/macOS: export GOOGLE_API_KEY=your_api_key")
        
    except Exception as e:
        error_details = traceback.format_exc()
        print(json.dumps({
            'error': True,
            'message': str(e),
            'traceback': error_details
        }))

if __name__ == "__main__":
    main()
