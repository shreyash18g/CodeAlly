from django.urls import path

from .views import get_leaderboard

urlpatterns = [

    path(
        '',
        get_leaderboard
    ),
]