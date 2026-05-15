from __future__ import annotations
import re
import logging

# Configuração básica de log para monitorar tentativas de acesso indevido
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CRM_Guardrail")

# ==============================================================
# CONFIGURAÇÕES DE ESCOPO E DOMÍNIO
# ==============================================================

# Whitelist: A IA só pode tocar nessas tabelas da Camada Gold.
# Qualquer tabela fora desta lista resultará em bloqueio imediato.
TABELAS_PERMITIDAS = {
    "dim_clientes", 
    "dim_produtos", 
    "dim_data", 
    "fat_pedidos", 
    "fat_avaliacoes", 
    "fat_tickets", 
    "fat_clickstream",
    "mart_desempenho_produtos", 
    "mart_cliente_360", 
    "mart_comportamento_digital"
}

# ==============================================================
# PADRÕES REGEX (SEGURANÇA)
# ==============================================================

# Garante que a query seja apenas de leitura
_PADRAO_SQL_INICIO_VALIDO = re.compile(r"^\s*(?:WITH|SELECT)\b", re.IGNORECASE)

# Bloqueia comandos de escrita, alteração ou acesso ao sistema (DML/DDL)
_PADRAO_PALAVRAS_PROIBIDAS = re.compile(
    r"\b(?:DELETE|DROP|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|ATTACH|DETACH|PRAGMA|GRANT|REVOKE|EXEC|EXECUTE)\b",
    re.IGNORECASE,
)

# Padrões de Injection SQL e Comentários
_PADROES_INJECTION_SQL = [
    r"/\*.*?\*/",      # Comentários de bloco
    r"--",             # Comentários de linha
    r";",              # Múltiplos statements (evita execução de queries seguidas)
    r"\bUNION\b",      # Bloqueia UNION para evitar vazamento entre tabelas
    r"\bSLEEP\(",      # Evita ataques de negação de serviço (DoS)
    r"\bLOAD_FILE\b"   # Evita leitura de arquivos do servidor
]

# Proteção contra Prompt Injection (Jailbreak)
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

# ==============================================================
# FUNÇÕES DE VALIDAÇÃO
# ==============================================================

def validar_pergunta_usuario(pergunta: str) -> str:
    """
    Valida a pergunta do usuário antes de enviar para a IA.
    Retorna uma string vazia se for válida, ou uma mensagem de erro.
    """
    if not pergunta:
        return "A pergunta não pode estar vazia."

    pergunta_clean = pergunta.lower()

    # 1. Detectar tentativa de Jailbreak
    for padrao in _PADROES_INJECTION_PROMPT:
        if re.search(padrao, pergunta_clean):
            logger.warning(f"Tentativa de Jailbreak detectada: {pergunta}")
            return "Comando inválido. Por favor, faça apenas perguntas sobre os dados de CRM."

    # A verificação restritiva de termos de domínio foi removida daqui.
    # O fluxo agora confia no System Prompt da IA para barrar escopos genéricos.
    return ""

def validar_sql_seguro(sql: str) -> bool:
    """
    Verifica se o SQL gerado pela IA é seguro para execução.
    Permite CASE WHEN e Subqueries, desde que restritos à Whitelist.
    """
    if not sql:
        return False

    sql_lower = sql.lower().strip()

    # 1. Deve ser obrigatoriamente um SELECT ou um Common Table Expression (WITH)
    if not _PADRAO_SQL_INICIO_VALIDO.search(sql_lower):
        logger.error("SQL rejeitado: Não inicia com SELECT ou WITH.")
        return False

    # 2. Bloquear palavras-chave proibidas (Escrita/Alteração)
    if _PADRAO_PALAVRAS_PROIBIDAS.search(sql_lower):
        logger.error("SQL rejeitado: Contém termos de alteração de dados (DML/DDL).")
        return False

    # 3. Bloquear padrões de Injeção conhecidos
    for padrao in _PADROES_INJECTION_SQL:
        if re.search(padrao, sql_lower):
            logger.error(f"SQL rejeitado: Padrão de injeção detectado ({padrao}).")
            return False

    # 4. VALIDAÇÃO DE WHITELIST (Inclusive em Subqueries)
    tabelas_na_query = re.findall(r"(?:from|join)\s+([a-z0-9_]+)", sql_lower)
    ctes_declaradas = set(re.findall(r"(?:with|,)\s+([a-z0-9_]+)\s+as\s*\(", sql_lower))
    
    if not tabelas_na_query:
        logger.warning("Query sem tabelas detectada.")
    
        tabela_limpa = tabela.split('.')[-1]
    for tabela in tabelas_na_query:
        tabela_limpa = tabela.split('.')[-1]
        if tabela_limpa in ctes_declaradas:
            continue
        if tabela_limpa not in TABELAS_PERMITIDAS:
            logger.error(f"SQL rejeitado: Tentativa de acesso à tabela proibida '{tabela}'.")
            return False

    return True

# ==============================================================
# EXPLICABILIDADE
# ==============================================================

def normalizar_valor_bruto(valor):
    """
    Auxiliar para garantir que a IA trate valores nulos ou 
    formatos brutos antes de exibir ao usuário final.
    """
    if valor is None:
        return "N/A"
    return valor