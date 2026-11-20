from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User, Profile, validate_profile_photo


class ProfileSerializer(serializers.ModelSerializer):
    completion_percentage = serializers.ReadOnlyField()
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            'id',
            'profile_photo',
            'profile_photo_url',
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

    def get_profile_photo_url(self, obj):
        if obj.profile_photo and hasattr(obj.profile_photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            return obj.profile_photo.url
        return None

    def validate_profile_photo(self, value):
        if value:
            validate_profile_photo(value)
        return value

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
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            'phone',
            'profile_photo_url',
            'created_at',
            'profile',
        )
        read_only_fields = ('id', 'created_at', 'profile', 'profile_photo_url')

    def get_profile_photo_url(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile and profile.profile_photo and hasattr(profile.profile_photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(profile.profile_photo.url)
            return profile.profile_photo.url
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=False)
    password_confirm = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'confirm_password', 'password_confirm', 'role', 'phone')
        extra_kwargs = {
            'role': {'default': 'candidate'}
        }

    def validate(self, attrs):
        confirm = attrs.get('confirm_password') or attrs.get('password_confirm')
        if not confirm:
            raise serializers.ValidationError({"confirm_password": "Password confirmation is required."})
        if attrs['password'] != confirm:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        validated_data.pop('password_confirm', None)
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
        profile = getattr(self.user, 'profile', None)
        photo_url = None
        if profile and profile.profile_photo and hasattr(profile.profile_photo, 'url'):
            request = self.context.get('request')
            photo_url = (
                request.build_absolute_uri(profile.profile_photo.url)
                if request
                else profile.profile_photo.url
            )

        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'profile_photo_url': photo_url,
        }
        return data