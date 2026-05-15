# Override em memória para o endpoint PUT /entregas/{id}.
# Permite editar cliente/status/prazo sem alterar a tabela do data warehouse.

_entregas_overrides: dict[str, dict] = {}


def mock_kpis() -> dict:
    return {
        "receita_total": 487320.50,
        "total_pedidos": 1243,
        "ticket_medio": 392.05,
        "total_clientes": 836,
        "variacao_receita": 5.2,
        "variacao_pedidos": 3.1,
        "variacao_ticket": 2.0,
        "variacao_clientes": 1.5,
        "periodo_ref": "Abr",
    }


def mock_vendas_mensal() -> list[dict]:
    meses = ["Jun/2024","Jul/2024","Ago/2024","Set/2024","Out/2024","Nov/2024",
             "Dez/2024","Jan/2025","Fev/2025","Mar/2025","Abr/2025","Mai/2025"]
    return [{"mes_ano": m, "receita_total": 40000.0 + i * 1000, "total_pedidos": 100 + i * 5}
            for i, m in enumerate(meses)]


def mock_top_produtos() -> dict:
    items = [
        {"nome_produto": f"Produto {i}", "categoria": "Cat", "receita_total": float(10000 - i * 800), "total_unidades": 100 - i * 8}
        for i in range(10)
    ]
    return {"items": items, "variacao_receita": 3.5, "variacao_volume": 2.1, "periodo_ref": "Abr"}


def mock_por_regiao() -> list[dict]:
    estados = [("São Paulo", 180000), ("Rio de Janeiro", 120000), ("Minas Gerais", 90000)]
    return [{"estado": e, "receita_total": float(r), "total_pedidos": r // 100} for e, r in estados]


def mock_status_pedidos() -> dict:
    items = [
        {"status": "aprovado", "total": 700},
        {"status": "processando", "total": 300},
        {"status": "reembolsado", "total": 150},
        {"status": "recusado", "total": 93},
    ]
    return {"items": items, "variacao_total": 2.4, "periodo_ref": "Abr"}


def mock_matriz_produtos(
    limite_estrelas: int = 4,
    limite_oportunidades: int = 4,
    limite_alerta_vermelho: int = 4,
    limite_ofensores: int = 4,
) -> dict:
    # mediana_volume = 1750 para este mock
    estrelas = [
        {"nome": "Notebook Core i7",    "categoria": "Informática",      "volume": 3200, "satisfacao": 4.8, "status": "bom",  "quadrante": "estrelas",        "bloco_anterior": "estrelas"},
        {"nome": "Smartphone Samsung",  "categoria": "Eletrônicos",      "volume": 2900, "satisfacao": 4.5, "status": "bom",  "quadrante": "estrelas",        "bloco_anterior": "oportunidades"},
        {"nome": "Tablet Apple",        "categoria": "Eletrônicos",      "volume": 2600, "satisfacao": 4.3, "status": "bom",  "quadrante": "estrelas",        "bloco_anterior": "estrelas"},
        {"nome": "Fone Bluetooth",      "categoria": "Acessórios",       "volume": 2100, "satisfacao": 4.1, "status": "bom",  "quadrante": "estrelas",        "bloco_anterior": "estrelas"},
    ]
    oportunidades = [
        {"nome": "Livro Python Pro",    "categoria": "Livros",           "volume":  800, "satisfacao": 4.9, "status": "bom",  "quadrante": "oportunidades",   "bloco_anterior": "oportunidades"},
        {"nome": "Panela Elétrica",     "categoria": "Casa",             "volume":  950, "satisfacao": 4.7, "status": "bom",  "quadrante": "oportunidades",   "bloco_anterior": "ofensores"},
        {"nome": "Cafeteira Premium",   "categoria": "Casa",             "volume":  700, "satisfacao": 4.5, "status": "bom",  "quadrante": "oportunidades",   "bloco_anterior": "oportunidades"},
        {"nome": "Mochila Esportiva",   "categoria": "Esportes",         "volume":  600, "satisfacao": 4.2, "status": "bom",  "quadrante": "oportunidades",   "bloco_anterior": "oportunidades"},
    ]
    alerta = [
        {"nome": "TV 55 OLED",          "categoria": "Eletrônicos",      "volume": 3500, "satisfacao": 2.5, "status": "ruim", "quadrante": "alerta_vermelho", "bloco_anterior": "estrelas"},
        {"nome": "Geladeira Duplex",    "categoria": "Eletrodomésticos", "volume": 2800, "satisfacao": 2.8, "status": "ruim", "quadrante": "alerta_vermelho", "bloco_anterior": "alerta_vermelho"},
        {"nome": "Máquina de Lavar",    "categoria": "Eletrodomésticos", "volume": 2200, "satisfacao": 3.1, "status": "ruim", "quadrante": "alerta_vermelho", "bloco_anterior": "alerta_vermelho"},
        {"nome": "Aspirador Robô",      "categoria": "Casa",             "volume": 1900, "satisfacao": 3.5, "status": "ruim", "quadrante": "alerta_vermelho", "bloco_anterior": "estrelas"},
    ]
    ofensores = [
        {"nome": "Cabo USB Genérico",   "categoria": "Acessórios",       "volume":  200, "satisfacao": 1.5, "status": "ruim", "quadrante": "ofensores",       "bloco_anterior": "ofensores"},
        {"nome": "Suporte Monitor",     "categoria": "Acessórios",       "volume":  350, "satisfacao": 2.0, "status": "ruim", "quadrante": "ofensores",       "bloco_anterior": "ofensores"},
        {"nome": "Teclado Sem Fio",     "categoria": "Informática",      "volume":  450, "satisfacao": 2.5, "status": "ruim", "quadrante": "ofensores",       "bloco_anterior": "alerta_vermelho"},
        {"nome": "Mouse Óptico",        "categoria": "Informática",      "volume":  600, "satisfacao": 3.2, "status": "ruim", "quadrante": "ofensores",       "bloco_anterior": "ofensores"},
    ]
    items = (
        estrelas[:limite_estrelas]
        + oportunidades[:limite_oportunidades]
        + alerta[:limite_alerta_vermelho]
        + ofensores[:limite_ofensores]
    )
    return {"items": items, "mediana_volume": 1750.0}
