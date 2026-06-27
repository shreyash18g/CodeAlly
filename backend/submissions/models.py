from django.db import models
from users.models import User


class Submission(models.Model):

    STATUS_CHOICES = [

        ("QUEUED", "QUEUED"),

        ("RUNNING", "RUNNING"),

        ("ACCEPTED", "ACCEPTED"),

        ("WRONG_ANSWER", "WRONG_ANSWER"),

        ("COMPILE_ERROR", "COMPILE_ERROR"),

        ("RUNTIME_ERROR", "RUNTIME_ERROR"),
        ("INTERNAL_ERROR", "INTERNAL_ERROR"),
        ("TIME_LIMIT_EXCEEDED",
         "TIME_LIMIT_EXCEEDED"),
    ]

    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    problemNumber = models.IntegerField()

    language = models.CharField(
        max_length=50
    )

    code = models.TextField()

    verdict = models.CharField(
        max_length=50,
        default="QUEUED"
    )

    runtime = models.FloatField(
        default=0
    )

    memory = models.IntegerField(
        default=0
    )

    error_message = models.JSONField(
    default=dict,
    blank=True
)
    created_at = models.DateTimeField(auto_now_add=True)