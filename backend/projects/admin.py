from django.contrib import admin
from .models import Project, Task


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Configuração de exibição e busca de projetos no Django Admin."""

    list_display = ["id", "title", "owner", "due_date", "created_at"]  # Colunas na listagem
    search_fields = ["title", "owner__username"]                        # Campos pesquisáveis


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Configuração de exibição, filtros e busca de tarefas no Django Admin."""

    list_display = ["id", "title", "project", "status", "priority", "due_date"]
    list_filter = ["status", "priority", "size"]                        # Filtros na barra lateral
    search_fields = ["title", "project__title"]                         # Busca por tarefa ou projeto pai