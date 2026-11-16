import re
from rest_framework import serializers
from .models import Project, Task


class TaskSerializer(serializers.ModelSerializer):
    """Serializer de tarefas com projeto definido via URL e validação de horas."""

    class Meta:
        model = Task
        fields = [
            "id", "project", "title", "description", "status", "priority",
            "size", "estimated_hours", "due_date", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "project", "created_at", "updated_at"]  # Projeto vem da URL, evitando troca indevida

    def validate_estimated_hours(self, value):
        if value is not None and value < 0:  # Impede valores negativos
            raise serializers.ValidationError("A estimativa de horas não pode ser negativa.")
        return value


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer de projetos com métricas automáticas de tarefas e progresso."""

    progress = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "owner", "title", "description", "color", "due_date",
            "notes", "progress", "tasks_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner", "progress", "tasks_count", "created_at", "updated_at"]

    def validate_color(self, value):
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", value):  # Valida padrão hexadecimal #RRGGBB
            raise serializers.ValidationError("A cor deve estar no formato #RRGGBB.")
        return value

    def get_progress(self, obj):
        tasks = list(obj.tasks.all())  # Aproveita prefetch_related se usado na view
        if not tasks:
            return 0
        done = sum(1 for t in tasks if t.status == Task.Status.DONE)
        return round(done / len(tasks) * 100)  # Percentual de tarefas concluídas

    def get_tasks_count(self, obj):
        return obj.tasks.count()