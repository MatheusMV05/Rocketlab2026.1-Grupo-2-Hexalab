"""
ESSE CODIGO É EXPLICITAMENTE DE TESTE, NÃO DEVE MANTER AQUI E DEVE SER DELETADO APOS O FRONT ESTAR FUNCIONANDO INTEGRADO AO BACKEND
APENAS SERVE DE GUIA PARA SILVIO ENTENDER O FLUXO DAS CHAMADAS DOS ROUTERS
"""





import json
import os
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
from datetime import datetime
from pathlib import Path
from typing import Any

# Adiciona o diretório backend ao PYTHONPATH para os imports locais funcionarem
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

from dotenv import load_dotenv

# Carrega as variáveis do .env (onde a MISTRAL_API_KEY deve estar configurada)
env_path = backend_dir / ".env"
load_dotenv(env_path)

from app.agent.config import Config
from app.agent.db.leitor_esquema import ler_esquema
from app.agent.agentes.agente_seletor import AgenteSeletor
from app.agent.agentes.agente_decompositor import AgenteDecompositor
from app.agent.agentes.agente_refinador import AgenteRefinador
from app.agent.agentes.agente_interpretador import AgenteInterpretador
from app.agent.agentes.agente_sugestor import AgenteSugestor
from app.agent.hints.generator import generate_examples_from_schema


AUDITORIA_CONTEXT_MANAGER: list[dict[str, Any]] = []
AUDITORIA_INJECAO_HISTORICO: list[dict[str, Any]] = []
MARCADOR_CONTEXTO_DEBUG = "DEBUG_CONTEXT_MARKER_RUN_TEST_2026"


def _extrair_texto_mensagem(mensagem: object) -> str:
    """Extrai texto legível de itens de histórico para debug.

    Aceita mensagens simples (`dict`/`str`) e mensagens do PydanticAI com
    `parts`. O objetivo é gerar previews e estimativas de tamanho sem depender
    do tipo concreto retornado pelas capabilities.
    """
    if isinstance(mensagem, dict):
        return str(mensagem.get("content") or mensagem)
    if isinstance(mensagem, str):
        return mensagem

    partes = getattr(mensagem, "parts", None)
    if partes:
        textos = []
        for parte in partes:
            textos.append(str(getattr(parte, "content", parte)))
        return " | ".join(textos)

    return str(getattr(mensagem, "content", mensagem))


def _resumir_historico(historico: list[object] | None) -> dict[str, Any]:
    """Resume um histórico em métricas auditáveis.

    Retorna contagem de mensagens, caracteres aproximados, distribuição de
    tipos e pequenas amostras. Esse resumo é o que vai para o JSON de auditoria,
    evitando gravar histórico inteiro no console ou no arquivo.
    """
    mensagens = list(historico or [])
    tipos: dict[str, int] = {}
    total_chars = 0
    amostras = []

    for indice, mensagem in enumerate(mensagens, 1):
        tipo = type(mensagem).__name__
        tipos[tipo] = tipos.get(tipo, 0) + 1
        texto = _extrair_texto_mensagem(mensagem)
        total_chars += len(texto)
        if len(amostras) < 5:
            amostras.append(
                {
                    "indice": indice,
                    "tipo": tipo,
                    "chars": len(texto),
                    "preview": texto[:240],
                }
            )

    return {
        "mensagens": len(mensagens),
        "chars_aproximados": total_chars,
        "tipos": tipos,
        "amostras": amostras,
    }


