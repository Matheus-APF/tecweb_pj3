from django.conf import settings
from django.db import models


class Project(models.Model):
    """Representa um projeto pertencente a um usuário."""

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")  # Dono do projeto
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default="#2563EB")       # Código hexadecimal para identificação visual
    due_date = models.DateField(null=True, blank=True)              # Prazo opcional de entrega
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)            # Preenchido apenas na criação
    updated_at = models.DateTimeField(auto_now=True)                # Atualizado a cada modificação

    class Meta:
        ordering = ["-created_at"]  # Lista os projetos mais recentes primeiro

    def __str__(self):
        return self.title

class Task(models.Model):
    """Representa uma tarefa vinculada a um projeto."""

    class Status(models.TextChoices):
        TODO, DOING, DONE = ("todo", "To Do"), ("doing", "Doing"), ("done", "Feito")

    class Priority(models.TextChoices):
        LOW, MEDIUM, HIGH = ("low", "Baixa"), ("medium", "Média"), ("high", "Alta")

    class Size(models.TextChoices):
        XS, S, M, L, XL = ("XS", "XS"), ("S", "S"), ("M", "M"), ("L", "L"), ("XL", "XL")

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")  # Projeto pai
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    size = models.CharField(max_length=2, choices=Size.choices, default=Size.M)          # Estimativa estilo camiseta (T-shirt size)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)  # Esforço previsto em horas
    due_date = models.DateField(null=True, blank=True)                                   # Prazo opcional de entrega
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date", "created_at"]  # Ordena por prazo mais próximo e data de criação

    def __str__(self):
        return self.title