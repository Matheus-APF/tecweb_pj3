from django.urls import path
from .views import ProjectDetailView, ProjectListCreateView, ProjectTaskListCreateView, TaskDetailView

# Rotas de gerenciamento de projetos e suas tarefas vinculadas
urlpatterns = [
    path("projects/", ProjectListCreateView.as_view(), name="project-list-create"),                         # Lista ou cria projetos do usuário
    path("projects/<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),                         # Consulta, edita ou exclui um projeto
    path("projects/<int:project_id>/tasks/", ProjectTaskListCreateView.as_view(), name="project-tasks"),    # Lista ou cria tarefas dentro do projeto
    path("tasks/<int:pk>/", TaskDetailView.as_view(), name="task-detail"),                                  # Consulta, edita ou exclui uma tarefa
]