from django.urls import path

from .views import update_verdict
from .views import get_submission_status, get_submission_history
from .views import get_submission_details
urlpatterns = [

    path(
        'verdict/',
        update_verdict
    ),
    path('<int:pk>/', get_submission_status),
    path('history/', get_submission_history),
    path(
    "details/<int:pk>/",
    get_submission_details
),
]