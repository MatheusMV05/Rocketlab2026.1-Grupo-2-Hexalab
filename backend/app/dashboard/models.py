# Mocks internos do dashboard serão substituídos pelas queries reais quando os módulos estiverem prontos.


# TODO: substituir pela query real —> depende do módulo pedidos e clientes
def mock_kpis() -> dict:
    return {
        "receita_total": 487320.50,
        "total_pedidos": 1243,
        "ticket_medio": 392.05,
        "total_clientes": 836,
    }


# TODO: substituir pela query real —> depende do módulo pedidos
def mock_vendas_mensal() -> list[dict]:
    return [
        {"mes_ano": "Jul/2024", "receita_total": 32140.00, "total_pedidos": 84},
        {"mes_ano": "Ago/2024", "receita_total": 38920.75, "total_pedidos": 101},
        {"mes_ano": "Set/2024", "receita_total": 41380.20, "total_pedidos": 109},
        {"mes_ano": "Out/2024", "receita_total": 45210.90, "total_pedidos": 118},
        {"mes_ano": "Nov/2024", "receita_total": 62890.40, "total_pedidos": 157},
        {"mes_ano": "Dez/2024", "receita_total": 78430.60, "total_pedidos": 195},
        {"mes_ano": "Jan/2025", "receita_total": 35670.30, "total_pedidos": 92},
        {"mes_ano": "Fev/2025", "receita_total": 33210.15, "total_pedidos": 88},
        {"mes_ano": "Mar/2025", "receita_total": 44580.00, "total_pedidos": 115},
        {"mes_ano": "Abr/2025", "receita_total": 51340.70, "total_pedidos": 132},
        {"mes_ano": "Mai/2025", "receita_total": 23545.50, "total_pedidos": 52},
    ]


def mock_top_produtos() -> list[dict]:
    return [
        {"nome_produto": "Notebook UltraSlim Pro 14\"", "categoria": "Informática", "receita_total": 58430.00},
        {"nome_produto": "Smartphone Galaxy X20", "categoria": "Celulares", "receita_total": 47890.50},
        {"nome_produto": "Cadeira Gamer ErgoMax", "categoria": "Móveis", "receita_total": 34210.75},
        {"nome_produto": "Smart TV 55\" 4K OLED", "categoria": "Eletrônicos", "receita_total": 29640.00},
        {"nome_produto": "Tênis Runner Elite 360", "categoria": "Calçados", "receita_total": 21380.20},
        {"nome_produto": "Fone Bluetooth ANC Pro", "categoria": "Áudio", "receita_total": 18950.40},
        {"nome_produto": "Mochila Executiva Carbon", "categoria": "Acessórios", "receita_total": 15720.60},
        {"nome_produto": "Cafeteira Expresso Deluxe", "categoria": "Eletrodomésticos", "receita_total": 12890.30},
        {"nome_produto": "Monitor Gamer 27\" QHD", "categoria": "Informática", "receita_total": 11340.00},
        {"nome_produto": "Teclado Mecânico RGB", "categoria": "Informática", "receita_total": 9870.15},
    ]


# TODO: substituir pela query real —> depende do módulo pedidos e clientes
def mock_por_regiao() -> list[dict]:
    return [
        {"estado": "São Paulo", "receita_total": 142380.50, "total_pedidos": 368},
        {"estado": "Rio de Janeiro", "receita_total": 78920.75, "total_pedidos": 198},
        {"estado": "Minas Gerais", "receita_total": 54310.20, "total_pedidos": 141},
        {"estado": "Paraná", "receita_total": 38640.90, "total_pedidos": 99},
        {"estado": "Rio Grande do Sul", "receita_total": 35180.40, "total_pedidos": 91},
        {"estado": "Bahia", "receita_total": 29450.60, "total_pedidos": 76},
        {"estado": "Santa Catarina", "receita_total": 27830.30, "total_pedidos": 72},
        {"estado": "Ceará", "receita_total": 22640.15, "total_pedidos": 58},
        {"estado": "Pernambuco", "receita_total": 19870.00, "total_pedidos": 51},
        {"estado": "Goiás", "receita_total": 17320.70, "total_pedidos": 44},
    ]


# TODO: substituir pela query real —> depende do módulo pedidos
def mock_status_pedidos() -> list[dict]:
    return [
        {"status": "Entregue", "total": 712},
        {"status": "Em trânsito", "total": 241},
        {"status": "Processando", "total": 156},
        {"status": "Cancelado", "total": 89},
        {"status": "Aguardando pagamento", "total": 45},
    ]
