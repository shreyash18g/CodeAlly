from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from submissions.models import Submission
from .tasks import process_submission

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


import shutil
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated # Ensure user is logged in
from rest_framework.response import Response

from judge.executors.cpp_executor import (
    prepare_submission,
    write_input
)
from judge.executors.compiler import (
    compile_cpp
)
from judge.executors.runner import (
    run_binary
)
from judge.exceptions import (
    CompileError,
    RuntimeErrorJudge,
    TimeLimitExceeded
)

@api_view(['POST'])
@permission_classes([AllowAny]) # Secure this workspace runner view
def run_code(request):
    code = request.data.get("code")
    input_data = request.data.get("input", "")

    if not code:
        return Response(
            {"message": "Code is required"},
            status=400
        )

    # 1. Initialize host temporary path directory maps safely with relaxed permissions
    temp_dir = prepare_submission(code)

    try:
        # 2. Attempt Compilation first
        try:
            compile_cpp(temp_dir)
        except CompileError as e:
            return Response({
                "verdict": "COMPILE_ERROR",
                "output": str(e)
            }, status=200)

        # 3. Mount text input stream directly to disk workspace layer after compilation passes
        write_input(temp_dir, input_data)

        # 4. Trigger unprivileged sandbox run-time container execution
        try:
            result = run_binary(temp_dir)
        except RuntimeErrorJudge as e:
            return Response({
                "verdict": "RUNTIME_ERROR",
                "output": str(e)
            }, status=200)
        except TimeLimitExceeded as e:
            return Response({
                "verdict": "TIME_LIMIT_EXCEEDED",
                "output": "Time Limit Exceeded (Capped at 2 seconds)."
            }, status=200)

        # 5. Clean Accepted Return
        return Response({
            "verdict": "SUCCESS",
            "output": result["output"],
            "runtime": result.get("runtime", 0),
            "memory": result.get("memory", 0)
        }, status=200)

    finally:
        # Ensure temporary disk space paths drop cleanly under all exit conditions
        shutil.rmtree(temp_dir, ignore_errors=True)