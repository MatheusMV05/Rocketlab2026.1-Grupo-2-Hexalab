# Mocks internos do dashboard serão substituídos pelas queries reais quando os outros módulos estiverem prontos e os dados reais disponiblizados.


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
        {"mes_ano": "Jun/2024", "receita_total": 28750.00, "total_pedidos": 74},
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


# TODO: substituir pela query real —> depende do módulo produtos e pedidos
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


# TODO: substituir pela query real —> depende do módulo avaliações/NPS
def mock_taxa_satisfacao() -> dict:
    return {
        "valor": 28.0,
        "meta": 50.0,
        "total_avaliacoes": 115,
    }


# TODO: substituir pela query real —> depende dos módulos produtos e avaliações
def mock_matriz_produtos() -> list[dict]:
    return [
        {"nome": "Sofá Retrátil", "volume": 850, "satisfacao": 4.5, "status": "bom"},
        {"nome": "Fone Bluetooth XYZ", "volume": 1050, "satisfacao": 4.4, "status": "bom"},
        {"nome": "Bicicleta Aro 29", "volume": 1250, "satisfacao": 4.2, "status": "bom"},
        {"nome": 'Monitor 24" Básico', "volume": 1100, "satisfacao": 3.0, "status": "neutro"},
        {"nome": "Máquina Lavar Ultra", "volume": 1200, "satisfacao": 2.6, "status": "ruim"},
        {"nome": "Roteador Wi-Fi Antigo", "volume": 400, "satisfacao": 2.3, "status": "ruim"},
        {"nome": "Capa Celular Genérica", "volume": 420, "satisfacao": 2.0, "status": "ruim"},
        {"nome": "Teclado Mecânico", "volume": 2700, "satisfacao": 1.5, "status": "ruim"},
        {"nome": "Perfume Premium", "volume": 3400, "satisfacao": 4.3, "status": "bom"},
    ]


# TODO: substituir pela query real —> depende do módulo pedidos/logística
def mock_entregas(pagina: int = 1, por_pagina: int = 7) -> dict:
    todos = [
        {"id": "#f3221", "cliente": "Maria Day", "status": "hoje", "prazo": "(limite às 18h)"},
        {"id": "#f3222", "cliente": "João Silva", "status": "no_prazo", "prazo": "24/05/2026"},
        {"id": "#f3223", "cliente": "Ana Costa", "status": "hoje", "prazo": "(limite às 9h)"},
        {"id": "#f3224", "cliente": "Carlos Mendes", "status": "atrasado", "prazo": "21/05/2026"},
        {"id": "#f3225", "cliente": "Lúcia Ferreira", "status": "no_prazo", "prazo": "26/05/2026"},
        {"id": "#f3226", "cliente": "Pedro Santos", "status": "no_prazo", "prazo": "26/05/2026"},
        {"id": "#f3227", "cliente": "Mariana Oliveira", "status": "hoje", "prazo": "(limite às 15h)"},
        {"id": "#f3228", "cliente": "Roberto Alves", "status": "no_prazo", "prazo": "27/05/2026"},
        {"id": "#f3229", "cliente": "Fernanda Lima", "status": "atrasado", "prazo": "20/05/2026"},
        {"id": "#f3230", "cliente": "Gabriel Costa", "status": "no_prazo", "prazo": "28/05/2026"},
        {"id": "#f3231", "cliente": "Patrícia Souza", "status": "hoje", "prazo": "(limite às 12h)"},
        {"id": "#f3232", "cliente": "Ricardo Nunes", "status": "no_prazo", "prazo": "29/05/2026"},
        {"id": "#f3233", "cliente": "Juliana Castro", "status": "atrasado", "prazo": "19/05/2026"},
        {"id": "#f3234", "cliente": "Marcos Pereira", "status": "no_prazo", "prazo": "30/05/2026"},
        {"id": "#f3235", "cliente": "Camila Rocha", "status": "hoje", "prazo": "(limite às 20h)"},
        {"id": "#f3236", "cliente": "André Barbosa", "status": "no_prazo", "prazo": "31/05/2026"},
        {"id": "#f3237", "cliente": "Beatriz Melo", "status": "no_prazo", "prazo": "01/06/2026"},
        {"id": "#f3238", "cliente": "Thiago Ferreira", "status": "atrasado", "prazo": "18/05/2026"},
        {"id": "#f3239", "cliente": "Natália Gomes", "status": "no_prazo", "prazo": "02/06/2026"},
        {"id": "#f3240", "cliente": "Leonardo Santos", "status": "hoje", "prazo": "(limite às 16h)"},
        {"id": "#f3241", "cliente": "Vanessa Cardoso", "status": "no_prazo", "prazo": "03/06/2026"},
        {"id": "#f3242", "cliente": "Diego Martins", "status": "atrasado", "prazo": "17/05/2026"},
    ]
    total = len(todos)
    total_paginas = (total + por_pagina - 1) // por_pagina
    inicio = (pagina - 1) * por_pagina
    fim = inicio + por_pagina
    return {
        "items": todos[inicio:fim],
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "total_paginas": total_paginas,
    }
