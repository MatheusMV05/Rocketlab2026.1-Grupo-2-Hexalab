import re
import unicodedata


def extract_sql(response: str) -> str:
    """Extrai o conteúdo da tag <sql> da resposta do LLM.

    Remove blocos de código markdown residuais e espaços em branco nas extremidades.
    Retorna uma string vazia se a tag não for encontrada ou a entrada for nula.
    """
    if not response:
        return ""

    # Busca a tag ignorando maiúsculas/minúsculas e capturando quebras de linha
    match = re.search(r"<sql>(.*?)</sql>", response, re.DOTALL | re.IGNORECASE)
    if not match:
        return ""

    sql_content = match.group(1).strip()

    # Limpeza de cercas de markdown (ex: ```sql ... ```) inseridas pelo LLM
    sql_content = re.sub(r"^```[a-zA-Z]*\n?", "", sql_content)
    sql_content = re.sub(r"\n?```$", "", sql_content)

    return sql_content.strip()


def extract_reasoning(response: str) -> str:
    """Extrai o bloco explicativo contido na tag <reasoning> da resposta do LLM."""
    if not response:
        return ""

    match = re.search(
        r"<reasoning>(.*?)</reasoning>", response, re.DOTALL | re.IGNORECASE
    )
    return match.group(1).strip() if match else ""


def is_impossivel(response: str) -> bool:
    """Verifica de forma determinística se o LLM avaliou a resposta como impossível.

    Inspeciona prioritariamente a tag <sql> para evitar falsos positivos
    caso a palavra apareça na explicação ou dentro de uma string de busca na query.
    """
    if not response:
        return False

    # Foca no conteúdo da tag <sql>. Se a tag não existir, analisa o texto bruto.
    match = re.search(r"<sql>(.*?)</sql>", response, re.DOTALL | re.IGNORECASE)
    target_text = match.group(1) if match else response

    # Normalização limpa: remove espaços, passa para maiúsculo e remove acentos
    clean_text = target_text.strip().upper()
    clean_text = (
        unicodedata.normalize("NFKD", clean_text)
        .encode("ASCII", "ignore")
        .decode("ASCII")
    )

    return clean_text == "IMPOSSIVEL"