def _auditar_context_manager(
    etapa: str,
    entrada: list[object] | None,
    saida: list[object] | None,
    usa_capability: bool = True,
) -> None:
    """Registra a transformação do histórico em uma etapa do pipeline.

    Compara histórico de entrada e saída do agente, imprime métricas no console
    e acumula o evento em `AUDITORIA_CONTEXT_MANAGER` para gravação em JSON. O
    campo `usa_capability` diferencia etapas que passam pela sumarização de
    memória das que apenas carregam contexto.
    """
    resumo_entrada = _resumir_historico(entrada)
    resumo_saida = _resumir_historico(saida)
    if resumo_saida["mensagens"]:
        status = "OK"
    elif usa_capability:
        status = "SEM_HISTORICO_RETORNADO"
    else:
        status = "NAO_APLICAVEL"

    evento = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "etapa": etapa,
        "status": status,
        "usa_context_manager_capability": usa_capability,
        "entrada": resumo_entrada,
        "saida": resumo_saida,
        "delta_mensagens": resumo_saida["mensagens"] - resumo_entrada["mensagens"],
        "delta_chars": resumo_saida["chars_aproximados"] - resumo_entrada["chars_aproximados"],
    }
    AUDITORIA_CONTEXT_MANAGER.append(evento)

    print(f"\n[DEBUG CONTEXT MANAGER] {etapa}")
    print("-" * 70)
    print(f"Status: {status}")
    print(
        "Entrada: "
        f"{resumo_entrada['mensagens']} mensagens, "
        f"{resumo_entrada['chars_aproximados']} chars, "
        f"tipos={resumo_entrada['tipos']}"
    )
    print(
        "Saida:   "
        f"{resumo_saida['mensagens']} mensagens, "
        f"{resumo_saida['chars_aproximados']} chars, "
        f"tipos={resumo_saida['tipos']}"
    )
    print(f"Delta: mensagens={evento['delta_mensagens']}, chars={evento['delta_chars']}")
    if resumo_saida["amostras"]:
        print("Amostras da saida processada:")
        for amostra in resumo_saida["amostras"]:
            print(
                f"  [{amostra['indice']}] {amostra['tipo']} "
                f"({amostra['chars']} chars): {amostra['preview']}"
            )


def _salvar_auditoria_context_manager() -> None:
    """Grava a auditoria acumulada em `debug_context_manager_audit.json`."""
    caminho = backend_dir / "debug_context_manager_audit.json"
    payload = {
        "context_manager": AUDITORIA_CONTEXT_MANAGER,
        "injecao_historico": AUDITORIA_INJECAO_HISTORICO,
    }
    with caminho.open("w", encoding="utf-8") as arquivo:
        json.dump(payload, arquivo, ensure_ascii=False, indent=2)
    print(f"\n[DEBUG CONTEXT MANAGER] Auditoria salva em: {caminho}")


def _auditar_injecao_historico(
    etapa: str,
    ponto: str,
    historico: list[object] | None,
) -> None:
    """Audita se o histórico foi recebido no ponto instrumentado do agente.

    Usa um marcador textual único inserido no histórico sintético. A presença
    desse marcador confirma que o contexto não apenas existe, mas é o mesmo
    histórico de teste chegando ao agente antes/depois das rotinas de corte e
    normalização para o PydanticAI.
    """
    resumo = _resumir_historico(historico)
    texto_total = "\n".join(_extrair_texto_mensagem(mensagem) for mensagem in (historico or []))
    marcador_presente = MARCADOR_CONTEXTO_DEBUG in texto_total

    evento = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "etapa": etapa,
        "ponto": ponto,
        "status": "OK" if resumo["mensagens"] and marcador_presente else "FALHA",
        "marcador": MARCADOR_CONTEXTO_DEBUG,
        "marcador_presente": marcador_presente,
        "historico": resumo,
    }
    AUDITORIA_INJECAO_HISTORICO.append(evento)

    print(f"\n[DEBUG CONTEXT INJECTION] {etapa} :: {ponto}")
    print("-" * 70)
    print(f"Status: {evento['status']}")
    print(f"Marcador presente: {marcador_presente}")
    print(
        "Historico recebido: "
        f"{resumo['mensagens']} mensagens, "
        f"{resumo['chars_aproximados']} chars, "
        f"tipos={resumo['tipos']}"
    )


