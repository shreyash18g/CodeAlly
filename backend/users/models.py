from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager


class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):

        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            **extra_fields
        )

        user.set_password(password)

        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        return self.create_user(
            email,
            password,
            **extra_fields
        )


class User(AbstractUser):

    username = None

    firstname = models.CharField(max_length=100)

    lastname = models.CharField(max_length=100)

    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        default='user'
    )

    solvedProblems = models.JSONField(
        default=list
    )

    # --- Added your new fields here ---
    resetToken = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    resetTokenExpiry = models.DateTimeField(
        null=True,
        blank=True
    )
    # ----------------------------------

    USERNAME_FIELD = 'email'

    REQUIRED_FIELDS = []

    objects = UserManager()