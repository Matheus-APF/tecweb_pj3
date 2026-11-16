"""CRUD e persistencia reais no banco de testes Django."""
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from projects.models import Project, Task


class ProjectTaskAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.owner = User.objects.create_user(username='owner', password='SenhaForte123!')
        self.other = User.objects.create_user(username='other', password='SenhaForte123!')
        self.client.force_authenticate(user=self.owner)
        self.project = Project.objects.create(owner=self.owner, title='Aprender React', color='#2563EB')
        self.task = Task.objects.create(project=self.project, title='Estudar JSX', status='todo', priority='high', size='M', estimated_hours=2)

    def test_create_project_persists_owner_in_database(self):
        response = self.client.post('/api/projects/', {'title':'Novo objetivo','color':'#112233'}, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        saved = Project.objects.get(pk=response.data['id'])
        self.assertEqual(saved.owner_id, self.owner.pk)
        self.assertEqual(saved.title, 'Novo objetivo')

    def test_project_list_only_own(self):
        Project.objects.create(owner=self.other, title='Privado')
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, 200)
        ids = [p['id'] for p in response.data]
        self.assertIn(self.project.pk, ids)
        self.assertEqual(len(ids), 1)

    def test_other_user_cannot_read_or_modify_project(self):
        self.client.force_authenticate(user=self.other)
        for method in ('get','patch','delete'):
            response = getattr(self.client, method)(f'/api/projects/{self.project.pk}/', **({'data':{'title':'Hack'},'format':'json'} if method=='patch' else {}))
            self.assertEqual(response.status_code, 404)
        self.assertTrue(Project.objects.filter(pk=self.project.pk).exists())

    def test_create_task_persists_and_updates_progress(self):
        response = self.client.post(f'/api/projects/{self.project.pk}/tasks/', {
            'title':'Criar componentes', 'status':'todo', 'priority':'medium', 'size':'S',
            'estimated_hours':'3.00', 'due_date':(timezone.localdate()+timedelta(days=3)).isoformat(),
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        saved = Task.objects.get(pk=response.data['id'])
        self.assertEqual(saved.project_id, self.project.pk)
        self.assertEqual(str(saved.estimated_hours), '3.00')
        self.client.patch(f'/api/tasks/{self.task.pk}/', {'status':'done'}, format='json')
        self.assertEqual(self.client.get(f'/api/projects/{self.project.pk}/').data['progress'], 50)

    def test_invalid_task_values_return_400_and_do_not_persist(self):
        before = Task.objects.count()
        response = self.client.post(f'/api/projects/{self.project.pk}/tasks/', {
            'title':'Invalida', 'status':'invalid', 'priority':'high', 'size':'M', 'estimated_hours':-1,
        }, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Task.objects.count(), before)

    def test_other_user_cannot_read_or_change_task(self):
        self.client.force_authenticate(user=self.other)
        for method in ('get','patch','delete'):
            response = getattr(self.client, method)(f'/api/tasks/{self.task.pk}/', **({'data':{'status':'done'},'format':'json'} if method=='patch' else {}))
            self.assertEqual(response.status_code, 404)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, 'todo')

    def test_delete_project_cascades_tasks(self):
        response = self.client.delete(f'/api/projects/{self.project.pk}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Project.objects.filter(pk=self.project.pk).exists())
        self.assertFalse(Task.objects.filter(pk=self.task.pk).exists())

    def test_requires_authentication(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get('/api/projects/').status_code, 401)
