import os

from celery import Celery

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "backend.settings"
)

app = Celery("backend")

app.config_from_object(
    "django.conf:settings",
    namespace="CELERY"
)

app.conf.broker_url = (
    "redis://localhost:6379/0"
)

app.conf.result_backend = (
    "redis://localhost:6379/0"
)

app.autodiscover_tasks()