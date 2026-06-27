from django.shortcuts import render

# Create your views here.
import re
import jwt

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import User
from .serializers import UserSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
# users/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def test_auth(request):
    return Response({
        "user": request.user.email
    })
def is_strong_password(password):

    pattern = r'^(?=.*[A-Z])(?=.*\d).{6,}$'

    return re.match(pattern, password)


@api_view(['POST'])
def register(request):

    firstname = request.data.get('firstname')
    lastname = request.data.get('lastname')
    email = request.data.get('email')
    password = request.data.get('password')

    if not all([firstname, lastname, email, password]):
        return Response(
            "Please enter all the information",
            status=400
        )

    if User.objects.filter(email=email).exists():
        return Response(
            "User already exists",
            status=400
        )

    if not is_strong_password(password):
        return Response(
            "Password must be at least 6 characters long and include at least one uppercase letter and one number.",
            status=400
        )

    new_user = User.objects.create(
        firstname=firstname,
        lastname=lastname,
        email=email,
        password=make_password(password),
        role='user'
    )

    token = jwt.encode(
        {
            'id': new_user.id,
            'email': email,
            'role': new_user.role,
        },
        settings.SECRET_KEY,
        algorithm='HS256'
    )

    serializer = UserSerializer(new_user)

    response = Response(
        {
            "message":
            "You have successfully registered!",
            "user":
            serializer.data
        },
        status=200
    )

    response.set_cookie(
        'token',
        token,
        httponly=True,
        samesite='Lax'
    )

    return response

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"message": "Please provide both email and password"}, status=400)

    # Authenticate via Django's backend custom user backend (using email instead of username)
    user = authenticate(request, username=email, password=password)

    if user is not None:
        # Generate Simple JWT Token pair explicitly
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "firstname": user.firstname,
                "lastname": user.lastname,
                "email": user.email,
                "role": getattr(user, 'role', 'user') # Fallback if role isn't explicitly set
            }
        }, status=200)
    
    return Response({"message": "Invalid credentials"}, status=401)




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):

    user = request.user

    return Response({
        "id": user.id,
        "firstname": user.firstname,
        "lastname": user.lastname,
        "email": user.email,
        "role": user.role,
        "solvedProblems": user.solvedProblems
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_solved_problems(request):

    return Response(
        request.user.solvedProblems,
        status=200
    )