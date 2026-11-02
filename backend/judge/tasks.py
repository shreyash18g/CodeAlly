import shutil

from celery import shared_task

from submissions.models import Submission
from problems.models import Problem
from .services import (
    judge_problem
)
from judge.executors.cpp_executor import (
    prepare_submission,
    write_input,
)
from judge.executors.compiler import compile_cpp
from judge.executors.runner import run_binary
from judge.exceptions import (
    CompileError,
    RuntimeErrorJudge,
    TimeLimitExceeded,
)


@shared_task
def process_submission(
    submission_id
):
    try:

        submission = Submission.objects.get(
            id=submission_id
        )

    except Submission.DoesNotExist:

        return

    submission.verdict = "RUNNING"

    submission.save()

    try:

        problem = Problem.objects.get(
            problemNumber=
            submission.problemNumber
        )

        result = judge_problem(
            submission.code,
            problem.hiddenTestCases
        )

        submission.verdict = (
            result["verdict"]
        )

        submission.runtime = (
            result.get(
                "runtime",
                0
            )
        )

        submission.memory = (
            result.get(
                "memory",
                0
            )
        )

        submission.error_message = (
            result.get(
                "info",
                {}
            )
        )

        submission.save()

        if result["verdict"] == "ACCEPTED":

            user = submission.userId

            solved = (
                user.solvedProblems
                if user.solvedProblems
                else []
            )

            if (
                submission.problemNumber
                not in solved
            ):

                solved.append(
                    submission.problemNumber
                )

                user.solvedProblems = solved

                user.save()

    except Exception as e:

        submission.verdict = (
            "INTERNAL_ERROR"
        )

        submission.error_message = {
            "type":
            "SYSTEM",

            "message":
            str(e)
        }

        submission.save()


@shared_task
def run_code_task(code, input_data):
    
    temp_dir = prepare_submission(code)

    try:
        try:
            compile_cpp(temp_dir)
        except CompileError as e:
            return {"verdict": "COMPILE_ERROR", "output": str(e)}

        write_input(temp_dir, input_data)

        try:
            result = run_binary(temp_dir)
        except RuntimeErrorJudge as e:
            return {"verdict": "RUNTIME_ERROR", "output": str(e)}
        except TimeLimitExceeded as e:
            return {
                "verdict": "TIME_LIMIT_EXCEEDED",
                "output": "Time Limit Exceeded (Capped at 2 seconds).",
            }

        return {
            "verdict": "SUCCESS",
            "output": result["output"],
            "runtime": result.get("runtime", 0),
            "memory": result.get("memory", 0),
        }

    except Exception as e:
        
        return {
            "verdict": "INTERNAL_ERROR",
            "output": str(e),
        }

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
