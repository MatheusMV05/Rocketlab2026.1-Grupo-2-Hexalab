"""
ESSE CODIGO É EXPLICITAMENTE DE TESTE, NÃO DEVE MANTER AQUI E DEVE SER DELETADO APOS O FRONT ESTAR FUNCIONANDO INTEGRADO AO BACKEND
APENAS SERVE DE GUIA PARA SILVIO ENTENDER O FLUXO DAS CHAMADAS DOS ROUTERS
"""





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
from app.agent.orquestrador import Orquestrador
from app.agent.db.leitor_esquema import ler_esquema
from app.agent.agentes.agente_seletor import AgenteSeletor
from app.agent.agentes.agente_decompositor import AgenteDecompositor
from app.agent.agentes.agente_refinador import AgenteRefinador
from app.agent.agentes.agente_interpretador import AgenteInterpretador
from app.agent.agentes.agente_sugestor import AgenteSugestor

def run_com_debug():
    """Executa o pipeline com debug detalhado de cada agente."""
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        print("⚠️ ERRO: MISTRAL_API_KEY não foi encontrada no arquivo .env!")
        return

    print("✅ MISTRAL_API_KEY detectada.")
    
    # Caminho para o banco de dados
    db_path = backend_dir / "data" / "database.db"
    print(f"📂 Banco de dados: {db_path}")
    
    if not db_path.exists():
        print(f"❌ ERRO: Banco de dados não encontrado em {db_path}")
        return
        
    print("✅ Banco de dados encontrado.")

    # Inicializa as configurações
    config = Config()
    pergunta = "Liste os 10 clientes VIP com receita lifetime > 1000 que estão há mais de 90 dias sem comprar."

    print("\n" + "="*70)
    print(f"❓ PERGUNTA: {pergunta}")
    print("="*70)

    # === DEBUG: AGENTE SELETOR ===
    print("\n🔍 [DEBUG SELETOR]")
    print("-" * 70)
    
    seletor = AgenteSeletor(config=config)
    
    try:
        esquema_completo = ler_esquema(db_path)
        print(f"✅ Esquema carregado: {len(esquema_completo)} caracteres")
        print(f"Primeiros 500 chars do esquema:\n{esquema_completo[:500]}...\n")
    except Exception as e:
        print(f"❌ Erro ao ler esquema: {e}")
        return

    resultado_seletor = seletor.run(
        esquema_completo=esquema_completo,
        pergunta=pergunta,
    )
    
    print(f"✅ Seletor finalizado")
    print(f"📋 Tabelas selecionadas: {resultado_seletor.tabelas_selecionadas}")
    print(f"🪙 Tokens consumidos: {resultado_seletor.tokens_usados}")
    print(f"📏 Esquema filtrado: {len(resultado_seletor.esquema_filtrado)} caracteres")
    print(f"Esquema filtrado completo:\n{resultado_seletor.esquema_filtrado}\n")

    # === DEBUG: FEW-SHOT RETRIEVER ===
    print("\n🔍 [DEBUG FEW-SHOT RETRIEVER]")
    print("-" * 70)
    
    try:
        from app.agent.few_shots.fewshot_retriever import FewShotRetriever
        
        retriever = FewShotRetriever(path=config.few_shot_path)
        exemplos_recuperados = retriever.retrieve(pergunta, k=3)
        
        print(f"✅ FewShotRetriever ativado")
        print(f"📁 Arquivo de exemplos: {config.few_shot_path}")
        print(f"🎯 K (número de exemplos): 3")
        print(f"🔎 Pergunta para retrieval: '{pergunta}'")
        print(f"📊 Exemplos recuperados: {len(exemplos_recuperados) if exemplos_recuperados else 0}\n")
        
        if exemplos_recuperados:
            for i, exemplo in enumerate(exemplos_recuperados, 1):
                print(f"  [{i}] Pergunta: {exemplo.question[:80]}...")
                print(f"      SQL: {exemplo.sql[:80]}...")
                print(f"      Raciocínio: {exemplo.reasoning[:80] if exemplo.reasoning else 'N/A'}...")
                print()
        else:
            print("  ⚠️ Nenhum exemplo foi recuperado\n")
    except Exception as e:
        print(f"⚠️ Erro ao carregar few-shot: {e}\n")

    # === DEBUG: AGENTE DECOMPOSITOR ===
    print("\n🔍 [DEBUG DECOMPOSITOR]")
    print("-" * 70)
    
    decompositor = AgenteDecompositor(config=config)
    resultado_decompositor = decompositor.run(
        esquema_filtrado=resultado_seletor.esquema_filtrado,
        pergunta=pergunta,
    )
    
    print(f"✅ Decompositor finalizado")
    print(f"🪙 Tokens consumidos: {resultado_decompositor.tokens_usados}")
    print(f"💭 Raciocínio:\n{resultado_decompositor.raciocinio}\n")
    print(f"⚙️ SQL gerado:\n{resultado_decompositor.sql}\n")

    # === DEBUG: AGENTE REFINADOR ===
    print("\n🔍 [DEBUG REFINADOR]")
    print("-" * 70)
    
    refinador = AgenteRefinador(config=config)
    resultado_refinador = refinador.run(
        candidate_sql=resultado_decompositor.sql,
        question=pergunta,
        filtered_schema=resultado_seletor.esquema_filtrado,
        db_path=db_path,
    )
    
    print(f"✅ Refinador finalizado")
    print(f"Sucesso: {resultado_refinador.sucesso}")
    print(f"Impossível: {resultado_refinador.impossivel}")
    print(f"Tentativas: {resultado_refinador.tentativas}")
    print(f"🪙 Tokens consumidos: {resultado_refinador.tokens_usados}")
    print(f"💭 Raciocínio:\n{resultado_refinador.raciocinio}\n")
    print(f"⚙️ SQL final:\n{resultado_refinador.sql}\n")
    if resultado_refinador.ultimo_erro:
        print(f"❌ Último erro: {resultado_refinador.ultimo_erro}\n")

    # === DEBUG: EXECUÇÃO SQL ===
    print("\n🔍 [DEBUG EXECUÇÃO SQL]")
    print("-" * 70)
    
    import sqlite3
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.execute(resultado_refinador.sql)
            colunas = [desc[0] for desc in cursor.description or []]
            dados = cursor.fetchall()
        
        print(f"✅ SQL executado com sucesso")
        print(f"📊 Colunas: {colunas}")
        print(f"📈 Linhas retornadas: {len(dados)}")
        if dados:
            print(f"Primeiros resultados:")
            for i, linha in enumerate(dados[:3], 1):
                print(f"  {i}. {linha}")
        print()
    except Exception as e:
        print(f"❌ Erro na execução SQL: {e}\n")
        dados, colunas = [], []

    # === DEBUG: AGENTE INTERPRETADOR ===
    print("\n🔍 [DEBUG INTERPRETADOR]")
    print("-" * 70)
    
    interpretador = AgenteInterpretador(config=config)
    resultado_interpretador = interpretador.run(
        pergunta=pergunta,
        sql_final=resultado_refinador.sql,
        colunas=colunas,
        dados=dados,
        erro=None if not resultado_refinador.ultimo_erro else resultado_refinador.ultimo_erro,
    )
    
    print(f"✅ Interpretador finalizado")
    print(f"🪙 Tokens consumidos: {resultado_interpretador.tokens_usados}")
    print(f"🗣️ Resposta natural:\n{resultado_interpretador.resposta}\n")

    # === DEBUG: AGENTE SUGESTOR ===
    print("\n🔍 [DEBUG SUGESTOR]")
    print("-" * 70)
    
    sugestor = AgenteSugestor(config=config)
    
    # Monta amostra de resultado para o sugestor
    amostra_resultado = ""
    if dados and colunas:
        amostra_resultado = "\n".join([
            ", ".join([f"{col}: {val}" for col, val in zip(colunas, linha)])
            for linha in dados[:2]
        ])
    
    resultado_sugestor = sugestor.run(
        pergunta=pergunta,
        sql_gerado=resultado_refinador.sql,
        schema=resultado_seletor.esquema_filtrado,
        amostra_resultado=amostra_resultado,
    )
    
    print(f"✅ Sugestor finalizado")
    print(f"🪙 Tokens consumidos: {resultado_sugestor.tokens_usados}")
    print(f"📌 Tabela principal: {resultado_sugestor.tabela_principal}")
    print(f"📌 Tabelas adjacentes: {resultado_sugestor.tabelas_adjacentes}")
    print(f"💡 Sugestões de próximas perguntas:")
    for i, sugestao in enumerate(resultado_sugestor.sugestoes, 1):
        print(f"  {i}. {sugestao}")
    print()

    print("\n" + "="*70)
    print("📋 RESUMO FINAL")
    print("="*70)
    tokens_total = (
        resultado_seletor.tokens_usados
        + resultado_decompositor.tokens_usados
        + resultado_refinador.tokens_usados
        + resultado_interpretador.tokens_usados
        + resultado_sugestor.tokens_usados
    )
    print(f"Total de tokens: {tokens_total}")
    print(f"SQL Final: {resultado_refinador.sql[:100]}...")
    print(f"Resposta: {resultado_interpretador.resposta[:150]}...")
    print(f"Próximas perguntas: {', '.join(resultado_sugestor.sugestoes[:2])}...")

