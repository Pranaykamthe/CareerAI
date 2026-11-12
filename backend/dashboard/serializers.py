from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    resumes_count = serializers.IntegerField(source='resumes.count', read_only=True)
    applications_count = serializers.IntegerField(source='applications.count', read_only=True)
    interviews_count = serializers.IntegerField(source='interview_sessions.count', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'is_active',
            'date_joined',
            'last_login',
            'resumes_count',
            'applications_count',
            'interviews_count',
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'last_login']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username or obj.email.split('@')[0]