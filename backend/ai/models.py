from django.conf import settings
from django.db import models


class AIUsage(models.Model):
    class Status(models.TextChoices):
        RESERVED = "reserved", "Reservado"
        COMPLETED = "completed", "Concluído"
        FAILED = "failed", "Falhou"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_usages",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    model_name = models.CharField(max_length=100)

    input_tokens = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)
    reserved_tokens = models.PositiveIntegerField(default=0)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.RESERVED,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            # Otimiza checagem de limite por usuário no período (ex: diário/mensal)
            models.Index(fields=["user", "status", "created_at"]),
            # Otimiza checagem de quota global da aplicação
            models.Index(fields=["status", "created_at"]),
        ]

    @property
    def total_tokens(self) -> int:
        if self.status == self.Status.COMPLETED:
            return self.input_tokens + self.output_tokens
        if self.status == self.Status.RESERVED:
            return self.reserved_tokens
        return 0

    def __str__(self) -> str:
        user_label = self.user_id or "deleted-user"
        return f"AIUsage(user={user_label}, model={self.model_name}, status={self.status}, tokens={self.total_tokens})"