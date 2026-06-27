from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Problem
from .serializers import ProblemSerializer

from users.models import User


# Get All Problems
# Equivalent to: Problem.find().sort({ problemNumber: 1 })
@api_view(['GET'])
def get_all_problems(request):

    problems = Problem.objects.all().order_by(
        'problemNumber'
    )

    serializer = ProblemSerializer(
        problems,
        many=True
    )

    return Response(
        serializer.data,
        status=200
    )


# Get Problem By Number
# Equivalent to: Problem.findOne({ problemNumber })
@api_view(['GET'])
def get_problem_by_number(
    request,
    problemNumber
):

    try:

        problem = Problem.objects.get(
            problemNumber=problemNumber
        )

    except Problem.DoesNotExist:

        return Response(
            {
                "message":
                "Problem not found"
            },
            status=404
        )

    serializer = ProblemSerializer(
        problem
    )

    return Response(
        serializer.data,
        status=200
    )


# Admin Status
# Equivalent to: res.status(200).json({ message: "Admin access granted" })
@api_view(['GET'])
def get_admin_status(request):

    return Response(
        {
            "message":
            "Admin access granted"
        },
        status=200
    )


# Create Problem
# Equivalent to: Problem.create(...)
@api_view(['POST'])
def create_problem(request):

    data = request.data

    last_problem = (
        Problem.objects
        .order_by('-problemNumber')
        .first()
    )

    new_number = (
        last_problem.problemNumber + 1
        if last_problem
        else 1
    )

    problem = Problem.objects.create(
        problemNumber=new_number,
        title=data['title'],
        description=data['description'],
        input=data.get('input', ''),
        output=data.get('output', ''),
        difficulty=data['difficulty'],
        tags=data.get('tags', []),
        hiddenTestCases=data.get(
            'hiddenTestCases',
            []
        )
    )

    serializer = ProblemSerializer(
        problem
    )

    return Response(
        serializer.data,
        status=201
    )


# Delete Problem
# Equivalent to: Problem.findOneAndDelete(...)
@api_view(['DELETE'])
def delete_problem(
    request,
    problemNumber
):

    try:

        problem = Problem.objects.get(
            problemNumber=problemNumber
        )

    except Problem.DoesNotExist:

        return Response(
            {
                "message":
                "Problem not found"
            },
            status=404
        )

    problem.delete()

    return Response(
        {
            "message":
            "Problem deleted successfully."
        },
        status=200
    )