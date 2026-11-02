from django_ratelimit.decorators import ratelimit
from celery.result import AsyncResult
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from submissions.models import Submission
from .tasks import process_submission, run_code_task


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_code(request):
    data = request.data
    problemNumber = data.get("problemNumber")
    language = data.get("language")
    code = data.get("code")
    if not all([problemNumber, language, code]):
        return Response({"message": "Missing required fields"}, status=400)
    # 1. Register transaction into PostgreSQL
    submission = Submission.objects.create(
        userId=request.user,
        problemNumber=problemNumber,
        language=language,
        code=code,
        verdict="QUEUED"
    )
    # 2. Push task out to Redis Broker for Celery to consume
    process_submission.delay(submission.id)
    # 3. Respond instantly back to front-end polling listener loops
    return Response(
        {
            "submissionId": submission.id,
            "status": "QUEUED"
        },
        status=202
    )


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='10/m', method='POST', block=True)
def run_code_public(request):
    """Standalone open compiler / scratchpad feature. No login
    required. Rate-limited per IP (10 requests/minute).

    No longer executes inline -- pushes to Celery and returns
    immediately, same pattern as submit_code. This was the original
    architectural fix flagged during load testing: synchronous
    execution inside the Gunicorn request thread was the system's
    weakest point under concurrent load (54% success at just 100
    concurrent requests during spike testing). Moving it onto the same
    async pipeline submissions already use removes that bottleneck
    entirely -- Gunicorn threads are now freed immediately, and actual
    execution is bounded by the same Celery concurrency (16) that
    submissions already share.
    """
    code = request.data.get("code")
    input_data = request.data.get("input", "")

    if not code:
        return Response({"message": "Code is required"}, status=400)

    task = run_code_task.delay(code, input_data)
    return Response({"taskId": task.id, "status": "QUEUED"}, status=202)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_code_authenticated(request):
    """Problem-page 'Run against this test case' feature. Requires a
    logged-in user -- enforced server-side. Same async pattern as
    run_code_public above.
    """
    code = request.data.get("code")
    input_data = request.data.get("input", "")

    if not code:
        return Response({"message": "Code is required"}, status=400)

    task = run_code_task.delay(code, input_data)
    return Response({"taskId": task.id, "status": "QUEUED"}, status=202)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_run_status(request, task_id):
    """Polled by the frontend after either run_code endpoint returns a
    taskId. Mirrors the existing submission-status polling pattern in
    submissions/views.py (get_submission_status), just backed by
    Celery's result backend (Redis) instead of a DB row, since Run
    results are intentionally ephemeral.

    AllowAny here is fine: task IDs are opaque UUIDs, not sequential
    integers, so there's no meaningful enumeration risk the way there
    would be with e.g. /submissions/<int:pk>/. Knowing a task_id
    already implies you (or your browser) made that specific request.
    """
    result = AsyncResult(task_id)

    if result.state == "PENDING":
        return Response({"status": "PENDING"}, status=200)

    if result.state == "FAILURE":
        # Task itself raised an uncaught exception (infra-level, not
        # a normal COMPILE_ERROR/RUNTIME_ERROR verdict -- those are
        # caught and returned as normal dicts by run_code_task).
        return Response(
            {"status": "FAILURE", "message": str(result.result)},
            status=200,
        )

    if result.state == "SUCCESS":
        payload = result.result or {}
        return Response({"status": "SUCCESS", **payload}, status=200)

    # STARTED, RETRY, or any other intermediate Celery state
    return Response({"status": result.state}, status=200)