from django.db import models


class Problem(models.Model):

    problemNumber = models.IntegerField(
        unique=True,
        db_index=True
    )

    title = models.CharField(
        max_length=255
    )

    description = models.TextField()

    input = models.TextField(
        blank=True,
        default=''
    )

    output = models.TextField(
        blank=True,
        default=''
    )

    hiddenTestCases = models.JSONField(
        default=list
    )

    difficulty = models.IntegerField()

    tags = models.JSONField(
        default=list
    )

    def __str__(self):
        return self.title