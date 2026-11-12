from django.urls import path
from .views import (
    CandidateDashboardView,
    AdminOverviewView,
    AdminUserListView,
    AdminUserDetailView,
    AdminJobManageView,
    AdminJobDetailView,
    AdminQuestionManageView,
    AdminQuestionDetailView,
)

urlpatterns = [
    path('candidate/', CandidateDashboardView.as_view(), name='candidate-dashboard'),
    path('admin/overview/', AdminOverviewView.as_view(), name='admin-overview'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/jobs/', AdminJobManageView.as_view(), name='admin-jobs'),
    path('admin/jobs/<int:pk>/', AdminJobDetailView.as_view(), name='admin-job-detail'),
    path('admin/questions/', AdminQuestionManageView.as_view(), name='admin-questions'),
    path('admin/questions/<int:pk>/', AdminQuestionDetailView.as_view(), name='admin-question-detail'),
]