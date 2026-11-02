from django.urls import path
from .views import submit_code
from .views import run_code_public, run_code_authenticated, get_run_status

urlpatterns = [
    path(
        "submit/",
        submit_code
    ),
    
    path("run/", run_code_public),
    
    path("run/authenticated/", run_code_authenticated),
    
    path("run-status/<str:task_id>/", get_run_status),
]
