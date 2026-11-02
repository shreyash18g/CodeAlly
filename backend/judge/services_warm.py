"""
judge/services_warm.py

Same logic as the original judge/services.py:judge_problem(), but using
the warm-container execution model (one container per submission,
exec_run per test case) instead of one container per test case.

Kept as a SEPARATE file from services.py on purpose, so you can run
both side-by-side for Test A-style comparison, and so the original
(known-correct, more isolated) implementation isn't lost if you ever
want to roll back or A/B the two approaches.
"""

import shutil

from judge.exceptions import (
    CompileError,
    RuntimeErrorJudge,
    TimeLimitExceeded,
)
from judge.executors.warm_runner import (
    start_submission_container,
    stop_submission_container,
    compile_cpp_warm,
    run_binary_warm,
)
from judge.executors.cpp_executor import (
    prepare_submission,
    write_input,
)
from judge.utils import normalize_output
from judge.verdicts import *


def judge_problem_warm(code, hidden_testcases):
    temp_dir = prepare_submission(code)

    max_runtime = 0
    max_memory = 0
    container = None

    try:
        # ONE container for the entire submission -- this replaces the
        # per-call container creation that compile_cpp()/run_binary()
        # used to do internally.
        container = start_submission_container(temp_dir)

        try:
            compile_cpp_warm(container)
        except CompileError as e:
            return {
                "verdict": COMPILE_ERROR,
                "info": {
                    "type": "CE",
                    "message": str(e),
                },
            }

        for idx, testcase in enumerate(hidden_testcases):
            write_input(temp_dir, testcase["input"])

            try:
                result = run_binary_warm(container)
            except RuntimeErrorJudge as e:
                return {
                    "verdict": RUNTIME_ERROR,
                    "info": {
                        "type": "RE",
                        "message": str(e),
                    },
                }
            except TimeLimitExceeded as e:
                return {
                    "verdict": TIME_LIMIT_EXCEEDED,
                    "info": {
                        "type": "TLE",
                        "message": str(e),
                    },
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
                        "actual": actual,
                    },
                }

        return {
            "verdict": ACCEPTED,
            "runtime": max_runtime,
            "memory": max_memory,
        }

    finally:
        if container is not None:
            stop_submission_container(container)
        shutil.rmtree(temp_dir, ignore_errors=True)
