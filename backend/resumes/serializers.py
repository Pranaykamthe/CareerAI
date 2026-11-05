import os
from rest_framework import serializers
from .models import Resume, validate_resume_file

class ResumeSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    formatted_file_size = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = (
            'id',
            'file',
            'file_name',
            'file_size',
            'file_type',
            'is_primary',
            'uploaded_at',
            'updated_at',
            'file_url',
            'formatted_file_size',
        )
        read_only_fields = ('id', 'file_name', 'file_size', 'file_type', 'uploaded_at', 'updated_at')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_formatted_file_size(self, obj):
        bytes_size = obj.file_size
        if bytes_size < 1024:
            return f"{bytes_size} B"
        elif bytes_size < 1024 * 1024:
            return f"{round(bytes_size / 1024, 1)} KB"
        else:
            return f"{round(bytes_size / (1024 * 1024), 2)} MB"

    def validate_file(self, value):
        validate_resume_file(value)
        return value

    def create(self, validated_data):
        file_obj = validated_data['file']
        ext = os.path.splitext(file_obj.name)[1].lower().replace('.', '')
        validated_data['file_name'] = file_obj.name
        validated_data['file_size'] = file_obj.size
        validated_data['file_type'] = ext
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)