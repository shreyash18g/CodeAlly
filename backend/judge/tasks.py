# judge/tasks.py

from celery import shared_task
from submissions.models import Submission
from problems.models import Problem
from .services import (
    judge_problem
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