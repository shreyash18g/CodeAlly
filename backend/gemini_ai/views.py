import os
import google.generativeai as genai

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Configure Gemini
genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

# Feedback Endpoint
@api_view(['POST'])
def get_gemini_feedback(request):
    try:
        # Extract data from request body
        code = request.data.get('code', '')
        language = request.data.get('language', 'cpp')
        title = request.data.get('title', 'Untitled')
        description = request.data.get('description', 'No description provided.')
        input_data = request.data.get('input', '')
        output_data = request.data.get('output', '')

        # Initialize Gemini Model
        model = genai.GenerativeModel("gemini-2.5-flash")
        # Construct the Prompt cleanly with proper Python indentation
        prompt = f"""
        You are a code review assistant.

        A user has submitted a solution for:

        Problem Title:
        {title}

        Problem Description:
        {description}

        Sample Input:
        {input_data}

        Expected Output:
        {output_data}

        Language:
        {language}

        Code:
        ```{language}
        {code}
        ```

        Instructions:
        1. If code is empty, ask user to write a solution.
        2. If solution is inefficient, suggest improvements.
        3. Focus on algorithms and logic.
        4. Do not rewrite the entire solution.
        5. Keep feedback concise.
        """

        # Generate content via Gemini API
        response = model.generate_content(prompt)

        return Response(
            {"feedback": response.text},
            status=status.HTTP_200_OK
        )

    except Exception as e:
        print("Gemini error:", e)
        return Response(
            {"error": "Failed to get feedback from Gemini."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )