from datetime import date, timedelta
from math import ceil
from typing import Any

from django.utils import timezone


class ScheduleOverflowError(ValueError):
    """Lançada quando o total de horas do plano excede a disponibilidade até o prazo."""


def calculate_available_hours(
    deadline: date,
    daily_hours: float,
    start_date: date | None = None,
) -> tuple[int, float]:
    base_date = start_date or timezone.localdate()
    available_days = (deadline - base_date).days

    if available_days < 1:
        raise ValueError("O prazo deve ser pelo menos 1 dia após a data inicial.")

    available_hours = round(available_days * daily_hours, 4)
    return available_days, available_hours


def schedule_tasks(
    plan: Any,
    deadline: date,
    daily_hours: float,
    start_date: date | None = None,
) -> dict[str, Any]:
    base_date = start_date or timezone.localdate()
    tasks = sorted(plan.tasks, key=lambda t: t.order)

    if len({t.order for t in tasks}) != len(tasks):
        raise ValueError("Ordens de tarefas duplicadas.")

    available_days, available_hours = calculate_available_hours(
        deadline=deadline,
        daily_hours=daily_hours,
        start_date=base_date,
    )

    total_hours = round(sum(t.estimated_hours for t in tasks), 4)

    if total_hours > available_hours + 1e-6:
        raise ScheduleOverflowError(
            f"O planejamento requer {total_hours:g}h, mas há apenas {available_hours:g}h disponíveis até {deadline.isoformat()}."
        )

    elapsed_hours = 0.0
    scheduled_tasks = []

    for task in tasks:
        # Dia em que a tarefa começa (bloco atual de trabalho)
        start_day_offset = int(round(elapsed_hours / daily_hours, 6))
        task_start_date = min(base_date + timedelta(days=start_day_offset), deadline)

        elapsed_hours = round(elapsed_hours + task.estimated_hours, 6)

        # Dia em que a tarefa termina (evita erro de ponto flutuante no ceil)
        end_day_offset = max(1, ceil(round(elapsed_hours / daily_hours, 6)))
        task_due_date = min(base_date + timedelta(days=end_day_offset), deadline)

        scheduled_tasks.append({
            **task.model_dump(exclude={"order"}),
            "order": task.order,
            "start_date": task_start_date.isoformat(),
            "due_date": task_due_date.isoformat(),
        })

    return {
        "title": plan.title,
        "start_date": base_date.isoformat(),
        "deadline": deadline.isoformat(),
        "daily_hours": daily_hours,
        "available_days": available_days,
        "available_hours": available_hours,
        "total_estimated_hours": total_hours,
        "tasks": scheduled_tasks,
    }