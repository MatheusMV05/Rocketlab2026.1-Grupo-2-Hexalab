from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# --- TESTES US-05 ---

def test_listar_clientes_sem_filtros():
    response = client.get("/clientes/")
    assert response.status_code == 200
    data = response.json()
    assert "itens" in data
    assert "total" in data
    assert "pagina" in data
    assert "tamanho" in data
    assert "paginas" in data
    assert data["total"] == 2
    assert len(data["itens"]) == 2

def test_listar_clientes_filtro_query():
    response = client.get("/clientes/?query=MARIA")
    assert response.status_code == 200
    data = response.json()
    assert len(data["itens"]) == 1
    assert data["itens"][0]["nome_completo"] == "Maria Oliveira"

def test_listar_clientes_filtro_estado():
    response = client.get("/clientes/?estado=SP")
    assert response.status_code == 200
    data = response.json()
    assert len(data["itens"]) == 1
    assert data["itens"][0]["estado"] == "SP"

def test_listar_clientes_estado_invalido():
    # US-05: filtro sem resultado não é erro (200 com lista vazia)
    response = client.get("/clientes/?estado=INVALIDO")
    assert response.status_code == 200
    data = response.json()
    assert data["itens"] == []

def test_listar_clientes_pagina_zero():
    response = client.get("/clientes/?pagina=0")
    assert response.status_code == 422

def test_listar_clientes_tamanho_zero():
    response = client.get("/clientes/?tamanho=0")
    assert response.status_code == 422

def test_listar_clientes_tamanho_maior_cem():
    response = client.get("/clientes/?tamanho=200")
    assert response.status_code == 422

# --- TESTES US-06 ---

def test_obter_perfil_cliente_existente():
    response = client.get("/clientes/1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["nome_completo"] == "João Silva"
    assert data["data_cadastro"] == "15-01-2023"

def test_obter_perfil_cliente_inexistente():
    response = client.get("/clientes/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Cliente nao encontrado."

def test_obter_perfil_cliente_id_invalido():
    response = client.get("/clientes/abc")
    assert response.status_code == 422

# --- TESTES US-07 ---

def test_obter_pedidos_cliente():
    response = client.get("/clientes/1/pedidos")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Ordenado por data decrescente (2024-04-10 deve vir antes de 2023-02-10)
    assert data[0]["data"] == "10-04-2024"

def test_obter_avaliacoes_cliente():
    response = client.get("/clientes/1/avaliacoes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id_pedido"] == 101

def test_obter_tickets_cliente():
    response = client.get("/clientes/2/tickets")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["tipo_problema"] == "Atraso na Entrega"
