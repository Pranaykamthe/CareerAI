from django.urls import path
from .views import (
    ApplicationListCreateView,
    ApplicationDetailView,
    SkillGapAnalysisView,
)

urlpatterns = [
    path('', ApplicationListCreateView.as_view(), name='application-list-create'),
    path('<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
    path('gap/<int:job_id>/', SkillGapAnalysisView.as_view(), name='skill-gap-analysis'),
]