import os
from rest_framework import serializers
from .models import Resume, ResumeAnalysis, ResumeDraft, validate_resume_file


class ResumeAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeAnalysis
        fields = [
            'id',
            'overall_score',
            'ats_compatibility_score',
            'keyword_score',
            'content_quality_score',
            'measurable_impact_score',
            'formatting_score',
            'strengths',
            'weaknesses',
            'recommendations',
            'metrics_summary',
            'analyzed_at',
        ]
        read_only_fields = ['id', 'analyzed_at']


class ResumeSerializer(serializers.ModelSerializer):
    analysis = ResumeAnalysisSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()
    formatted_file_size = serializers.SerializerMethodField()
    extracted_skills = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id',
            'file',
            'file_name',
            'file_size',
            'formatted_file_size',
            'file_type',
            'file_url',
            'parsed_data',
            'extracted_skills',
            'is_parsed',
            'is_primary',
            'analysis',
            'uploaded_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'file_name',
            'file_size',
            'formatted_file_size',
            'file_type',
            'file_url',
            'parsed_data',
            'extracted_skills',
            'is_parsed',
            'is_primary',
            'analysis',
            'uploaded_at',
            'updated_at',
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_formatted_file_size(self, obj):
        bytes_size = obj.file_size or 0
        if bytes_size < 1024:
            return f"{bytes_size} B"
        elif bytes_size < 1024 * 1024:
            return f"{round(bytes_size / 1024, 1)} KB"
        return f"{round(bytes_size / (1024 * 1024), 2)} MB"

    def get_extracted_skills(self, obj):
        if obj.parsed_data and isinstance(obj.parsed_data, dict):
            return obj.parsed_data.get('skills', [])
        return []

    def validate_file(self, value):
        validate_resume_file(value)
        return value

    def create(self, validated_data):
        file_obj = validated_data['file']
        ext = os.path.splitext(file_obj.name)[1].lower().replace('.', '')
        validated_data['file_name'] = file_obj.name
        validated_data['file_size'] = file_obj.size
        validated_data['file_type'] = ext
        if 'user' not in validated_data and 'request' in self.context:
            validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ResumeDraftSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeDraft
        fields = [
            'id',
            'source_resume',
            'title',
            'target_role',
            'personal_info',
            'summary',
            'skills',
            'work_experience',
            'education',
            'projects',
            'certifications',
            'achievements',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']