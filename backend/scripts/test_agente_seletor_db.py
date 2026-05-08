from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Carrega variáveis de ambiente do arquivo .env
env_file = ROOT / ".env"
if env_file.exists():
    with open(env_file, "r", encoding="utf-8") as f:
        for linha in f:
            linha = linha.strip()
            if linha and not linha.startswith("#") and "=" in linha:
                chave, valor = linha.split("=", 1)
                os.environ[chave.strip()] = valor.strip()
                print(f"✓ Carregou: {chave.strip()}")

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

from app.agent.agentes.agente_seletor import AgenteSeletor
from app.agent.config import Config
from app.agent.db.leitor_esquema import ler_esquema


DB_PATH = ROOT / "data" / "database.db"
DEFAULT_QUESTION = "Quais produtos mais vendidos no último mês?"


def main() -> int:
    if not DB_PATH.exists():
        print(f"Banco não encontrado: {DB_PATH}")
        return 1

    # Valida e configura a chave de API
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        print("⚠️  MISTRAL_API_KEY não definida. O agente usará fallback (schema completo).")
    else:
        print(f"✓ MISTRAL_API_KEY carregada: {api_key[:10]}...")

    esquema_completo = ler_esquema(DB_PATH)
    if not esquema_completo.strip():
        print("O schema lido do banco está vazio.")
        return 1

    config = Config()
    print(f"Config.api_key definida: {bool(config.api_key)}")
    print(f"Config.model: {config.model}")

    agente = AgenteSeletor(config=config)
    print(f"Agente._agent inicializado: {agente._agent is not None}")

    resultado = agente.run(
        esquema_completo=esquema_completo,
        pergunta=DEFAULT_QUESTION,
    )

    print("\n=== Resultado do AgenteSeletor ===")
    print(f"Tabelas selecionadas: {resultado.tabelas_selecionadas}")
    print(f"Tokens usados: {resultado.tokens_usados}")
    print(f"Usou LLM: {resultado.tokens_usados > 0}")
    print("\n--- DDL filtrado (primeiros 1500 chars) ---")
    print(resultado.esquema_filtrado[:1500])
    if len(resultado.esquema_filtrado) > 1500:
        print(f"... ({len(resultado.esquema_filtrado) - 1500} chars omitidos)")

    assert resultado.esquema_filtrado.strip(), "O agente não retornou schema filtrado."
    assert isinstance(resultado.tabelas_selecionadas, list), "tabelas_selecionadas deve ser uma lista."
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
