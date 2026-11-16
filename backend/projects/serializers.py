import re
from rest_framework import serializers
from .models import Project, Task


class TaskSerializer(serializers.ModelSerializer):
    """Serializer de tarefas com validação de posse do projeto e horas positivas."""

    class Meta:
        model = Task
        fields = [
            "id", "project", "title", "description", "status", "priority",
            "size", "estimated_hours", "due_date", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]  # Gerenciados automaticamente

    def validate_estimated_hours(self, value):
        if value is not None and value < 0:  # Impede estimativas negativas
            raise serializers.ValidationError("A estimativa de horas não pode ser negativa.")
        return value

    def validate_project(self, value):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Usuário não autenticado.")
        if value.owner_id != request.user.id:  # Garante que o usuário seja dono do projeto
            raise serializers.ValidationError("Projeto inválido.")
        return value


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer de projetos com validação de cor hexadecimal."""

    class Meta:
        model = Project
        fields = ["id", "owner", "title", "description", "color", "due_date", "notes", "created_at", "updated_at"]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]  # Owner é definido na view

    def validate_color(self, value):
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", value):  # Valida padrão #RRGGBB
            raise serializers.ValidationError("A cor deve estar no formato hexadecimal #RRGGBB.")
        return value