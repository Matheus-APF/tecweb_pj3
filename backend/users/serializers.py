from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de novos usuários com validação de e-mail único e senha forte."""

    # Garante que a senha não seja retornada na resposta (write_only)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_email(self, value):
        # Normaliza o e-mail e verifica duplicidade ignorando maiúsculas/minúsculas
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return email

    def validate_password(self, value):
        # Aplica os validadores padrão configurados no settings.py do Django
        validate_password(value)
        return value

    def create(self, validated_data):
        # Usa create_user para garantir que a senha seja salva com hash
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    """Serializer para exibição segura dos dados públicos do usuário."""

    class Meta:
        model = User
        fields = ["id", "username", "email"]