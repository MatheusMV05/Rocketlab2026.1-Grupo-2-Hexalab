from __future__ import annotations

import argparse
import json
import sqlite3
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
VENV_PYTHON = ROOT_DIR.parent / ".venv" / "Scripts" / "python.exe"

if VENV_PYTHON.exists() and Path(sys.executable).resolve() != VENV_PYTHON.resolve():
    os.execv(str(VENV_PYTHON), [str(VENV_PYTHON), *sys.argv])

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.agent import AgenteDecompositor, AgenteSeletor, Config
from app.agent.db import ler_esquema
from app.agent.Guardrail.sql_guardrail import validar_input_usuario


def _resolver_caminho_db(caminho_fornecido: str | None) -> Path:
    if caminho_fornecido:
        return Path(caminho_fornecido).expanduser().resolve()

    candidatos = [
        ROOT_DIR / "data" / "banco.db",
        ROOT_DIR / "data" / "vcommerce.db",
    ]
    for candidato in candidatos:
        if candidato.exists():
            return candidato

    return candidatos[0]


def _executar_sql(db_path: Path, sql: str, limite_saida: int) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    with sqlite3.connect(db_path) as conexao:
        conexao.row_factory = sqlite3.Row
        linhas = conexao.execute(sql).fetchall()

    linhas_dict = [dict(linha) for linha in linhas]
    return linhas_dict, linhas_dict[:limite_saida]


def executar_pipeline(db_path: Path, pergunta: str, limite_saida: int) -> dict[str, object]:
    pergunta_valida, motivo = validar_input_usuario(pergunta)
    if not pergunta_valida:
        return {
            "db_path": str(db_path),
            "pergunta": pergunta,
            "status": "fora_do_escopo",
            "motivo": motivo,
            "tabelas_selecionadas": [],
            "tokens_seletor": 0,
            "sql": "",
            "raciocinio": "",
            "tokens_decompositor": 0,
            "linhas": [],
            "total_linhas": 0,
        }

    if not db_path.exists():
        raise FileNotFoundError(f"Banco SQLite não encontrado: {db_path}")

    configuracao = Config()
    if not configuracao.api_key:
        raise RuntimeError(
            "Defina MISTRAL_API_KEY para executar o pipeline com os agentes reais."
        )

    esquema_completo = ler_esquema(db_path)
    agente_seletor = AgenteSeletor(config=configuracao)
    resultado_seletor = agente_seletor.run(
        esquema_completo=esquema_completo,
        pergunta=pergunta,
    )

    agente_decompositor = AgenteDecompositor(config=configuracao)
    resultado_decompositor = agente_decompositor.run(
        esquema_filtrado=resultado_seletor.esquema_filtrado,
        pergunta=pergunta,
    )

    if not resultado_decompositor.sql:
        raise RuntimeError("O AgenteDecompositor não retornou SQL executável.")

    linhas_totais, linhas_preview = _executar_sql(db_path, resultado_decompositor.sql, limite_saida)

    return {
        "db_path": str(db_path),
        "pergunta": pergunta,
        "tabelas_selecionadas": resultado_seletor.tabelas_selecionadas,
        "tokens_seletor": resultado_seletor.tokens_usados,
        "sql": resultado_decompositor.sql,
        "raciocinio": resultado_decompositor.raciocinio,
        "tokens_decompositor": resultado_decompositor.tokens_usados,
        "linhas": linhas_preview,
        "total_linhas": len(linhas_totais),
    }


def _formatar_resumo_saida(resultado: dict[str, object]) -> str:
    tabelas = resultado.get("tabelas_selecionadas", [])
    if isinstance(tabelas, list):
        tabelas_texto = ", ".join(str(item) for item in tabelas) if tabelas else "nenhuma"
    else:
        tabelas_texto = str(tabelas)

    return (
        f"Status: {resultado.get('status', 'ok')} | "
        f"Pergunta: {resultado.get('pergunta', '')} | "
        f"Tabelas: {tabelas_texto} | "
        f"Linhas: {resultado.get('total_linhas', 0)} | "
        f"Tokens: seletor={resultado.get('tokens_seletor', 0)}, "
        f"decompositor={resultado.get('tokens_decompositor', 0)}"
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Executa localmente a pipeline de agentes sobre um banco SQLite real."
    )
    parser.add_argument(
        "--db",
        dest="db_path",
        default=None,
        help="Caminho para o banco SQLite. Se omitido, tenta backend/data/banco.db.",
    )
    parser.add_argument(
        "--question",
        required=True,
        nargs="+",
        help="Pergunta em linguagem natural que será convertida em SQL.",
    )
    parser.add_argument(
        "--max-rows",
        type=int,
        default=20,
        help="Número máximo de linhas exibidas na saída JSON.",
    )
    args = parser.parse_args()

    db_path = _resolver_caminho_db(args.db_path)
    pergunta = " ".join(args.question).strip()
    resultado = executar_pipeline(db_path=db_path, pergunta=pergunta, limite_saida=args.max_rows)
    print(_formatar_resumo_saida(resultado))
    print(json.dumps(resultado, ensure_ascii=False, indent=2, default=str))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())