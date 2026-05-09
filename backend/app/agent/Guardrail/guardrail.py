from __future__ import annotations

import re
import logging

logger = logging.getLogger(__name__)

_PADRAO_SQL_INICIO_VALIDO = re.compile(r"^\s*(?:WITH|SELECT)\b", re.IGNORECASE)
_PADRAO_PALAVRAS_PROIBIDAS = re.compile(
    r"\b(?:DELETE|DROP|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|ATTACH|DETACH|PRAGMA)\b",
    re.IGNORECASE,
)

_PADROES_INJECTION_PROMPT = [
    r"(?:ignore|forget|override|bypass|skip)\s+(?:previous|above|all|your|my)\s+(?:instructions|instructions|prompts)",
    r"you\s+(?:are|are)\s+now",
    r"pretend\s+(?:you|your|you're)",
    r"act\s+as\s+(?:if|though|a)",
    r"instead\s+of",
    r"esqueça\s+(?:as|os)\s+(?:instruções|instrucoes|prompts)",
    r"ignore\s+(?:as|os)\s+(?:instruções|instrucoes)",
    r"você\s+é\s+agora",
    r"voce\s+e\s+agora",
    r"agora\s+(?:você|voce)\s+é",
    r"finja\s+que",
    r"atue\s+como",
    r"em\s+vez\s+de",
]

_PADROES_INJECTION_SQL = [
    r"--\s*$",
    r"#\s*$",
    r"/\*\s*$",
    r";\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP)",
    r"\'\s*or\s*\'",
    r"\"\s*or\s*\"",
    r"\'\s*1\s*=\s*1",
    r"UNION\s+(?:SELECT|ALL)",
    r"CASE\s+WHEN",
]

_MAX_COMPRIMENTO_PERGUNTA = 2048

_TERMOS_DOMINIO = {
    "cliente",
    "clientes",
    "consumidor",
    "consumidores",
    "pedido",
    "pedidos",
    "produto",
    "produtos",
    "ticket",
    "tickets",
    "avaliacao",
    "avaliacoes",
    "avaliação",
    "avaliações",
    "vendedor",
    "vendedores",
    "receita",
    "faturamento",
    "categoria",
    "categorias",
    "compra",
    "compras",
    "comprou",
    "compraram",
    "suporte",
    "sac",
    "crm",
    "v-commerce",
    "vcommerce",
}


def validar_input_usuario(pergunta: str) -> tuple[bool, str]:
    """Valida entrada do usuário contra prompt injection e SQL injection.

    Realiza verificações de segurança em camadas:
    1. Valida tipo e comprimento
    2. Detecta padrões de prompt injection (EN/PT)
    3. Detecta padrões de SQL injection
    4. Verifica caracteres perigosos/incomuns

    Args:
        pergunta: Pergunta em linguagem natural do usuário.

    Returns:
        Tupla (válido: bool, motivo: str). Se válido=True, motivo é vazio.
        Se válido=False, motivo descreve o tipo de injção ou violação.
    """
    if not pergunta:
        return False, "Pergunta vazia"

    if not isinstance(pergunta, str):
        return False, "Pergunta não é string"

    pergunta_limpa = pergunta.strip()
    if not pergunta_limpa:
        return False, "Pergunta contém apenas espaços"

    if len(pergunta_limpa) > _MAX_COMPRIMENTO_PERGUNTA:
        return False, f"Pergunta excede {_MAX_COMPRIMENTO_PERGUNTA} caracteres"

    motivo = _detectar_prompt_injection(pergunta_limpa)
    if motivo:
        return False, motivo

    motivo = _detectar_sql_injection(pergunta_limpa)
    if motivo:
        return False, motivo

    motivo = _detectar_fora_do_escopo(pergunta_limpa)
    if motivo:
        return False, motivo

    return True, ""


def _detectar_prompt_injection(pergunta: str) -> str:
    """Detecta padrões de prompt injection em português e inglês."""
    pergunta_lower = pergunta.lower()
    for padrao in _PADROES_INJECTION_PROMPT:
        if re.search(padrao, pergunta_lower, re.IGNORECASE):
            logger.warning("Prompt injection detectado: %s", padrao)
            return f"Padrão suspeito de injection detectado: {padrao}"
    return ""


def _detectar_sql_injection(pergunta: str) -> str: #discutir
    """Detecta padrões comuns de SQL injection."""
    for padrao in _PADROES_INJECTION_SQL:
        if re.search(padrao, pergunta, re.IGNORECASE):
            logger.warning("SQL injection detectado: %s", padrao)
            return f"Padrão suspeito de SQL injection: {padrao}"
    return ""


def _detectar_fora_do_escopo(pergunta: str) -> str:
    """Detecta se a pergunta não parece pertencer ao domínio V-Commerce CRM 360."""
    tokens = set(re.findall(r"[a-z0-9_]+", pergunta.lower()))
    if not tokens:
        return "Pergunta fora do escopo do CRM V-Commerce"

    if tokens.intersection(_TERMOS_DOMINIO):
        return ""

    return "Pergunta fora do escopo do CRM V-Commerce"


def validar_sql_somente_leitura(sql: str) -> bool:
    """Valida se o SQL representa uma consulta segura de leitura.

    Regras de segurança:
    - Deve iniciar com SELECT ou WITH.
    - Não pode conter palavras-chave de escrita/mutação/DDL.
    - Não pode conter comentários SQL sem encerramento (-- ao final).
    - Não pode ter múltiplas statements (;).

    Args:
        sql: String SQL a validar.

    Returns:
        True se SQL é válido e seguro (somente leitura), False caso contrário.
    """
    if not sql:
        return False

    if not _PADRAO_SQL_INICIO_VALIDO.search(sql):
        logger.warning("SQL não inicia com SELECT ou WITH")
        return False

    if _PADRAO_PALAVRAS_PROIBIDAS.search(sql):
        logger.warning("SQL contém palavras-chave proibidas")
        return False

    if _validar_sem_injection_sql(sql) is False:
        logger.warning("SQL contém padrões de injection detectados")
        return False

    return True


def _validar_sem_injection_sql(sql: str) -> bool:
    """Verifica se SQL não contém padrões de injection."""
    for padrao in _PADROES_INJECTION_SQL:
        if re.search(padrao, sql, re.IGNORECASE):
            return False
    return True
