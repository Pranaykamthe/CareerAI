from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Check if careerai_backend/views.py exists; otherwise define a direct fallback view
try:
    from .views import health_check
except ImportError:
    from rest_framework.decorators import api_view, permission_classes
    from rest_framework.permissions import AllowAny
    from rest_framework.response import Response

    @api_view(['GET'])
    @permission_classes([AllowAny])
    def health_check(request):
        return Response({
            "status": "healthy",
            "service": "CareerAI Backend API",
            "version": "1.0.0"
        })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='api-health-check'),
    path('api/auth/', include('accounts.urls')),
    path('api/resumes/', include('resumes.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/applications/', include('applications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)