from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """Endpoint público para registro de novos usuários."""

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]  # Permite acesso sem autenticação


class MeView(generics.RetrieveAPIView):
    """Retorna os dados do usuário atualmente autenticado."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]  # Exige token JWT válido

    def get_object(self):
        return self.request.user  # Obtém o usuário direto da requisição (sem ID na URL)