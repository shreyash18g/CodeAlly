# judge/services.py

import shutil
from judge.exceptions import (
    CompileError,
    RuntimeErrorJudge,
    TimeLimitExceeded
)
from judge.executors.compiler import (
    compile_cpp
)
from judge.executors.runner import (
    run_binary
)
from judge.executors.cpp_executor import (
    prepare_submission,
    write_input
)
from judge.utils import (
    normalize_output
)
from judge.verdicts import *


def judge_problem(code, hidden_testcases):
    temp_dir = prepare_submission(code)

    max_runtime = 0
    max_memory = 0

    try:
        # Catch compilation errors cleanly right here
        try:
            compile_cpp(temp_dir)
        except CompileError as e:
            return {
                "verdict": COMPILE_ERROR,
                "info": {
                    "type": "CE",
                    "message": str(e)
                }
            }

        # Iterate over test cases once compiled successfully
        for idx, testcase in enumerate(hidden_testcases):
            write_input(temp_dir, testcase["input"])

            try:
                result = run_binary(temp_dir)
            except RuntimeErrorJudge as e:
                return {
                    "verdict": RUNTIME_ERROR,
                    "info": {
                        "type": "RE",
                        "message": str(e)
                    }
                }
            except TimeLimitExceeded as e:
                return {
                    "verdict": TIME_LIMIT_EXCEEDED,
                    "info": {
                        "type": "TLE",
                        "message": str(e)
                    }
                }

            max_runtime = max(max_runtime, result["runtime"])
            max_memory = max(max_memory, result["memory"])

            expected = normalize_output(testcase["output"])
            actual = normalize_output(result["output"])

            if expected != actual:
                return {
                    "verdict": WRONG_ANSWER,
                    "runtime": max_runtime,
                    "memory": max_memory,
                    "info": {
                        "type": "WA",
                        "testcase": idx + 1,
                        "expected": expected,
                        "actual": actual
                    }
                }

        return {
            "verdict": ACCEPTED,
            "runtime": max_runtime,
            "memory": max_memory
        }

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)