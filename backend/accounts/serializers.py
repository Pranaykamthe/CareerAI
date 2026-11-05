from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User, Profile

class ProfileSerializer(serializers.ModelSerializer):
    completion_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Profile
        fields = (
            'id',
            'headline',
            'target_role',
            'bio',
            'experience_years',
            'location',
            'linkedin_url',
            'github_url',
            'portfolio_url',
            'skills_list',
            'education',
            'experience',
            'completion_percentage',
            'updated_at',
        )

    def validate_skills_list(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Skills must be a list of strings.")
        return [str(skill).strip() for skill in value if str(skill).strip()]

    def validate_education(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Education must be a list of entries.")
        return value

    def validate_experience(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Experience must be a list of entries.")
        return value


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone', 'created_at', 'profile')
        read_only_fields = ('id', 'created_at', 'profile')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'confirm_password', 'role', 'phone')
        extra_kwargs = {
            'role': {'default': 'candidate'}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        role = validated_data.get('role', 'candidate')
        user = User.objects.create_user(
            username=validated_data.get('username'),
            email=validated_data.get('email'),
            password=validated_data.get('password'),
            role=role,
            phone=validated_data.get('phone', '')
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['username'] = user.username
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'role': self.user.role,
        }
        return data