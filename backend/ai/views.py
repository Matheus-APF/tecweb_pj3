import logging
import os
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import Case, F, IntegerField, Sum, When
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AIUsage
from .scheduling import ScheduleOverflowError, schedule_tasks
from .serializers import GeneratePlanSerializer
from .services import (
    AIInputTooLongError,
    AIInvalidResponseError,
    AIServiceConfigError,
    AIServiceTimeoutError,
    AIServiceUnavailableError,
    count_plan_input_tokens,
    generate_plan,
)

logger = logging.getLogger(__name__)


class QuotaExceededError(Exception):
    """Limite de consumo do usuário ou quota global atingido."""


def _is_ai_enabled() -> bool:
    # Permite bloqueio manual via settings.py ou variável de ambiente AI_ENABLED
    flag = getattr(settings, "AI_ENABLED", os.getenv("AI_ENABLED", "true"))
    if isinstance(flag, bool):
        return flag
    return str(flag).strip().lower() in ("1", "true", "yes", "on")


def _get_consumed_tokens(queryset) -> int:
    """
    Soma tokens reais de requisições concluídas e tokens reservados de
    requisições em andamento (ignorando reservas órfãs com mais de 2 minutos).
    """
    stale_cutoff = timezone.now() - timedelta(minutes=2)

    result = queryset.aggregate(
        total=Sum(
            Case(
                When(
                    status=AIUsage.Status.COMPLETED,
                    then=F("input_tokens") + F("output_tokens"),
                ),
                When(
                    status=AIUsage.Status.RESERVED,
                    created_at__gte=stale_cutoff,
                    then=F("reserved_tokens"),
                ),
                default=0,
                output_field=IntegerField(),
            )
        )
    )
    return result["total"] or 0


def _reserve_quota(user, model_name: str, estimated_tokens: int) -> AIUsage:
    """
    Verifica limites do usuário e quota global de forma atômica e cria a reserva.
    """
    user_daily_limit = int(
        getattr(settings, "AI_USER_DAILY_TOKEN_LIMIT", os.getenv("AI_USER_DAILY_TOKEN_LIMIT", "25000"))
    )
    global_daily_limit = int(
        getattr(settings, "AI_GLOBAL_DAILY_TOKEN_LIMIT", os.getenv("AI_GLOBAL_DAILY_TOKEN_LIMIT", "500000"))
    )
    day_start = timezone.now() - timedelta(hours=24)

    with transaction.atomic():
        # Lock na linha do usuário para evitar race condition em requisições simultâneas
        user.__class__.objects.select_for_update().filter(pk=user.pk).exists()

        user_used = _get_consumed_tokens(
            AIUsage.objects.filter(user=user, created_at__gte=day_start)
        )
        if user_used + estimated_tokens > user_daily_limit:
            raise QuotaExceededError(
                "Limite diário de uso de IA atingido para sua conta."
            )

        global_used = _get_consumed_tokens(
            AIUsage.objects.filter(created_at__gte=day_start)
        )
        if global_used + estimated_tokens > global_daily_limit:
            raise QuotaExceededError(
                "Limite global de uso de IA atingido no momento. Tente novamente mais tarde."
            )

        return AIUsage.objects.create(
            user=user,
            model_name=model_name,
            reserved_tokens=estimated_tokens,
            status=AIUsage.Status.RESERVED,
        )


def _finalize_usage(usage_record: AIUsage, usage_metadata) -> None:
    input_tokens = getattr(usage_metadata, "prompt_token_count", 0) or 0
    output_tokens = getattr(usage_metadata, "candidates_token_count", 0) or 0

    usage_record.input_tokens = input_tokens
    usage_record.output_tokens = output_tokens
    usage_record.status = AIUsage.Status.COMPLETED
    usage_record.save(update_fields=["input_tokens", "output_tokens", "status", "updated_at"])


def _release_usage(usage_record: AIUsage | None) -> None:
    if usage_record and usage_record.status == AIUsage.Status.RESERVED:
        usage_record.status = AIUsage.Status.FAILED
        usage_record.save(update_fields=["status", "updated_at"])


class GeneratePlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 1. Bloqueio manual (kill switch)
        if not _is_ai_enabled():
            return Response(
                {"detail": "A geração de planos por IA está temporariamente desativada."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # 2. Validação de entrada (400 automático via raise_exception=True)
        serializer = GeneratePlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
        max_output_tokens = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "2500"))
        usage_record = None

        try:
            # 3. Contar tokens de entrada antes da geração (rejeita se > 2000)
            input_tokens_estimate = count_plan_input_tokens(data)

            # 4. Reservar quota de forma atômica (usuário + global)
            estimated_total_tokens = input_tokens_estimate + max_output_tokens
            usage_record = _reserve_quota(
                user=request.user,
                model_name=model_name,
                estimated_tokens=estimated_total_tokens,
            )

            # 5. Chamada única ao Gemini (sem retries)
            plan, usage_metadata = generate_plan(data)

            # 6. Reconcilia os tokens reais consumidos assim que o provedor responde
            _finalize_usage(usage_record, usage_metadata)

            # 7. Validar consistência de horas e calcular datas no backend
            scheduled_plan = schedule_tasks(
                plan=plan,
                deadline=data["deadline"],
                daily_hours=data["daily_hours"],
            )

            return Response(
                {
                    **scheduled_plan,
                    "saved": False,
                },
                status=status.HTTP_200_OK,
            )

        except AIInputTooLongError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except QuotaExceededError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        except (AIInvalidResponseError, ScheduleOverflowError, ValueError) as exc:
            # Se a IA respondeu (usage_record já virou COMPLETED), mantém o consumo real;
            # se falhou antes de completar (ex: finish_reason=SAFETY), libera a reserva.
            _release_usage(usage_record)
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        except AIServiceTimeoutError:
            _release_usage(usage_record)
            return Response(
                {"detail": "A requisição ao serviço de IA excedeu o tempo limite."},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )

        except (AIServiceUnavailableError, AIServiceConfigError):
            _release_usage(usage_record)
            return Response(
                {"detail": "O serviço de IA está indisponível no momento."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except Exception:
            _release_usage(usage_record)
            logger.exception("Erro inesperado ao gerar plano de IA.")
            return Response(
                {"detail": "Não foi possível processar o planejamento no momento."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )