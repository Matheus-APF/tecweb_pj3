"""Teste opcional de integracao real: habilitar somente explicitamente."""
import os
from datetime import timedelta
from unittest import skipUnless
import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

@pytest.mark.gemini_live
@skipUnless(os.getenv('RUN_GEMINI_LIVE') == '1', 'Gemini real desabilitado: RUN_GEMINI_LIVE != 1')
@override_settings(AI_ENABLED=True, AI_USER_DAILY_TOKEN_LIMIT=25000, AI_GLOBAL_DAILY_TOKEN_LIMIT=500000)
class GeminiLiveTests(APITestCase):
    def test_real_plan_once(self):
        if not os.getenv('GEMINI_API_KEY'):
            self.fail('RUN_GEMINI_LIVE=1 exige GEMINI_API_KEY')
        user = get_user_model().objects.create_user(username='liveuser', password='SenhaForte123!')
        self.client.force_authenticate(user=user)
        response = self.client.post('/api/ai/generate-plan/', {
            'title':'Aprender React',
            'description':'Aprender componentes React e criar uma aplicacao pequena.',
            'deadline':(timezone.localdate()+timedelta(days=30)).isoformat(),
            'daily_hours':2,
            'level':'beginner',
        }, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertGreater(len(response.data['tasks']), 0)
        self.assertFalse(response.data['saved'])
