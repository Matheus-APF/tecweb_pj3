from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


class AuthenticationAPITests(APITestCase):
    def test_register_login_refresh_and_me(self):
        payload = {'username':'newuser','email':'new@example.com','password':'SenhaForte123!'}
        response = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(get_user_model().objects.filter(username='newuser').exists())
        login = self.client.post('/api/auth/login/', {'username':'newuser','password':'SenhaForte123!'}, format='json')
        self.assertEqual(login.status_code, 200, login.data)
        self.assertIn('access', login.data)
        self.assertIn('refresh', login.data)
        refresh = self.client.post('/api/auth/refresh/', {'refresh':login.data['refresh']}, format='json')
        self.assertEqual(refresh.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        me = self.client.get('/api/auth/me/')
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data['username'], 'newuser')

    def test_wrong_password_is_rejected(self):
        get_user_model().objects.create_user(username='test', password='SenhaForte123!')
        response = self.client.post('/api/auth/login/', {'username':'test','password':'errada'}, format='json')
        self.assertEqual(response.status_code, 401)

    def test_duplicate_email_is_rejected(self):
        get_user_model().objects.create_user(username='first',email='same@example.com',password='SenhaForte123!')
        response = self.client.post('/api/auth/register/', {'username':'second','email':'SAME@example.com','password':'SenhaForte123!'},format='json')
        self.assertEqual(response.status_code, 400)
