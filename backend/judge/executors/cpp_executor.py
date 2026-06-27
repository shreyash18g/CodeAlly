# judge/executors/cpp_executor.py
import os
import tempfile


def prepare_submission(code):
    """Creates a unique temporary folder and writes the source code file."""
    temp_dir = tempfile.mkdtemp()
    
    # CRITICAL: Grant read, write, and execute permissions to all users 
    # so the container's unprivileged user can work inside this directory.
    os.chmod(temp_dir, 0o777)
    
    cpp_file = os.path.join(temp_dir, "main.cpp")

    with open(cpp_file, "w", encoding="utf-8") as f:
        f.write(code)

    return temp_dir


def write_input(temp_dir, input_data):
    """Writes the testcase input dynamically into the existing workspace folder."""
    input_file = os.path.join(temp_dir, "input.txt")

    with open(input_file, "w", encoding="utf-8") as f:
        f.write(input_data)
        
    # Grant permissions to the generated input file as well
    os.chmod(input_file, 0o666)