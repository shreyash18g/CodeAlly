from django.urls import path
from .views import register, login, test_auth, profile

urlpatterns = [
    path('register/', register),
    path('login/', login),
    path('test-auth/', test_auth),
    path('profile/', profile),
]