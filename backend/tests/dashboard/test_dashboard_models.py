import pytest
from app.dashboard.models import mock_matriz_produtos


def test_mock_matriz_retorna_4_por_quadrante_por_padrao():
    result = mock_matriz_produtos()
    assert len(result["items"]) == 16
    quadrantes = [p["quadrante"] for p in result["items"]]
    for q in ["estrelas", "oportunidades", "alerta_vermelho", "ofensores"]:
        assert quadrantes.count(q) == 4


def test_mock_matriz_respeita_limites_customizados():
    result = mock_matriz_produtos(limite_estrelas=2, limite_oportunidades=3)
    quadrantes = [p["quadrante"] for p in result["items"]]
    assert quadrantes.count("estrelas") == 2
    assert quadrantes.count("oportunidades") == 3
    assert quadrantes.count("alerta_vermelho") == 4
    assert quadrantes.count("ofensores") == 4


def test_mock_matriz_retorna_volume_total_positivo():
    result = mock_matriz_produtos()
    assert result["volume_total"] > 0


def test_mock_matriz_estrelas_ordenadas_por_volume_produto_desc():
    result = mock_matriz_produtos()
    estrelas = [p for p in result["items"] if p["quadrante"] == "estrelas"]
    volumes = [p["volume_produto"] for p in estrelas]
    assert volumes == sorted(volumes, reverse=True)


def test_mock_matriz_oportunidades_ordenadas_por_satisfacao_desc():
    result = mock_matriz_produtos()
    ops = [p for p in result["items"] if p["quadrante"] == "oportunidades"]
    sats = [p["satisfacao"] for p in ops]
    assert sats == sorted(sats, reverse=True)


def test_mock_matriz_alerta_vermelho_ordenado_por_volume_produto_desc():
    result = mock_matriz_produtos()
    alertas = [p for p in result["items"] if p["quadrante"] == "alerta_vermelho"]
    volumes = [p["volume_produto"] for p in alertas]
    assert volumes == sorted(volumes, reverse=True)


def test_mock_matriz_ofensores_ordenados_por_satisfacao_asc():
    result = mock_matriz_produtos()
    ofensores = [p for p in result["items"] if p["quadrante"] == "ofensores"]
    sats = [p["satisfacao"] for p in ofensores]
    assert sats == sorted(sats)


def test_mock_matriz_itens_tem_todos_os_campos():
    result = mock_matriz_produtos()
    campos = ["nome", "categoria", "volume_produto", "volume_total", "participacao_percentual",
              "satisfacao", "qtd_avaliacoes", "status", "quadrante", "bloco_anterior"]
    for item in result["items"]:
        for campo in campos:
            assert campo in item, f"Campo '{campo}' ausente no item {item['nome']}"
