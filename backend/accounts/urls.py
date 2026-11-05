from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    CurrentUserView,
    CandidateProfileView,
    ForgotPasswordRequestView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('profile/', CandidateProfileView.as_view(), name='candidate-profile'),
    path('forgot-password/', ForgotPasswordRequestView.as_view(), name='forgot-password'),
]