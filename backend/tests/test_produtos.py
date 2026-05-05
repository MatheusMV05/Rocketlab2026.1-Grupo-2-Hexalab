from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# --- 1. TESTE DE LISTAGEM (Status 200) ---
def test_listar_produtos():
    response = client.get("/produtos/")
    assert response.status_code == 200
    data = response.json()
    # Verifica a estrutura de paginação do contrato
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data
    assert isinstance(data["items"], list)

# --- 2. TESTE DE SUCESSO NA CRIAÇÃO (Status 201) ---
def test_criar_produto_com_sucesso():
    response = client.post(
        "/produtos/",
        json={
            "nome_produto": "Mouse Gamer",
            "categoria": "Periféricos",
            "preco": 150.00,
            "estoque_disponivel": 10,
            "ativo": True
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["nome_produto"] == "Mouse Gamer"
    assert "id" in data

# --- 3. TESTE DE ERRO DE VALIDAÇÃO (Status 422) ---
def test_criar_produto_preco_invalido():
    response = client.post(
        "/produtos/",
        json={
            "nome_produto": "Teclado Quebrado",
            "categoria": "Periféricos",
            "preco": -50.00,  
            "estoque_disponivel": 5,
            "ativo": True
        }
    )
    assert response.status_code == 422

# --- 4. TESTE DE ERRO NA ATUALIZAÇÃO (Status 404) ---
def test_atualizar_produto_inexistente():
    response = client.put(
        "/produtos/9999", 
        json={
            "nome_produto": "Produto Fantasma"
        }
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Produto não encontrado."

# --- 5. TESTE DE ERRO NA EXCLUSÃO (Status 404) ---
def test_deletar_produto_inexistente():
    response = client.delete("/produtos/9999") 
    assert response.status_code == 404
    assert response.json()["detail"] == "Produto não encontrado."