def _instalar_auditoria_injecao(agente: object, etapa: str) -> None:
    """Instrumenta um agente para auditar a passagem de `message_history`.

    A instrumentação é local ao `run_test`: envolve os métodos de corte e
    normalização de histórico no objeto do agente, sem alterar o código de
    produção. Funciona para agentes que usam `_call_llm` e para o Refinador,
    que chama `_limitar_message_history`/`_normalizar_message_history`
    diretamente.
    """
    if hasattr(agente, "_limitar_message_history"):
        limitar_original = agente._limitar_message_history

        def limitar_com_auditoria(message_history):
            _auditar_injecao_historico(etapa, "entrada_limitar_message_history", message_history)
            historico_limitado = limitar_original(message_history)
            _auditar_injecao_historico(etapa, "saida_limitar_message_history", historico_limitado)
            return historico_limitado

        agente._limitar_message_history = limitar_com_auditoria

    if hasattr(agente, "_normalizar_message_history"):
        normalizar_original = agente._normalizar_message_history

        def normalizar_com_auditoria(message_history, sistema=None):
            _auditar_injecao_historico(etapa, "entrada_normalizar_message_history", message_history)
            historico_pydantic = normalizar_original(message_history, sistema=sistema)
            _auditar_injecao_historico(etapa, "saida_normalizar_message_history", historico_pydantic)
            return historico_pydantic

        agente._normalizar_message_history = normalizar_com_auditoria


def _estimar_tokens(texto: str) -> int:
    """Estimativa simples para calibrar teste de redução de contexto."""
    return max(1, round(len(texto) / 4))


def _gerar_historico_longo(target_tokens: int = 7_000) -> list[dict[str, str]]:
    """Gera histórico sintético para testar sumarização de contexto.

    O conteúdo é propositalmente repetitivo e alinhado ao schema real
    (`mart_cliente_360`, `receita_lifetime_brl`,
    `dias_desde_ultimo_pedido`) para pressionar a janela de memória sem induzir
    o modelo a inventar tabelas transacionais. O gerador tenta ficar abaixo do
    alvo, reservando espaço para uma mensagem final de resumo.
    """
    target_chars = target_tokens * 4
    historico: list[dict[str, str]] = []
    total_chars = 0
    turno = 1
    resumo_final = (
        "Resumo antes da pergunta final: mantenha o foco em clientes premium, "
        "usando mart_cliente_360. Use receita_lifetime_brl > 1000 e "
        "dias_desde_ultimo_pedido > 90. Retorne um ranking enxuto. Esta mensagem "
        "existe para testar se a redução de contexto preserva a intenção mais recente. "
        f"Marcador de auditoria: {MARCADOR_CONTEXTO_DEBUG}."
    )

    while total_chars < target_chars - len(resumo_final):
        pergunta_turno = (
            f"Turno {turno}. Quero analisar retenção, recorrência e clientes premium. "
            "Considere como contexto fixo que a tabela preferida para perguntas de "
            "cliente é mart_cliente_360. Clientes premium são os que têm "
            "receita_lifetime_brl acima de 1000. Recência deve usar "
            "dias_desde_ultimo_pedido. Clientes parados há bastante tempo são os que "
            "têm dias_desde_ultimo_pedido maior que 90. Prefiro respostas objetivas "
            "com SQL auditável usando colunas já consolidadas da mart, sem inferir "
            "tabelas transacionais inexistentes. "
        )
        resposta_turno = (
            f"Turno {turno}. Entendido. Vou manter no contexto que a análise deve focar "
            "mart_cliente_360, receita_lifetime_brl, dias_desde_ultimo_pedido, "
            "segmento_valor, total_pedidos e risco de churn. Quando a pergunta falar "
            "em clientes parados, interpretarei como dias_desde_ultimo_pedido > 90. "
            "Quando pedir ranking de clientes premium, vou ordenar por "
            "receita_lifetime_brl desc e retornar id_cliente, nome, sobrenome, "
            "receita_lifetime_brl e dias_desde_ultimo_pedido quando disponíveis. "
        )
        chars_turno = len(pergunta_turno) + len(resposta_turno)
        if total_chars + chars_turno + len(resumo_final) > target_chars:
            break

        historico.append({"role": "user", "content": pergunta_turno})
        historico.append({"role": "assistant", "content": resposta_turno})
        total_chars += chars_turno
        turno += 1

    historico.append(
        {
            "role": "user",
            "content": resumo_final,
        }
    )
    return historico