def run():
    """Executa o pipeline completo via orquestrador."""
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        print("⚠️ ERRO: MISTRAL_API_KEY não foi encontrada no arquivo .env!")
        return

    print("✅ MISTRAL_API_KEY detectada.")
    
    # Caminho para o banco de dados
    db_path = backend_dir / "data" / "database.db"
    print(f"📂 Banco de dados: {db_path}")
    
    if not db_path.exists():
        print(f"❌ ERRO: Banco de dados não encontrado em {db_path}")
        return
        
    print("✅ Banco de dados encontrado.")

    # Inicializa as configurações
    config = Config()
    
    # Instancia o Orquestrador
    print("🤖 Instanciando Orquestrador...")
    orquestrador = Orquestrador(db_path=db_path, config=config)

    pergunta = "Quais os 5 produtos com maior receita no último trimestre?"

    print("\n" + "="*70)
    print(f"❓ PERGUNTA: {pergunta}")
    print("="*70)
    
    # Executa o pipeline completo
    resultado = orquestrador.responder(pergunta)
    
    print(f"\n✅ Sucesso: {resultado.sucesso}")
    print(f"🚫 Impossível: {resultado.impossivel}")
    
    if resultado.erro:
        print(f"❌ Erro: {resultado.erro}")
    
    if resultado.raciocinio:
        print(f"\n🧠 [Raciocínio]")
        print(resultado.raciocinio)
    
    if resultado.sql_final:
        print(f"\n⚙️ [SQL Final]")
        print(resultado.sql_final)

    if resultado.resposta_natural:
        print(f"\n🗣️ [Resposta em Linguagem Natural]")
        print(resultado.resposta_natural)
    
    if resultado.dados:
        print(f"\n📊 [Resultados: {len(resultado.dados)} linhas]")
        print(f"Colunas: {resultado.colunas}")
        for i, linha in enumerate(resultado.dados[:5], 1):
            print(f"  {i}. {linha}")
        if len(resultado.dados) > 5:
            print(f"  ... ({len(resultado.dados) - 5} mais linhas)")
    
    # === GERAR SUGESTÕES ===
    sugestor = AgenteSugestor(config=config)
    
    amostra_resultado = ""
    if resultado.dados and resultado.colunas:
        amostra_resultado = "\n".join([
            ", ".join([f"{col}: {val}" for col, val in zip(resultado.colunas, linha)])
            for linha in resultado.dados[:2]
        ])
    
    resultado_sugestor = sugestor.run(
        pergunta=pergunta,
        sql_gerado=resultado.sql_final,
        schema=None,
        amostra_resultado=amostra_resultado,
    )
    
    if resultado_sugestor.sugestoes:
        print(f"\n💡 [Próximas Perguntas Sugeridas]")
        for i, sugestao in enumerate(resultado_sugestor.sugestoes, 1):
            print(f"  {i}. {sugestao}")
    
    print(f"\n🪙 Tokens consumidos: {resultado.tokens_totais + resultado_sugestor.tokens_usados}")
    
    print("\n🎉 Teste finalizado com sucesso!")

if __name__ == "__main__":
    import sys
    
    # Se passar argumento 'debug', usa a versão com debug detalhado
    if len(sys.argv) > 1 and sys.argv[1] == "debug":
        print("🔍 MODO DEBUG ATIVADO - Exibindo detalhes de cada agente\n")
        run_com_debug()
    else:
        print("▶️ MODO NORMAL - Exibindo apenas resultado final")
        print("💡 Dica: execute com 'python run_test.py debug' para modo debug\n")
        run()

