import os
from django.http import FileResponse, Http404
from rest_framework import status, views, permissions
from rest_framework.response import Response
from .models import Resume
from .serializers import ResumeSerializer
from .parser import ResumeParser

class ResumeListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        resumes = Resume.objects.filter(user=request.user)
        serializer = ResumeSerializer(resumes, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response(
                {"error": "No file uploaded. Please attach a PDF or DOCX file."},
                status=status.HTTP_400_BAD_REQUEST
            )

        name, ext = os.path.splitext(file_obj.name)
        ext = ext.lower()
        if ext not in ['.pdf', '.docx']:
            return Response(
                {"error": "Invalid format. Only .pdf and .docx files are permitted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if file_obj.size > 10 * 1024 * 1024:
            return Response(
                {"error": "File size exceeds maximum threshold of 10MB."},
                status=status.HTTP_400_BAD_REQUEST
            )

        resume = Resume(
            user=request.user,
            file=file_obj,
            file_name=file_obj.name,
            file_size=file_obj.size,
            file_type=ext.replace('.', '')
        )
        resume.save()

        # Run extraction engine immediately upon upload
        try:
            parser = ResumeParser(resume.file.path)
            parsed_result = parser.parse()
            resume.raw_text = parser.raw_text
            resume.parsed_data = parsed_result
            resume.parse_status = 'parsed'
            resume.save()
        except Exception as err:
            resume.parse_status = 'failed'
            resume.parsed_data = {"error": str(err)}
            resume.save()

        serializer = ResumeSerializer(resume, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ResumeDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Resume.objects.get(pk=pk, user=user)
        except Resume.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        resume = self.get_object(pk, request.user)
        serializer = ResumeSerializer(resume, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        resume = self.get_object(pk, request.user)
        was_primary = resume.is_primary
        resume.delete()

        # Reassign primary to the latest remaining resume
        if was_primary:
            latest = Resume.objects.filter(user=request.user).first()
            if latest:
                latest.is_primary = True
                latest.save()

        return Response({"message": "Resume deleted successfully."}, status=status.HTTP_200_OK)


class ResumeParseView(views.APIView):
    """Explicitly re-runs parsing for an existing uploaded resume."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            parser = ResumeParser(resume.file.path)
            parsed_result = parser.parse()
            resume.raw_text = parser.raw_text
            resume.parsed_data = parsed_result
            resume.parse_status = 'parsed'
            resume.save()
            
            serializer = ResumeSerializer(resume, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            resume.parse_status = 'failed'
            resume.save()
            return Response({"error": f"Parsing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SetPrimaryResumeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)

        resume.is_primary = True
        resume.save()
        serializer = ResumeSerializer(resume, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class DownloadResumeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found."}, status=status.HTTP_404_NOT_FOUND)

        if not resume.file or not os.path.isfile(resume.file.path):
            return Response({"error": "File does not exist on storage."}, status=status.HTTP_404_NOT_FOUND)

        response = FileResponse(open(resume.file.path, 'rb'), content_type='application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{resume.file_name}"'
        return response