from django.urls import path

from .views import (
    get_all_problems,
    get_problem_by_number,
    get_admin_status,
    create_problem,
    delete_problem
)

urlpatterns = [

    path(
        '',
        get_all_problems
    ),

    path(
        '<int:problemNumber>/',
        get_problem_by_number
    ),

    path(
        'admin/',
        get_admin_status
    ),

    path(
        'admin/create/',
        create_problem
    ),

    path(
        'admin/delete/<int:problemNumber>/',
        delete_problem
    ),
]