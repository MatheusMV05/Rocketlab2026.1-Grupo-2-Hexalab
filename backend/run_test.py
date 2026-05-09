import os
import sys
from pathlib import Path

# Adiciona o diretório backend ao PYTHONPATH para os imports locais funcionarem
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

from dotenv import load_dotenv

# Carrega as variáveis do .env (onde a MISTRAL_API_KEY deve estar configurada)
env_path = backend_dir / ".env"
load_dotenv(env_path)

from app.agent.config import Config
from app.agent.agentes.agente_seletor import AgenteSeletor
from app.agent.agentes.agente_decompositor import AgenteDecompositor
from app.agent.db.leitor_esquema import ler_esquema

def run():
    import asyncio
    try:
        asyncio.get_event_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())

    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        print("⚠️ ERRO: MISTRAL_API_KEY não foi encontrada no arquivo .env!")
        return

    print("✅ MISTRAL_API_KEY detectada.")
    
    # Extrai o esquema dinamicamente do banco real usando a função existente da pipeline
    db_path = backend_dir / "data" / "database.db"
    print(f"📂 Extraindo esquema de: {db_path}")
    
    try:
        esquema_completo = ler_esquema(db_path)
    except Exception as e:
        print(f" ERRO ao ler o esquema do banco: {e}")
        return
        
    print(f"✅ Esquema extraído com sucesso! Tamanho: {len(esquema_completo)} caracteres.")

    # Inicializa as configurações
    config = Config()
    
    # Instancia os agentes
    print("🤖 Instanciando AgenteSeletor e AgenteDecompositor...")
    seletor = AgenteSeletor(config=config)
    decompositor = AgenteDecompositor(config=config)

    # Pergunta que exige filtro de datas para testar as tabelas
    pergunta = "Qual produto com mais lucro no ultimo mes?"

    print(f"\n❓ PERGUNTA: {pergunta}")

    # --- PASSO 1 ---
    print("\n" + "="*40)
    print(" Passo 1: AGENTE SELETOR")
    print("="*40)
    print("Enviando esquema completo e pedindo para filtrar as tabelas relevantes...")
    
    resultado_seletor = seletor.run(esquema_completo=esquema_completo, pergunta=pergunta)
    
    print("\n✅ Tabelas Selecionadas pelo Seletor:")
    for tab in resultado_seletor.tabelas_selecionadas:
        print(f"  - {tab}")
    print(f"🪙 Tokens consumidos: {resultado_seletor.tokens_usados}")

    # --- PASSO 2 ---
    print("\n" + "="*40)
    print(" Passo 2: AGENTE DECOMPOSITOR")
    print("="*40)
    print("Enviando o esquema filtrado para gerar o raciocínio e o SQL...")
    
    resultado_decompositor = decompositor.run(
        esquema_filtrado=resultado_seletor.esquema_filtrado, 
        pergunta=pergunta
    )

    print("\n🧠 [Raciocínio Gerado]")
    print(resultado_decompositor.raciocinio)
    
    print("\n⚙️ [SQL Final]")
    print(resultado_decompositor.sql)
    
    print(f"\n🪙 Tokens consumidos: {resultado_decompositor.tokens_usados}")
    print("\n🎉 Teste finalizado com sucesso!")

if __name__ == "__main__":
    run()
