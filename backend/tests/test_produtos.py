import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

# Marca todos os testes deste arquivo como assíncronos
pytestmark = pytest.mark.asyncio

transport = ASGITransport(app=app)
BASE_URL = "http://test"

# --- 1. TESTE DE LISTAGEM (Status 200) ---
async def test_listar_produtos():
    async with AsyncClient(transport=transport, base_url=BASE_URL) as client:
        response = await client.get("/produtos/")
        
    assert response.status_code == 200
    data = response.json()
    assert "itens" in data      
    assert "total" in data
    assert "pagina" in data   
    assert "tamanho" in data  
    assert isinstance(data["itens"], list) 

# --- 2. TESTE DE SUCESSO NA CRIAÇÃO (Status 201) ---
async def test_criar_produto_com_sucesso():
    async with AsyncClient(transport=transport, base_url=BASE_URL) as client:
        response = await client.post(
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
async def test_criar_produto_preco_invalido():
    async with AsyncClient(transport=transport, base_url=BASE_URL) as client:
        response = await client.post(
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
async def test_atualizar_produto_inexistente():
    async with AsyncClient(transport=transport, base_url=BASE_URL) as client:
        response = await client.put(
            "/produtos/9999", 
            json={
                "nome_produto": "Produto Fantasma"
            }
        )
        
    assert response.status_code == 404
    assert response.json()["detail"] == "Produto não encontrado."

# --- 5. TESTE DE ERRO NA EXCLUSÃO (Status 404) ---
async def test_deletar_produto_inexistente():
    async with AsyncClient(transport=transport, base_url=BASE_URL) as client:
        response = await client.delete("/produtos/9999") 
        
    assert response.status_code == 404
    assert response.json()["detail"] == "Produto não encontrado."