from rest_framework import serializers
from .models import Resume, ResumeAnalysis

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
            'analyzed_at'
        ]
        read_only_fields = ['id', 'analyzed_at']


class ResumeSerializer(serializers.ModelSerializer):
    analysis = ResumeAnalysisSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id',
            'file',
            'file_name',
            'file_size',
            'file_type',
            'file_url',
            'parsed_data',
            'is_parsed',
            'is_primary',
            'analysis',
            'uploaded_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'file_name',
            'file_size',
            'file_type',
            'file_url',
            'parsed_data',
            'is_parsed',
            'is_primary',
            'analysis',
            'uploaded_at',
            'updated_at'
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None