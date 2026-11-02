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
    
    code = request.data.get("code")
    input_data = request.data.get("input", "")

    if not code:
        return Response({"message": "Code is required"}, status=400)

    task = run_code_task.delay(code, input_data)
    return Response({"taskId": task.id, "status": "QUEUED"}, status=202)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_code_authenticated(request):
    
    code = request.data.get("code")
    input_data = request.data.get("input", "")

    if not code:
        return Response({"message": "Code is required"}, status=400)

    task = run_code_task.delay(code, input_data)
    return Response({"taskId": task.id, "status": "QUEUED"}, status=202)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_run_status(request, task_id):
    
    result = AsyncResult(task_id)

    if result.state == "PENDING":
        return Response({"status": "PENDING"}, status=200)

    if result.state == "FAILURE":
        
        return Response(
            {"status": "FAILURE", "message": str(result.result)},
            status=200,
        )

    if result.state == "SUCCESS":
        payload = result.result or {}
        return Response({"status": "SUCCESS", **payload}, status=200)

    # STARTED, RETRY, or any other intermediate Celery state
    return Response({"status": result.state}, status=200)
