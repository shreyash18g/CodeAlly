from django.urls import path
from .views import (
    register,
    login,
    test_auth,
    profile,
    user_profile,
    forgot_password,
    reset_password,
)

urlpatterns = [
    path('register/', register),
    path('login/', login),
    path('test-auth/', test_auth),
    path('profile/', profile),
    path('profile/<int:user_id>/', user_profile),

    path('forgot-password/', forgot_password),
    path('reset-password/', reset_password),
]