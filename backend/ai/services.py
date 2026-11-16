import logging
import os
from functools import lru_cache
from typing import Any

from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from .prompts import SYSTEM_INSTRUCTION, build_plan_prompt
from .schemas import GeneratedPlan

logger = logging.getLogger(__name__)

MAX_INPUT_TOKENS = 2000


class AIServiceError(Exception):
    """Erro base da camada de integração com IA."""


class AIServiceConfigError(AIServiceError):
    """Erro de configuração (ex: API key ausente) -> mapeado para 503."""


class AIServiceTimeoutError(AIServiceError):
    """Tempo limite excedido ao aguardar resposta do provedor -> mapeado para 504."""


class AIServiceUnavailableError(AIServiceError):
    """Falha de comunicação ou indisponibilidade do provedor -> mapeado para 503."""


class AIInputTooLongError(AIServiceError):
    """Prompt de entrada ultrapassou o limite de tokens permitido -> mapeado para 400."""


class AIInvalidResponseError(AIServiceError):
    """Resposta do Gemini vazia, truncada ou fora do schema esperado -> mapeado para 422."""


def _is_timeout_exception(exc: Exception) -> bool:
    """Identifica timeouts de rede (TimeoutError/urllib/requests) sem depender de httpx."""
    if isinstance(exc, TimeoutError):
        return True
    exc_name = type(exc).__name__.lower()
    exc_msg = str(exc).lower()
    return "timeout" in exc_name or "timed out" in exc_msg or "deadline" in exc_msg


def _clean_schema_for_gemini(schema: dict[str, Any]) -> dict[str, Any]:
    """
    Remove chaves de JSON Schema (como additionalProperties) que a API do Gemini
    rejeita com 400 INVALID_ARGUMENT, mantendo a validação estrita no Pydantic local.
    """
    cleaned = {}
    for key, value in schema.items():
        if key == "additionalProperties":
            continue
        if isinstance(value, dict):
            cleaned[key] = _clean_schema_for_gemini(value)
        elif isinstance(value, list):
            cleaned[key] = [
                _clean_schema_for_gemini(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            cleaned[key] = value
    return cleaned


@lru_cache(maxsize=1)
def _get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise AIServiceConfigError("GEMINI_API_KEY não configurada no ambiente.")

    # Timeout em milissegundos (padrão: 20000ms = 20s) e estritamente 1 tentativa (sem retries)
    timeout_ms = int(os.getenv("GEMINI_TIMEOUT_MS", "20000"))

    return genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(
            timeout=timeout_ms,
            retry_options=types.HttpRetryOptions(attempts=1),
        ),
    )


def count_plan_input_tokens(data: dict[str, Any]) -> int:
    """
    Conta os tokens do prompt completo (system_instruction + dados do usuário)
    antes da geração. Rejeita solicitações que ultrapassem MAX_INPUT_TOKENS.
    """
    client = _get_gemini_client()
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()

    try:
        result = client.models.count_tokens(
            model=model_name,
            contents=build_plan_prompt(data),
            config=types.CountTokensConfig(
                system_instruction=SYSTEM_INSTRUCTION,
            ),
        )
    except errors.APIError as exc:
        logger.warning("Erro da API ao contar tokens (status=%s): %s", exc.code, exc.message)
        if exc.code == 504:
            raise AIServiceTimeoutError("Tempo limite excedido na API de IA.") from exc
        raise AIServiceUnavailableError("Serviço de IA temporariamente indisponível.") from exc
    except Exception as exc:
        if _is_timeout_exception(exc):
            logger.warning("Timeout ao contar tokens no Gemini: %s", exc)
            raise AIServiceTimeoutError(
                "Tempo limite excedido ao validar o tamanho da solicitação na IA."
            ) from exc
        logger.error("Erro inesperado ao contar tokens no Gemini: %s", exc)
        raise AIServiceUnavailableError(
            "Não foi possível comunicar com o serviço de IA."
        ) from exc

    total_tokens = getattr(result, "total_tokens", 0) or 0
    if total_tokens > MAX_INPUT_TOKENS:
        raise AIInputTooLongError(
            f"O conteúdo enviado excede o limite de {MAX_INPUT_TOKENS} tokens de entrada ({total_tokens} tokens)."
        )

    return total_tokens


def generate_plan(data: dict[str, Any]) -> tuple[GeneratedPlan, Any]:
    """
    Executa uma única chamada estruturada ao Gemini (sem retries) e valida
    o JSON retornado contra o schema Pydantic GeneratedPlan.
    """
    client = _get_gemini_client()
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
    max_output_tokens = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "2500"))

    gemini_schema = _clean_schema_for_gemini(GeneratedPlan.model_json_schema())

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=build_plan_prompt(data),
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=gemini_schema,
                temperature=0.3,
                max_output_tokens=max_output_tokens,
            ),
        )
    except errors.APIError as exc:
        logger.warning("Erro na API do Gemini (status=%s): %s", exc.code, exc.message)
        if exc.code == 504:
            raise AIServiceTimeoutError("Tempo limite excedido na API de IA.") from exc
        raise AIServiceUnavailableError("Serviço de IA temporariamente indisponível.") from exc
    except Exception as exc:
        if _is_timeout_exception(exc):
            logger.warning("Timeout ao chamar o Gemini: %s", exc)
            raise AIServiceTimeoutError(
                "Tempo limite excedido ao aguardar resposta da IA."
            ) from exc
        logger.error("Falha de rede ao chamar o Gemini: %s", exc)
        raise AIServiceUnavailableError(
            "Não foi possível comunicar com o serviço de IA."
        ) from exc

    candidate = response.candidates[0] if response.candidates else None
    finish_reason = getattr(candidate, "finish_reason", None)
    if finish_reason and str(finish_reason) not in ("FinishReason.STOP", "STOP"):
        logger.warning("Geração interrompida com finish_reason=%s", finish_reason)
        raise AIInvalidResponseError(
            f"A resposta da IA foi interrompida ({finish_reason})."
        )

    if not response.text:
        raise AIInvalidResponseError("Resposta vazia retornada pelo Gemini.")

    try:
        plan = GeneratedPlan.model_validate_json(response.text)
    except ValidationError as exc:
        logger.warning("JSON do Gemini falhou na validação Pydantic: %s", exc)
        raise AIInvalidResponseError(
            "A IA retornou uma estrutura de plano inválida."
        ) from exc

    return plan, response.usage_metadata