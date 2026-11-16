from rest_framework import generics
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from .models import Project, Task
from .serializers import ProjectSerializer
from .serializers import TaskSerializer

class ProjectListCreateView(generics.ListCreateAPIView):
    """Lista e cria projetos pertencentes ao usuário autenticado."""

    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtra por dono e pré-carrega tarefas para evitar queries N+1 em progress/tasks_count
        return Project.objects.filter(owner=self.request.user).prefetch_related("tasks")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)  # Associa o usuário logado como dono automaticamente


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Consulta, atualiza ou remove um projeto específico do usuário."""

    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user).prefetch_related("tasks")


    from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Project, Task
from .serializers import TaskSerializer


class ProjectTaskListCreateView(generics.ListCreateAPIView):
    """Lista e cria tarefas garantindo isolamento de posse pelo projeto pai."""

    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_project(self):
        # Garante que o projeto exista e pertença ao usuário autenticado (bloqueia acesso de terceiros com 404)
        return get_object_or_404(Project, pk=self.kwargs["project_id"], owner=self.request.user)

    def get_queryset(self):
        # Exige posse do projeto antes de retornar suas tarefas
        return Task.objects.filter(project=self.get_project())

    def perform_create(self, serializer):
        # Define o projeto via ID da URL no backend, impedindo associação arbitrária pelo cliente
        serializer.save(project=self.get_project())


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Consulta, edita ou exclui uma tarefa individual restringindo acesso ao dono do projeto."""

    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtra pelo dono do projeto pai para impedir visualização, edição ou exclusão por outros usuários
        return Task.objects.filter(project__owner=self.request.user)