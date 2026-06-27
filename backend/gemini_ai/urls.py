from django.urls import path

from .views import get_gemini_feedback

urlpatterns = [

    path(
        'feedback/',
        get_gemini_feedback
    ),
]