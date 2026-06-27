from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response

from users.models import User
from problems.models import Problem


# Get Leaderboard
# Equivalent to the MongoDB aggregation pipeline.
@api_view(['GET'])
def get_leaderboard(request):

    leaderboard_data = []

    users = User.objects.all()

    for user in users:

        solved = (
            user.solvedProblems
            if user.solvedProblems
            else []
        )

        solved_problems = Problem.objects.filter(
            problemNumber__in=solved
        )

        score = sum(
            problem.difficulty
            for problem in solved_problems
        )

        leaderboard_data.append(
            {
                "userId": user.id,
                "username":
                    f"{user.firstname} {user.lastname}",
                "problemsSolved":
                    len(solved),
                "score":
                    score,
            }
        )

    leaderboard_data.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return Response(
        leaderboard_data,
        status=200
    )