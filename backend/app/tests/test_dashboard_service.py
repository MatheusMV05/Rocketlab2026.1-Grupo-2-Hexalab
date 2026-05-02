import pytest
from unittest.mock import AsyncMock, patch

from app.dashboard import service
from app.dashboard.schemas import (
    KpiResponse,
    VendasMensalResponse,
    TopProdutosResponse,
    RegiaoResponse,
    StatusPedidosResponse,
)
from app.dashboard.models import (
    mock_kpis,
    mock_vendas_mensal,
    mock_top_produtos,
    mock_por_regiao,
    mock_status_pedidos,
)


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.mark.asyncio
async def test_get_kpis_returns_correct_schema(mock_db):
    with patch("app.dashboard.repository.get_kpis", new=AsyncMock(return_value=mock_kpis())):
        result = await service.get_kpis(mock_db)

    assert isinstance(result, KpiResponse)
    assert result.receita_total == 487320.50
    assert result.total_pedidos == 1243
    assert result.ticket_medio == 392.05
    assert result.total_clientes == 836


@pytest.mark.asyncio
async def test_get_vendas_mensal_returns_correct_schema(mock_db):
    with patch("app.dashboard.repository.get_vendas_mensal", new=AsyncMock(return_value=mock_vendas_mensal())):
        result = await service.get_vendas_mensal(mock_db)

    assert isinstance(result, VendasMensalResponse)
    assert len(result.items) == 11
    assert result.items[0].mes_ano == "Jul/2024"
    assert result.items[0].receita_total == 32140.00


@pytest.mark.asyncio
async def test_get_top_produtos_returns_sorted_by_revenue(mock_db):
    with patch("app.dashboard.repository.get_top_produtos", new=AsyncMock(return_value=mock_top_produtos())):
        result = await service.get_top_produtos(mock_db)

    assert isinstance(result, TopProdutosResponse)
    assert len(result.items) == 10
    revenues = [item.receita_total for item in result.items]
    assert revenues == sorted(revenues, reverse=True)


@pytest.mark.asyncio
async def test_get_por_regiao_returns_sorted_by_revenue(mock_db):
    with patch("app.dashboard.repository.get_por_regiao", new=AsyncMock(return_value=mock_por_regiao())):
        result = await service.get_por_regiao(mock_db)

    assert isinstance(result, RegiaoResponse)
    assert result.items[0].estado == "São Paulo"
    revenues = [item.receita_total for item in result.items]
    assert revenues == sorted(revenues, reverse=True)


@pytest.mark.asyncio
async def test_get_status_pedidos_percentuals_sum_to_100(mock_db):
    with patch("app.dashboard.repository.get_status_pedidos", new=AsyncMock(return_value=mock_status_pedidos())):
        result = await service.get_status_pedidos(mock_db)

    assert isinstance(result, StatusPedidosResponse)
    total_percentual = sum(item.percentual for item in result.items)
    assert abs(total_percentual - 100.0) < 0.1


@pytest.mark.asyncio
async def test_get_status_pedidos_returns_sorted_by_total(mock_db):
    with patch("app.dashboard.repository.get_status_pedidos", new=AsyncMock(return_value=mock_status_pedidos())):
        result = await service.get_status_pedidos(mock_db)

    totals = [item.total for item in result.items]
    assert totals == sorted(totals, reverse=True)


@pytest.mark.asyncio
async def test_get_status_pedidos_percentual_precision(mock_db):
    with patch("app.dashboard.repository.get_status_pedidos", new=AsyncMock(return_value=mock_status_pedidos())):
        result = await service.get_status_pedidos(mock_db)

    for item in result.items:
        assert item.percentual == round(item.percentual, 2)
