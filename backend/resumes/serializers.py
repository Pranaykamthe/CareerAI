from rest_framework import serializers
from .models import Resume

class ResumeSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    extracted_skills = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id',
            'file',
            'file_name',
            'file_size',
            'file_type',
            'is_primary',
            'parse_status',
            'parsed_data',
            'extracted_skills',
            'uploaded_at',
            'updated_at',
            'download_url',
        ]
        read_only_fields = [
            'id', 'file_name', 'file_size', 'file_type', 
            'is_primary', 'parse_status', 'parsed_data', 
            'uploaded_at', 'updated_at', 'download_url'
        ]

    def get_download_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_extracted_skills(self, obj):
        if obj.parsed_data and isinstance(obj.parsed_data, dict):
            return obj.parsed_data.get('skills', [])
        return []