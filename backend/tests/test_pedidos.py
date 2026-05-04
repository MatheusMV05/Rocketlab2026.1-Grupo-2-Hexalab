from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_listar_pedidos_sem_filtros():
    response = client.get("/pedidos/")
    assert response.status_code == 200
    data = response.json()
    assert "itens" in data
    assert "total" in data
    assert "pagina" in data
    assert "tamanho" in data
    assert "paginas" in data
    assert data["total"] == 3
    assert len(data["itens"]) == 3

def test_listar_pedidos_com_filtro_status():
    response = client.get("/pedidos/?status=Aprovado")
    assert response.status_code == 200
    data = response.json()
    assert len(data["itens"]) == 1
    assert data["itens"][0]["status"] == "Aprovado"

def test_listar_pedidos_com_filtro_categoria():
    response = client.get("/pedidos/?categoria=Móveis")
    assert response.status_code == 200
    data = response.json()
    assert len(data["itens"]) == 1
    assert data["itens"][0]["categoria"] == "Móveis"

def test_listar_pedidos_com_filtro_data():
    response = client.get("/pedidos/?data_inicio=2024-01-01&data_fim=2024-01-31")
    assert response.status_code == 200
    data = response.json()
    assert len(data["itens"]) == 1
    assert data["itens"][0]["data_pedido"] == "2024-01-15"

def test_listar_pedidos_paginacao():
    response = client.get("/pedidos/?pagina=1&tamanho=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["itens"]) == 2
    assert data["total"] == 3
    assert data["paginas"] == 2

def test_obter_pedido_existente():
    response = client.get("/pedidos/101")
    assert response.status_code == 200
    data = response.json()
    assert data["id_pedido"] == 101
    assert data["nome_cliente"] == "João Silva"

def test_obter_pedido_inexistente():
    response = client.get("/pedidos/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Pedido não encontrado"}

def test_listar_pedidos_com_filtro_search():
    response = client.get("/pedidos/?search=maria")
    assert response.status_code == 200
    data = response.json()
    assert len(data["itens"]) == 1
    assert data["itens"][0]["nome_cliente"] == "Maria Oliveira"
