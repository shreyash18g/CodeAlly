from django.shortcuts import render

# Create your views here.

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Submission
from users.models import User


# Update Verdict
# Equivalent to: POST /verdict
@api_view(['POST'])
def update_verdict(request):

    problemNumber = request.data.get(
        'problemNumber'
    )

    verdict = request.data.get(
        'verdict'
    )

    code = request.data.get(
        'code'
    )

    language = request.data.get(
        'language'
    )

    user_id = request.data.get(
        'userId'
    )

    if not all([
        problemNumber,
        verdict,
        code,
        language,
        user_id
    ]):

        return Response(
            {
                "message":
                "Problem number, verdict, code and language are required."
            },
            status=400
        )

    try:

        Submission.objects.create(
            userId_id=user_id,
            problemNumber=problemNumber,
            verdict=verdict,
            code=code,
            language=language
        )

    except Exception as e:

        print(
            "Submission creation error:",
            e
        )

    if verdict == "Accepted":

        try:

            user = User.objects.get(
                id=user_id
            )

            solved = (
                user.solvedProblems
                if user.solvedProblems
                else []
            )

            if problemNumber not in solved:

                solved.append(
                    problemNumber
                )

                user.solvedProblems = solved

                user.save()

            return Response(
                {
                    "message":
                    "User solved problems updated and submission recorded."
                },
                status=200
            )

        except Exception as e:

            return Response(
                {
                    "message":
                    "Internal server error while updating solved problems."
                },
                status=500
            )

    return Response(
        {
            "message":
            "Submission recorded."
        },
        status=200
    )


# submissions/views.py



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_submission_status(request, pk):
    try:
        # Secure endpoint: user can only poll their own submission tracks
        submission = Submission.objects.get(id=pk, userId=request.user)
    except Submission.DoesNotExist:
        return Response({"message": "Submission not found"}, status=404)

    return Response({
        "id": submission.id,
        "verdict": submission.verdict,
        "error_message": submission.error_message,
        "language": submission.language,
        "problemNumber": submission.problemNumber
    }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_submission_history(request):
    # Fetch all submissions matching the logged-in user, newest first
    submissions = Submission.objects.filter(userId=request.user).order_by('-created_at')
    
    history_data = [
        {
            "id": sub.id,
            "problemNumber": sub.problemNumber,
            "verdict": sub.verdict,
            "runtime": sub.runtime,
            "memory": sub.memory,
            "created_at": sub.created_at
        }
        for sub in submissions
    ]
    return Response(history_data, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_submission_details(request, pk):

    try:
        submission = Submission.objects.get(
            id=pk,
            userId=request.user
        )

    except Submission.DoesNotExist:
        return Response(
            {
                "message": "Submission not found"
            },
            status=404
        )

    return Response({
        "id": submission.id,
        "problemNumber": submission.problemNumber,
        "language": submission.language,
        "code": submission.code,
        "verdict": submission.verdict,
        "runtime": submission.runtime,
        "memory": submission.memory,
        "error_message": submission.error_message,
        "created_at": submission.created_at
    })
