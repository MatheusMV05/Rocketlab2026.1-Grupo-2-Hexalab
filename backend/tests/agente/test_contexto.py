import os
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from app.agent.orquestrador import Orquestrador
from app.agent.agentes.memory.memory_store import InMemoryTTLSessionStore
from app.agent.config import Config

# Configuração de Logs para ver o que está acontecendo no terminal
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def rodar_teste_real():
    # 1. Inicialização
    config = Config() 
    db_path = Path(__file__).resolve().parents[2] / "data" / "database.db"
    orquestrador = Orquestrador(db_path=db_path, config=config)
    store = InMemoryTTLSessionStore()
    
    sessao_id = "teste_usuario_001"
    
    print("\n--- TURNO 1 ---")
    pergunta_1 = "Quanto vendemos em 2023?"
    print(f"Usuário: {pergunta_1}")
    
    # Simula a lógica da API: busca histórico -> responde -> salva histórico
    historico_1 = store.get_history(sessao_id)
    resultado_1 = orquestrador.responder(pergunta_1, message_history=historico_1)
    store.save_history(sessao_id, resultado_1.novo_historico)
    
    print(f"SQL Gerado: {resultado_1.sql_final}")
    print(f"Resposta IA: {resultado_1.resposta_natural}")

    print("\n--- TURNO 2 (TESTE DE MEMÓRIA) ---")
    # Pergunta ambígua que depende da anterior ("Notebook" e "2023")
    pergunta_2 = "E qual foi o valor vendido do Notebook ?" 
    print(f"Usuário: {pergunta_2}")
    
    # Recupera o histórico que agora contém o Turno 1
    historico_2 = store.get_history(sessao_id)
    resultado_2 = orquestrador.responder(pergunta_2, message_history=historico_2)
    store.save_history(sessao_id, resultado_2.novo_historico)
    
    print(f"SQL Gerado: {resultado_2.sql_final}")
    print(f"Resposta IA: {resultado_2.resposta_natural}")

    # Validação do Teste
    if "2023" in resultado_2.sql_final:
        print("\n✅ SUCESSO: O agente lembrou que estávamos falando de 2023!")
    else:
        print("\n❌ FALHA: O agente não utilizou o contexto do turno anterior.")

if __name__ == "__main__":
    rodar_teste_real()
