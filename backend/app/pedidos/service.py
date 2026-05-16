from typing import Optional, List
import logging
import os
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from fastapi import HTTPException
from app.pedidos.schemas import (
    ListaPedidoPaginada, PedidoItem, KpisPedidos, AnaliseFluxo, 
    EtapaFluxo, PedidoDetalhe, ProdutoNoPedido
)
from app.pedidos.repository import PedidoRepository

# Configuração de um log temporário para capturar erros do banco
LOG_FILE = "/Users/rodrigotorres/Rocketlab2026.1-Grupo-2-Hexalab/backend/app/pedidos_error.log"

class PedidoService:
    @staticmethod
    def _map_to_pedido_item(p: any) -> PedidoItem:
        # p é um Row do SQLAlchemy. Usamos _mapping para acesso seguro.
        data = p._mapping
        return PedidoItem(
            id=str(data.get("id_pedido", "")),
            cod_pedido=str(data.get("id_pedido", "")),
            nome_cliente=f"{data.get('nome_cliente') or ''} {data.get('sobrenome_cliente') or ''}".strip() or "Cliente Desconhecido",
            cod_produto=str(data.get("id_produto", "")),
            nome_produto=data.get("nome_produto") or "Produto Desconhecido",
            categoria=data.get("categoria") or "Geral",
            valor=float(data.get("valor_pedido_brl") or 0.0),
            quantidade=int(data.get("quantidade") or 0),
            data=data.get("data_pedido_txt") or "",
            metodo_pagamento=data.get("metodo_pagamento") or "N/A",
            status=data.get("status") or "Pendente",
            risco="Dentro do SLA"
        )

    @staticmethod
    async def listar_pedidos(
        db: AsyncSession,
        query: Optional[str] = None,
        status: Optional[str] = None,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
        ano: Optional[int] = None,
        mes: Optional[int] = None,
        categoria: Optional[str] = None,
        pagina: int = 1,
        tamanho: int = 20
    ) -> ListaPedidoPaginada:
        try:
            if data_inicio and data_fim and data_fim < data_inicio:
                raise HTTPException(status_code=422, detail="data_fim não pode ser anterior a data_inicio")

            total, resultados = await PedidoRepository.listar_pedidos(
                db=db,
                query=query,
                status=status,
                data_inicio=data_inicio,
                data_fim=data_fim,
                ano=ano,
                mes=mes,
                categoria=categoria,
                pagina=pagina,
                tamanho=tamanho
            )
            
            itens = [PedidoService._map_to_pedido_item(p) for p in resultados]
            paginas = (total + tamanho - 1) // tamanho if tamanho > 0 else 0
            
            return ListaPedidoPaginada(
                itens=itens,
                total=total,
                pagina=pagina,
                tamanho=tamanho,
                paginas=paginas
            )
        except Exception as e:
            # Escreve o erro no arquivo de log para debug
            with open(LOG_FILE, "a") as f:
                f.write(f"Erro em listar_pedidos: {str(e)}\n")
            raise HTTPException(status_code=500, detail=f"Erro interno ao processar pedidos: {str(e)}")

    @staticmethod
    async def obter_pedido_por_id(db: AsyncSession, pedido_id: str) -> Optional[PedidoDetalhe]:
        try:
            resultados = await PedidoRepository.obter_pedido_por_id(db=db, pedido_id=pedido_id)
            if not resultados:
                return None
            
            primeiro = resultados[0]._mapping
            
            produtos = []
            valor_total = 0
            qtd_total = 0
            
            for r in resultados:
                data = r._mapping
                valor = float(data.get("valor_pedido_brl") or 0.0)
                qtd = int(data.get("quantidade") or 0)
                produtos.append(ProdutoNoPedido(
                    cod_produto=str(data.get("id_produto", "")),
                    nome_produto=data.get("nome_produto") or "Produto Desconhecido",
                    categoria=data.get("categoria") or "Geral",
                    valor=valor,
                    quantidade=qtd
                ))
                valor_total += valor
                qtd_total += qtd

            return PedidoDetalhe(
                id=str(primeiro.get("id_pedido", "")),
                cod_pedido=str(primeiro.get("id_pedido", "")),
                id_cliente=str(primeiro.get("id_cliente", "")),
                nome_cliente=f"{primeiro.get('nome_cliente') or ''} {primeiro.get('sobrenome_cliente') or ''}".strip() or "Cliente Desconhecido",
                valor_total=valor_total,
                data=primeiro.get("data_pedido_txt") or "",
                metodo_pagamento=primeiro.get("metodo_pagamento") or "N/A",
                status=primeiro.get("status") or "Pendente",
                quantidade_total=qtd_total,
                produtos=produtos
            )
        except Exception as e:
            with open(LOG_FILE, "a") as f:
                f.write(f"Erro em obter_pedido_por_id: {str(e)}\n")
            raise HTTPException(status_code=500, detail="Erro ao obter detalhes do pedido")

    @staticmethod
    async def obter_kpis(db: AsyncSession) -> KpisPedidos:
        try:
            kpis = await PedidoRepository.obter_kpis(db)
            return KpisPedidos(**kpis)
        except Exception as e:
            with open(LOG_FILE, "a") as f:
                f.write(f"Erro em obter_kpis: {str(e)}\n")
            raise HTTPException(status_code=500, detail="Erro ao obter KPIs de pedidos")

    @staticmethod
    async def obter_analise_fluxo(db: AsyncSession) -> AnaliseFluxo:
        """Constrói a análise de fluxo a partir de dados reais agrupados por categoria."""
        try:
            dados = await PedidoRepository.obter_contagem_por_categoria(db)
            kpis = await PedidoRepository.obter_kpis(db)
            
            # Agrupa por categoria
            categorias: dict = {}
            for row in dados:
                cat = row[0] or "Outros"
                total = row[1] or 0
                status = (row[2] or "").lower()
                if cat not in categorias:
                    categorias[cat] = {"total": 0, "aprovado": 0, "recusado": 0, "processando": 0, "reembolsado": 0}
                categorias[cat]["total"] += total
                if status in categorias[cat]:
                    categorias[cat][status] += total

            # Monta as etapas baseadas nas top 5 categorias por volume
            sorted_cats = sorted(categorias.items(), key=lambda x: x[1]["total"], reverse=True)[:5]
            
            etapas = []
            for cat_nome, cat_data in sorted_cats:
                total = cat_data["total"]
                recusados = cat_data["recusado"]
                processando = cat_data["processando"]
                reembolsado = cat_data["reembolsado"]
                aprovado = cat_data["aprovado"]
                
                # Determina o status
                taxa_problema = (recusados + reembolsado) / total * 100 if total > 0 else 0
                if taxa_problema > 15:
                    status_etapa = "Risco de atraso"
                elif taxa_problema > 8:
                    status_etapa = "Atraso"
                else:
                    status_etapa = "Dentro do SLA"
                
                etapas.append(EtapaFluxo(
                    id=cat_nome.lower().replace(" ", "_"),
                    titulo=cat_nome.capitalize(),
                    total_pedidos=total,
                    status=status_etapa,
                    problemas=[
                        f"{recusados} pedidos recusados nesta categoria ({recusados/total*100:.1f}% do total)" if total > 0 else "Sem dados",
                        f"{reembolsado} pedidos reembolsados ({reembolsado/total*100:.1f}% do total)" if total > 0 else "Sem dados",
                    ],
                    gargalos=[
                        f"Aprovados: {aprovado}",
                        f"Processando: {processando}",
                        f"Recusados: {recusados}",
                    ]
                ))

            return AnaliseFluxo(
                etapas=etapas,
                total_pedidos=kpis["total"]
            )
        except Exception as e:
            with open(LOG_FILE, "a") as f:
                f.write(f"Erro em obter_analise_fluxo: {str(e)}\n")
            raise HTTPException(status_code=500, detail="Erro ao obter análise de fluxo")

    @staticmethod
    async def criar_pedido(db: AsyncSession, pedido_in: any) -> PedidoDetalhe:
        try:
            pedido = await PedidoRepository.criar_pedido(db, pedido_in.model_dump())
            # Após criar, buscamos novamente para vir com os Joins das dimensões
            return await PedidoService.obter_pedido_por_id(db, pedido.id_pedido)
        except Exception as e:
            with open(LOG_FILE, "a") as f:
                f.write(f"Erro em criar_pedido: {str(e)}\n")
            raise HTTPException(status_code=500, detail=f"Erro ao criar pedido: {str(e)}")

    @staticmethod
    async def atualizar_pedido(db: AsyncSession, pedido_id: str, update_in: any) -> Optional[PedidoDetalhe]:
        try:
            pedido = await PedidoRepository.atualizar_pedido(db, pedido_id, update_in.model_dump(exclude_unset=True))
            if not pedido:
                return None
            return await PedidoService.obter_pedido_por_id(db, pedido_id)
        except Exception as e:
            with open(LOG_FILE, "a") as f:
                f.write(f"Erro em atualizar_pedido: {str(e)}\n")
            raise HTTPException(status_code=500, detail="Erro ao atualizar pedido")

    @staticmethod
    async def deletar_pedido(db: AsyncSession, pedido_id: str) -> bool:
        try:
            return await PedidoRepository.deletar_pedido(db, pedido_id)
        except Exception as e:
            with open(LOG_FILE, "a") as f:
                f.write(f"Erro em deletar_pedido: {str(e)}\n")
            raise HTTPException(status_code=500, detail="Erro ao deletar pedido")
