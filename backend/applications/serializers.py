from rest_framework import serializers
from .models import JobApplication
from jobs.models import Job
from jobs.serializers import JobSerializer
from resumes.models import Resume

class JobApplicationSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(),
        source='job',
        write_only=True
    )

    class Meta:
        model = JobApplication
        fields = (
            'id',
            'user',
            'job',
            'job_id',
            'job_details',
            'status',
            'notes',
            'applied_date',
            'updated_at',
        )
        read_only_fields = ('id', 'user', 'applied_date', 'updated_at')

    def create(self, validated_data):
        user = self.context['request'].user
        job = validated_data.get('job')
        status = validated_data.get('status', 'Saved')
        notes = validated_data.get('notes', '')

        application, created = JobApplication.objects.update_or_create(
            user=user,
            job=job,
            defaults={'status': status, 'notes': notes}
        )
        return application