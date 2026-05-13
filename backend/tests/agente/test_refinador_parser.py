import jinja2
import pytest

from app.agent.agentes.refinador_parser import (
    extract_reasoning,
    extract_sql,
    is_impossivel,
)

# =====================================================================
# TESTES DO PARSER (TP01 a TP06)
# =====================================================================


def test_tp01_extract_sql_valido():
    """TP01: Valida a extração correta da tag <sql>, limpando markdown e espaços."""
    resposta = "<reasoning>Ajustado.</reasoning>\n<sql>\n```sql\nSELECT * FROM pedidos;\n```\n</sql>"
    assert extract_sql(resposta) == "SELECT * FROM pedidos;"


def test_tp02_extract_reasoning_valido():
    """TP02: Valida a extração limpa do bloco explicativo contido na tag <reasoning>."""
    resposta = "<reasoning>\nFaltava a condição de junção.\n</reasoning>\n<sql>SELECT 1;</sql>"
    assert extract_reasoning(resposta) == "Faltava a condição de junção."


def test_tp03_is_impossivel_basico():
    """TP03: Confirma a identificação do cenário de impossibilidade na tag <sql>."""
    resposta = "<reasoning>Faltam colunas.</reasoning>\n<sql>IMPOSSIVEL</sql>"
    assert is_impossivel(resposta) is True
    assert extract_sql(resposta) == "IMPOSSIVEL"


def test_tp04_is_impossivel_variacoes_case_espaco():
    """TP04: Assegura a detecção de IMPOSSIVEL com variações de case, acentuação e espaços."""
    variacoes = [
        "<sql>  impossivel  </sql>",
        "<sql>\nIMPOSSÍVEL\n</sql>",
        "<sql>Impossivel</sql>",
        "IMPOSSÍVEL",  # Cenário de fallback direto caso o LLM omita as tags
    ]
    for resp in variacoes:
        assert is_impossivel(resp) is True


def test_tp05_frase_parece_impossivel_mas_nao_e():
    """TP05: Previne falsos positivos em queries válidas que contenham a palavra como valor."""
    resposta = "<sql>SELECT * FROM suporte WHERE status = 'impossivel';</sql>"
    assert is_impossivel(resposta) is False
    assert (
        extract_sql(resposta)
        == "SELECT * FROM suporte WHERE status = 'impossivel';"
    )


def test_tp06_comportamento_sem_tags_ou_nulo():
    """TP06: Garante o comportamento seguro e sem falhas ao receber nulos ou strings sem marcação."""
    assert extract_sql(None) == ""
    assert extract_sql("SELECT * FROM clientes;") == ""
    assert extract_reasoning("") == ""
    assert is_impossivel(None) is False
    assert is_impossivel("SELECT 1;") is False


# =====================================================================
# TESTES DO TEMPLATE JINJA2 (TP07 a TP08)
# =====================================================================


@pytest.fixture
def jinja_env(tmp_path):
    """Fixture que emula um diretório de prompts limpo e injeta um template simulado.

    Garante que os testes rodem de forma autossuficiente e real em qualquer ambiente.
    """
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    arquivo_template = prompts_dir / "refinador.j2"

    # Escreve um esqueleto que exige estritamente as 4 variáveis do contrato
    conteudo = (
        "<schema>{{ schema }}</schema>\n"
        "<question>{{ question }}</question>\n"
        "<previous_sql>{{ previous_sql }}</previous_sql>\n"
        "<execution_result>{{ execution_result }}</execution_result>"
    )
    arquivo_template.write_text(conteudo, encoding="utf-8")

    return jinja2.Environment(
        loader=jinja2.FileSystemLoader(str(prompts_dir)),
        undefined=jinja2.StrictUndefined,
    )


def test_tp07_renderizacao_template_com_variaveis(jinja_env):
    """TP07: Garante que o template renderiza perfeitamente ao receber as 4 variáveis obrigatórias."""
    template = jinja_env.get_template("refinador.j2")
    resultado = template.render(
        schema="tabela_produtos",
        question="listar skus",
        previous_sql="SELECT sku",
        execution_result="erro de sintaxe",
    )
    assert "tabela_produtos" in resultado
    assert "listar skus" in resultado
    assert "SELECT sku" in resultado
    assert "erro de sintaxe" in resultado


def test_tp08_template_sem_variaveis_obrigatorias(jinja_env):
    """TP08: Verifica se o StrictUndefined dispara falha crítica na ausência de variáveis obrigatórias."""
    template = jinja_env.get_template("refinador.j2")

    with pytest.raises(jinja2.UndefinedError):
        # Omitindo propositalmente a chave 'execution_result'
        template.render(
            schema="tabela_clientes",
            question="total de clientes",
            previous_sql="SELECT COUNT(*)",
        )