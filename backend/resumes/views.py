import os
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import FileResponse, Http404

from .models import Resume, ResumeAnalysis
from .serializers import ResumeSerializer, ResumeAnalysisSerializer
from .parser import extract_resume_data
from .analyzer import analyze_resume_text

class ResumeListCreateView(generics.ListCreateAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')
        ext = os.path.splitext(uploaded_file.name)[1].lower().replace('.', '')
        resume_instance = serializer.save(
            user=self.request.user,
            file_name=uploaded_file.name,
            file_size=uploaded_file.size,
            file_type=ext
        )
        # Automatically parse and run initial analysis on upload
        try:
            parsed_result = extract_resume_data(resume_instance.file.path, resume_instance.file_type)
            resume_instance.raw_text = parsed_result.get('raw_text', '')
            resume_instance.parsed_data = parsed_result
            resume_instance.is_parsed = True
            resume_instance.save()

            analysis_result = analyze_resume_text(resume_instance.raw_text, parsed_result)
            ResumeAnalysis.objects.update_or_create(
                resume=resume_instance,
                defaults=analysis_result
            )
        except Exception:
            pass


class ResumeDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)


class ResumeParseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            parsed_result = extract_resume_data(resume.file.path, resume.file_type)
            resume.raw_text = parsed_result.get('raw_text', '')
            resume.parsed_data = parsed_result
            resume.is_parsed = True
            resume.save()

            # Refresh analysis
            analysis_result = analyze_resume_text(resume.raw_text, parsed_result)
            analysis_obj, _ = ResumeAnalysis.objects.update_or_create(
                resume=resume,
                defaults=analysis_result
            )

            return Response({
                "message": "Resume parsed and analyzed successfully.",
                "resume": ResumeSerializer(resume, context={'request': request}).data,
                "analysis": ResumeAnalysisSerializer(analysis_obj).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to process resume: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResumeAnalyzeView(APIView):
    """
    GET: Returns current analysis report for resume.
    POST: Triggers a fresh ATS scoring and feedback calculation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(resume, 'analysis'):
            # Trigger analysis if not present
            if not resume.is_parsed:
                parsed = extract_resume_data(resume.file.path, resume.file_type)
                resume.raw_text = parsed.get('raw_text', '')
                resume.parsed_data = parsed
                resume.is_parsed = True
                resume.save()
            analysis_data = analyze_resume_text(resume.raw_text, resume.parsed_data)
            analysis = ResumeAnalysis.objects.create(resume=resume, **analysis_data)
        else:
            analysis = resume.analysis

        return Response(ResumeAnalysisSerializer(analysis).data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)

        if not resume.is_parsed:
            parsed = extract_resume_data(resume.file.path, resume.file_type)
            resume.raw_text = parsed.get('raw_text', '')
            resume.parsed_data = parsed
            resume.is_parsed = True
            resume.save()

        analysis_data = analyze_resume_text(resume.raw_text, resume.parsed_data)
        analysis, _ = ResumeAnalysis.objects.update_or_create(
            resume=resume,
            defaults=analysis_data
        )

        return Response(ResumeAnalysisSerializer(analysis).data, status=status.HTTP_200_OK)


class SetPrimaryResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
            Resume.objects.filter(user=request.user, is_primary=True).update(is_primary=False)
            resume.is_primary = True
            resume.save()
            return Response({"message": f"{resume.file_name} is now primary."}, status=status.HTTP_200_OK)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)


class DownloadResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
            if not os.path.exists(resume.file.path):
                raise Http404("File does not exist on disk.")
            return FileResponse(open(resume.file.path, 'rb'), as_attachment=True, filename=resume.file_name)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)