from django.urls import path

from .views import submit_code
from .views import run_code

urlpatterns = [

    path(
        "submit/",
        submit_code
    ),
    path("run/", run_code),
]