from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import Profile
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
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CandidateProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile)
        user_info = {
            'username': request.user.username,
            'email': request.user.email,
            'phone': request.user.phone,
        }
        return Response({'user': user_info, 'profile': serializer.data}, status=status.HTTP_200_OK)

    def put(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        
        # Optionally allow updating candidate name and phone
        user_data = request.data.get('user', {})
        if 'username' in user_data and user_data['username'].strip():
            request.user.username = user_data['username'].strip()
        if 'phone' in user_data:
            request.user.phone = user_data['phone'].strip()
        request.user.save()

        profile_data = request.data.get('profile', request.data)
        serializer = ProfileSerializer(profile, data=profile_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Profile updated successfully',
                    'user': {
                        'username': request.user.username,
                        'email': request.user.email,
                        'phone': request.user.phone,
                    },
                    'profile': serializer.data,
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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