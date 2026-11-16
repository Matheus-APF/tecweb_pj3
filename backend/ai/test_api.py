"""Testes da IA: chamadas externas sempre simuladas por padrao."""
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ai.models import AIUsage
from ai.schemas import GeneratedPlan
from ai.services import AIServiceTimeoutError, AIInvalidResponseError

URL = '/api/ai/generate-plan/'


def valid_payload():
    return {
        'title': 'Aprender React',
        'description': 'Estudar componentes e construir uma aplicacao React.',
        'deadline': (timezone.localdate() + timedelta(days=30)).isoformat(),
        'daily_hours': 2,
        'level': 'beginner',
    }


def fake_plan():
    return GeneratedPlan.model_validate({
        'title': 'Aprender React',
        'tasks': [
            {'title': 'Estudar JSX', 'description': 'Praticar JSX', 'priority': 'high', 'size': 'S', 'estimated_hours': 2, 'order': 1},
            {'title': 'Criar componentes', 'description': 'Criar componentes', 'priority': 'medium', 'size': 'M', 'estimated_hours': 4, 'order': 2},
        ],
    })


@override_settings(AI_ENABLED=True, AI_USER_DAILY_TOKEN_LIMIT=25000, AI_GLOBAL_DAILY_TOKEN_LIMIT=500000)
class GeneratePlanAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='aiuser', email='ai@example.com', password='SenhaForte123!')
        self.client.force_authenticate(user=self.user)

    def test_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(URL, valid_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_deadline_returns_400_without_calling_gemini(self):
        payload = valid_payload()
        payload['deadline'] = (timezone.localdate() - timedelta(days=1)).isoformat()
        with patch('ai.views.generate_plan') as generate:
            response = self.client.post(URL, payload, format='json')
        self.assertEqual(response.status_code, 400)
        generate.assert_not_called()

    @override_settings(AI_ENABLED=False)
    def test_kill_switch_returns_503(self):
        with patch('ai.views.count_plan_input_tokens') as count:
            response = self.client.post(URL, valid_payload(), format='json')
        self.assertEqual(response.status_code, 503)
        count.assert_not_called()

    @patch('ai.views.generate_plan')
    @patch('ai.views.count_plan_input_tokens', return_value=300)
    def test_success_returns_preview_and_records_consumption(self, count, generate):
        generate.return_value = (fake_plan(), SimpleNamespace(prompt_token_count=300, candidates_token_count=450))
        response = self.client.post(URL, valid_payload(), format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertIs(response.data['saved'], False)
        self.assertEqual(len(response.data['tasks']), 2)
        self.assertEqual(response.data['tasks'][0]['order'], 1)
        self.assertLessEqual(response.data['tasks'][-1]['due_date'], valid_payload()['deadline'])
        usage = AIUsage.objects.get(user=self.user)
        self.assertEqual(usage.status, AIUsage.Status.COMPLETED)
        self.assertEqual(usage.input_tokens, 300)
        self.assertEqual(usage.output_tokens, 450)
        generate.assert_called_once()

    @override_settings(AI_USER_DAILY_TOKEN_LIMIT=100)
    @patch('ai.views.generate_plan')
    @patch('ai.views.count_plan_input_tokens', return_value=300)
    def test_quota_returns_429_without_generation(self, count, generate):
        response = self.client.post(URL, valid_payload(), format='json')
        self.assertEqual(response.status_code, 429)
        generate.assert_not_called()

    @patch('ai.views.generate_plan', side_effect=AIServiceTimeoutError('timeout'))
    @patch('ai.views.count_plan_input_tokens', return_value=300)
    def test_timeout_returns_504_and_marks_failed(self, count, generate):
        response = self.client.post(URL, valid_payload(), format='json')
        self.assertEqual(response.status_code, 504)
        self.assertEqual(AIUsage.objects.get(user=self.user).status, AIUsage.Status.FAILED)

    @patch('ai.views.generate_plan', side_effect=AIInvalidResponseError('invalid'))
    @patch('ai.views.count_plan_input_tokens', return_value=300)
    def test_invalid_ai_response_returns_422(self, count, generate):
        response = self.client.post(URL, valid_payload(), format='json')
        self.assertEqual(response.status_code, 422)
        self.assertEqual(AIUsage.objects.get(user=self.user).status, AIUsage.Status.FAILED)
