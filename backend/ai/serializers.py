from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers


class GeneratePlanSerializer(serializers.Serializer):
    title = serializers.CharField(
        min_length=3,
        max_length=200,
        trim_whitespace=True,
    )
    description = serializers.CharField(
        min_length=10,
        max_length=2000,
        trim_whitespace=True,
    )
    deadline = serializers.DateField()
    daily_hours = serializers.FloatField(
        min_value=0.5,
        max_value=12.0,
    )
    level = serializers.ChoiceField(
        choices=["beginner", "intermediate", "advanced"]
    )

    def to_internal_value(self, data):
        # Normaliza 'level' para minúsculo antes de validar o ChoiceField
        if isinstance(data, dict) and isinstance(data.get("level"), str):
            data = {**data, "level": data["level"].strip().lower()}
        return super().to_internal_value(data)

    def validate_deadline(self, value):
        today = timezone.localdate()
        if value < today + timedelta(days=1):
            raise serializers.ValidationError(
                "O prazo deve ser posterior a hoje."
            )
        if value > today + timedelta(days=365):
            raise serializers.ValidationError(
                "O prazo máximo permitido para um plano é de 1 ano."
            )
        return value