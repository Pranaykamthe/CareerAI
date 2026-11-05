import os
from django.http import FileResponse, Http404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Resume
from .serializers import ResumeSerializer

class ResumeListCreateView(generics.ListCreateAPIView):
    """
    GET: List all resumes uploaded by the current authenticated user.
    POST: Upload a new resume (PDF or DOCX, max 10MB).
    """
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ResumeDetailDeleteView(generics.RetrieveDestroyAPIView):
    """
    GET: Retrieve specific resume details.
    DELETE: Remove resume record and delete physical file from disk.
    """
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

class SetPrimaryResumeView(APIView):
    """
    POST: Mark a specific resume as the active primary resume for analysis & matching.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)

        Resume.objects.filter(user=request.user).update(is_primary=False)
        resume.is_primary = True
        resume.save()

        serializer = ResumeSerializer(resume, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class DownloadResumeView(APIView):
    """
    GET: Securely download the user's resume file.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            raise Http404("Resume not found")

        if not resume.file or not os.path.exists(resume.file.path):
            raise Http404("File does not exist on disk")

        response = FileResponse(open(resume.file.path, 'rb'), as_attachment=True, filename=resume.file_name)
        return response