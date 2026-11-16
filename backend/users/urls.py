from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import MeView, RegisterView


# Rotas de autenticação e perfil do usuário
urlpatterns = [
    path("register/", RegisterView.as_view()),        # Cadastro de novo usuário
    path("login/", TokenObtainPairView.as_view()),    # Gera tokens JWT (access e refresh)
    path("refresh/", TokenRefreshView.as_view()),     # Renova o token de acesso expirado
    path("me/", MeView.as_view()),                    # Dados do usuário autenticado
]