from django.urls import path
from .views import submit_code
from .views import run_code_public, run_code_authenticated, get_run_status

urlpatterns = [
    path(
        "submit/",
        submit_code
    ),
    # Public, unauthenticated, IP-rate-limited (10/min) -- standalone
    # open compiler / scratchpad feature. Now async: returns a taskId
    # immediately instead of executing inline.
    path("run/", run_code_public),
    # Authenticated -- problem-page "Run against this test case"
    # feature. Also async now.
    path("run/authenticated/", run_code_authenticated),
    # Polled by the frontend with the taskId returned by either
    # run endpoint above, until status is SUCCESS/FAILURE.
    path("run-status/<str:task_id>/", get_run_status),
]