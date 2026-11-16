from datetime import timedelta
from django.test import SimpleTestCase
from django.utils import timezone
from pydantic import ValidationError
from ai.schemas import GeneratedPlan
from ai.scheduling import ScheduleOverflowError, schedule_tasks


class PlanLogicTests(SimpleTestCase):
    def test_normalizes_priority_size_and_sorts(self):
        plan = GeneratedPlan.model_validate({'title':'Teste','tasks':[
            {'title':'Segundo passo','priority':' MEDIUM ','size':' m ','estimated_hours':2,'order':2},
            {'title':'Primeiro passo','priority':' HIGH ','size':' s ','estimated_hours':1,'order':1},
        ]})
        self.assertEqual([t.order for t in plan.tasks], [1,2])
        self.assertEqual(plan.tasks[0].priority, 'high')
        self.assertEqual(plan.tasks[0].size, 'S')

    def test_rejects_duplicate_order(self):
        with self.assertRaises(ValidationError):
            GeneratedPlan.model_validate({'title':'Teste','tasks':[
                {'title':'Tarefa um','priority':'high','size':'S','estimated_hours':1,'order':1},
                {'title':'Tarefa dois','priority':'low','size':'S','estimated_hours':1,'order':1},
            ]})

    def test_rejects_invalid_priority(self):
        with self.assertRaises(ValidationError):
            GeneratedPlan.model_validate({'title':'Teste','tasks':[
                {'title':'Tarefa um','priority':'urgent','size':'S','estimated_hours':1,'order':1},
            ]})

    def test_dates_fit_deadline(self):
        plan = GeneratedPlan.model_validate({'title':'Teste','tasks':[
            {'title':'Tarefa um','priority':'high','size':'S','estimated_hours':2,'order':1},
        ]})
        deadline = timezone.localdate() + timedelta(days=3)
        result = schedule_tasks(plan, deadline=deadline, daily_hours=1)
        self.assertLessEqual(result['tasks'][0]['due_date'], deadline.isoformat())

    def test_schedule_overflow(self):
        plan = GeneratedPlan.model_validate({'title':'Teste','tasks':[
            {'title':'Tarefa grande','priority':'high','size':'L','estimated_hours':20,'order':1},
        ]})
        with self.assertRaises(ScheduleOverflowError):
            schedule_tasks(plan, deadline=timezone.localdate()+timedelta(days=1), daily_hours=1)