def _imprimir_historico(rotulo: str, historico: list[object] | None) -> None:
    """Mostra um histórico de forma compacta no console.

    Para históricos longos, imprime apenas começo e fim, além da estimativa de
    tokens. Isso mantém o `run_test` legível mesmo quando o histórico foi criado
    para disparar sumarização.
    """
    print(f"\n🧠 [DEBUG HISTÓRICO] {rotulo}")
    print("-" * 70)
    if not historico:
        print("(histórico vazio)")
        return

    print(f"Total de mensagens: {len(historico)}")
    texto_total = "\n".join(_extrair_texto_mensagem(mensagem) for mensagem in historico)
    print(f"Estimativa aproximada de tokens: {_estimar_tokens(texto_total)}")

    limite_inicio = 5
    limite_fim = 3
    for indice, mensagem in enumerate(historico, 1):
        if indice > limite_inicio and indice <= len(historico) - limite_fim:
            if indice == limite_inicio + 1:
                ocultas = max(0, len(historico) - limite_inicio - limite_fim)
                print(f"  ... {ocultas} mensagens omitidas no console ...")
            continue
        preview = _extrair_texto_mensagem(mensagem)[:300]
        print(f"  [{indice}] {type(mensagem).__name__}: {preview}")

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

    os.environ.setdefault("AGENT_CONTEXT_MAX_TOKENS", "8000")
    os.environ.setdefault("AGENT_CONTEXT_COMPRESS_THRESHOLD", "0.8")
    os.environ.setdefault("AGENT_CONTEXT_CAPABILITY_MODE", "summarize")
    os.environ.setdefault("AGENT_CONTEXT_SUMMARIZER_MODEL", "mistral:ministral-8b-latest")
    os.environ.setdefault("AGENT_INPUT_HISTORY_MAX_TOKENS", "7000")
    os.environ.setdefault("MISTRAL_TIMEOUT_SECONDS", "180")
    os.environ.setdefault("DEBUG_HISTORY_TARGET_TOKENS", "7000")

    # Inicializa as configurações
    config = Config()
    context_max_tokens = int(os.getenv("AGENT_CONTEXT_MAX_TOKENS", "8000"))
    context_threshold = float(os.getenv("AGENT_CONTEXT_COMPRESS_THRESHOLD", "0.8"))
    target_tokens = int(os.getenv("DEBUG_HISTORY_TARGET_TOKENS", "7000"))

    print("\n[DEBUG CONTEXT MANAGER] Configuracao esperada da capability")
    print("-" * 70)
    print("Capability mode=summarize (obrigatorio)")
    print(f"Summarizer model={config.context_summarizer_model}")
    print(f"max_tokens={context_max_tokens}")
    print(f"compress_threshold={context_threshold}")
    print(f"compressao esperada a partir de ~{round(context_max_tokens * context_threshold)} tokens")
    print(f"limite preventivo de historico enviado={config.input_history_max_tokens} tokens")
    print(f"timeout Mistral={config.mistral_timeout_seconds}s")
    print(f"historico de teste mira ~{target_tokens} tokens")
    print(f"marcador de contexto auditado={MARCADOR_CONTEXTO_DEBUG}")

    pergunta = (
        "Liste os 10 clientes da mart_cliente_360 com receita_lifetime_brl > 1000 e dias_desde_ultimo_pedido > 90."
    )
    historico_debug = _gerar_historico_longo(target_tokens=target_tokens)

    print("\n" + "="*70)
    print(f"❓ PERGUNTA: {pergunta}")
    print("="*70)
    _imprimir_historico("Histórico inicial para o pipeline", historico_debug)

    # === DEBUG: AGENTE SELETOR ===
    print("\n🔍 [DEBUG SELETOR]")
    print("-" * 70)
    
    seletor = AgenteSeletor(config=config)
    _instalar_auditoria_injecao(seletor, "AgenteSeletor")
    
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
        message_history=historico_debug,
    )
    
    print(f"✅ Seletor finalizado")
    print(f"📋 Tabelas selecionadas: {resultado_seletor.tabelas_selecionadas}")
    print(f"🪙 Tokens consumidos: {resultado_seletor.tokens_usados}")
    print(f"📏 Esquema filtrado: {len(resultado_seletor.esquema_filtrado)} caracteres")
    print(f"Esquema filtrado completo:\n{resultado_seletor.esquema_filtrado}\n")

    # === DEBUG: HINTS GERADOS DO ESQUEMA ===

    exemplos_gerados = generate_examples_from_schema(
        resultado_seletor.esquema_filtrado,
        db_path=db_path,
    )

    # === DEBUG: FEW-SHOT RETRIEVER ===
    print("\n🔍 [DEBUG FEW-SHOT RETRIEVER]")
    print("-" * 70)
    
    try:
        from app.agent.few_shots.fewshot_retriever import get_cached_fewshot_retriever
        
        retriever = get_cached_fewshot_retriever(path=config.few_shot_path)
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
    _instalar_auditoria_injecao(decompositor, "AgenteDecompositor")
    resultado_decompositor = decompositor.run(
        esquema_filtrado=resultado_seletor.esquema_filtrado,
        pergunta=pergunta,
        db_path=db_path,
        message_history=historico_debug,
    )
    
    print(f"✅ Decompositor finalizado")
    print(f"🪙 Tokens consumidos: {resultado_decompositor.tokens_usados}")
    print(f"💭 Raciocínio:\n{resultado_decompositor.raciocinio}\n")
    print(f"⚙️ SQL gerado:\n{resultado_decompositor.sql}\n")
    if resultado_decompositor.sql_bloqueado:
        print("⛔ SQL bruto bloqueado pelo guardrail:")
        print(resultado_decompositor.sql_bloqueado)
        print()
    _auditar_context_manager(
        "AgenteDecompositor",
        entrada=historico_debug,
        saida=resultado_decompositor.novo_historico,
    )

    if not resultado_decompositor.sql.strip():
        print("Pipeline interrompido: decompositor nao gerou SQL.")
        print("Verifique a chamada ao LLM acima antes de seguir para refinador/execucao.")
        _salvar_auditoria_context_manager()
        return

    # === DEBUG: AGENTE REFINADOR ===
    print("\n🔍 [DEBUG REFINADOR]")
    print("-" * 70)
    
    refinador = AgenteRefinador(config=config)
    _instalar_auditoria_injecao(refinador, "AgenteRefinador")
    resultado_refinador = refinador.run(
        candidate_sql=resultado_decompositor.sql,
        question=pergunta,
        filtered_schema=resultado_seletor.esquema_filtrado,
        db_path=db_path,
        message_history=historico_debug,
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
    _auditar_context_manager(
        "AgenteRefinador",
        entrada=resultado_decompositor.novo_historico or historico_debug,
        saida=resultado_refinador.novo_historico,
        usa_capability=False,
    )

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
    _instalar_auditoria_injecao(interpretador, "AgenteInterpretador")
    resultado_interpretador = interpretador.run(
        pergunta=pergunta,
        sql_final=resultado_refinador.sql,
        colunas=colunas,
        dados=dados,
        erro=None if not resultado_refinador.ultimo_erro else resultado_refinador.ultimo_erro,
        message_history=historico_debug,
    )
    
    print(f"✅ Interpretador finalizado")
    print(f"🪙 Tokens consumidos: {resultado_interpretador.tokens_usados}")
    print(f"🗣️ Resposta natural:\n{resultado_interpretador.resposta}\n")
    _auditar_context_manager(
        "AgenteInterpretador",
        entrada=resultado_refinador.novo_historico
        or resultado_decompositor.novo_historico
        or historico_debug,
        saida=resultado_interpretador.novo_historico,
    )

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
    _salvar_auditoria_context_manager()

if __name__ == "__main__":
    print("MODO DEBUG ATIVADO - todo run_test agora executa com debug detalhado.\n")
    run_com_debug()

