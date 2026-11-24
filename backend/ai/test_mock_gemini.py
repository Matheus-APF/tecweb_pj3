import json
from unittest.mock import patch, MagicMock
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
class TestGeminiMockIntegration:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="brena_test", password="StrongPassword123!")
        self.client.force_authenticate(user=self.user)

    @patch("ai.services.genai")
    def test_geracao_plano_com_resposta_simulada_valida(self, mock_genai):
        resposta_fake = {
            "titulo": "Estudar Arquitetura Web",
            "descricao": "Plano semanal estruturado",
            "tarefas": [
                {"titulo": "Configurar Django REST", "prioridade": "ALTA", "estimativa_horas": 2},
                {"titulo": "Criar componentes React", "prioridade": "MEDIA", "estimativa_horas": 3},
            ],
        }
        mock_response = MagicMock()
        mock_response.text = json.dumps(resposta_fake)
        mock_genai.Client.return_value.models.generate_content.return_value = mock_response

        # Ajuste a URL abaixo se a rota em ai/urls.py tiver outro slug
        response = self.client.post(
            "/api/ai/generate/",
            {"objetivo": "Aprender Django e React", "prazo_dias": 7},
            format="json",
        )

        assert response.status_code in (200, 201)
        assert "tarefas" in response.data

    @patch("ai.services.genai")
    def test_validacao_resposta_invalida_da_ia(self, mock_genai):
        mock_response = MagicMock()
        mock_response.text = "resposta_nao_json_invalida"
        mock_genai.Client.return_value.models.generate_content.return_value = mock_response

        response = self.client.post(
            "/api/ai/generate/",
            {"objetivo": "Teste de falha", "prazo_dias": 5},
            format="json",
        )

        assert response.status_code in (400, 422, 502)