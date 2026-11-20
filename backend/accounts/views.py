import os
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import Profile, validate_profile_photo
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    ProfileSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        Profile.objects.get_or_create(user=request.user)
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CandidateProfileView(APIView):
    """
    GET / PUT: Retrieve or update profile for any authenticated user (Candidate or Admin).
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, context={'request': request})
        user_info = {
            'id': request.user.id,
            'username': request.user.username,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
            'role': request.user.role,
            'phone': request.user.phone,
            'profile_photo_url': serializer.data.get('profile_photo_url'),
        }
        return Response({'user': user_info, 'profile': serializer.data}, status=status.HTTP_200_OK)

    def put(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)

        user_data = request.data.get('user', {}) if isinstance(request.data.get('user'), dict) else {}
        if 'username' in user_data and user_data['username'].strip():
            request.user.username = user_data['username'].strip()

        full_name = request.data.get('full_name') or user_data.get('full_name')
        if full_name and isinstance(full_name, str) and full_name.strip():
            parts = full_name.strip().split(' ', 1)
            request.user.first_name = parts[0][:150]
            request.user.last_name = parts[1][:150] if len(parts) > 1 else ''

        if 'phone' in user_data:
            request.user.phone = user_data['phone'].strip()
        elif 'phone' in request.data and isinstance(request.data.get('phone'), str):
            request.user.phone = request.data['phone'].strip()

        request.user.save()

        profile_data = request.data.get('profile', request.data)
        serializer = ProfileSerializer(profile, data=profile_data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Profile updated successfully',
                    'user': {
                        'id': request.user.id,
                        'username': request.user.username,
                        'first_name': request.user.first_name,
                        'last_name': request.user.last_name,
                        'email': request.user.email,
                        'role': request.user.role,
                        'phone': request.user.phone,
                        'profile_photo_url': serializer.data.get('profile_photo_url'),
                    },
                    'profile': serializer.data,
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfilePhotoView(APIView):
    """
    POST: Upload or replace profile photo for Candidate or Admin.
    DELETE: Remove current profile photo and delete file from storage.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        photo = (
            request.FILES.get('photo')
            or request.FILES.get('profile_photo')
            or request.FILES.get('file')
        )
        if not photo:
            return Response(
                {"error": "No image file provided. Please select a JPG, PNG, or WEBP photo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_profile_photo(photo)
        except DjangoValidationError as e:
            return Response({"error": e.messages[0]}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.profile_photo = photo
        profile.save()

        profile_serializer = ProfileSerializer(profile, context={'request': request})
        user_serializer = UserSerializer(request.user, context={'request': request})

        return Response(
            {
                "message": "Profile photo updated successfully.",
                "profile_photo_url": profile_serializer.data.get("profile_photo_url"),
                "user": user_serializer.data,
                "profile": profile_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if profile.profile_photo:
            try:
                if os.path.isfile(profile.profile_photo.path):
                    os.remove(profile.profile_photo.path)
            except (ValueError, OSError):
                pass
            profile.profile_photo = None
            profile.save()

        profile_serializer = ProfileSerializer(profile, context={'request': request})
        user_serializer = UserSerializer(request.user, context={'request': request})

        return Response(
            {
                "message": "Profile photo removed.",
                "profile_photo_url": None,
                "user": user_serializer.data,
                "profile": profile_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ForgotPasswordRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user_exists = User.objects.filter(email=email).exists()
        if not user_exists:
            return Response({'error': 'This email address is not registered.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'message': 'Password reset link sent successfully.'}, status=status.HTTP_200_OK)