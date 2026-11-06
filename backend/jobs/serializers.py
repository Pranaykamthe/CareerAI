from rest_framework import serializers
from .models import Job

class JobSerializer(serializers.ModelSerializer):
    created_by_email = serializers.ReadOnlyField(source='created_by.email')

    class Meta:
        model = Job
        fields = [
            'id',
            'title',
            'company',
            'location',
            'job_type',
            'experience_level',
            'min_experience_years',
            'salary_range',
            'description',
            'required_skills',
            'preferred_skills',
            'responsibilities',
            'is_active',
            'created_by_email',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_email']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Job title cannot be blank.")
        return value

    def validate_company(self, value):
        if not value.strip():
            raise serializers.ValidationError("Company name cannot be blank.")
        return value

    def validate_required_skills(self, value):
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("Provide at least one required skill.")
        return [str(s).strip() for s in value if str(s).strip()]