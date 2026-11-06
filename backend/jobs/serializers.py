from rest_framework import serializers
from .models import Job, JobMatch

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class JobMatchSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    resume_file_name = serializers.CharField(source='resume.file_name', read_only=True)

    class Meta:
        model = JobMatch
        fields = (
            'id',
            'job',
            'resume',
            'resume_file_name',
            'match_score',
            'skill_score',
            'experience_score',
            'keyword_score',
            'matched_skills',
            'missing_skills',
            'preferred_matched_skills',
            'match_level',
            'summary',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')