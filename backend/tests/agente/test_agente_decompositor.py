from __future__ import annotations

from app.agent.agentes.agente_decompositor import AgenteDecompositor
from app.agent.config import Config
from app.agent.few_shots.modelos import ExemploFewShot
from app.agent.models.resultado import ResultadoDecompositorLLM


class _DummyUsage:
    total_tokens = 17


class _DummyResult:
    def __init__(self) -> None:
        self.data = ResultadoDecompositorLLM(
            reasoning="Somo a receita líquida do período e ordeno do maior para o menor.",
            sql="```sql\nSELECT 1\n```",
        )

    def usage(self) -> _DummyUsage:
        return _DummyUsage()


class _DummyAgent:
    def run_sync(self, pergunta: str, deps, message_history=None) -> _DummyResult:
        self.pergunta = pergunta
        self.deps = deps
        self.message_history = message_history
        return _DummyResult()


def test_decompositor_normaliza_few_shot_e_lê_saida_pydantic(monkeypatch):
    agente = AgenteDecompositor(config=Config(api_key=""))
    agente._agent = _DummyAgent()

    capturado = {}

    def fake_render(template_name: str, **kwargs):
        capturado["template_name"] = template_name
        capturado["examples"] = kwargs["examples"]
        return "prompt"

    monkeypatch.setattr(agente, "_render", fake_render)
    monkeypatch.setattr(
        agente,
        "_buscar_exemplos_few_shot",
        lambda pergunta: [
            ExemploFewShot(
                question="Qual produto com mais lucro no ultimo mes",
                sql="SELECT nome_produto FROM fat_pedidos",
                reasoning="Agrupa por produto e ordena pelo maior lucro.",
            )
        ],
    )

    resultado = agente.run(
        esquema_filtrado="CREATE TABLE fat_pedidos (id_pedido TEXT);",
        pergunta="Qual produto com mais lucro no ultimo mes",
    )

    assert resultado.sql == "SELECT 1"
    assert resultado.raciocinio == "Somo a receita líquida do período e ordeno do maior para o menor."
    assert resultado.tokens_usados == 17
    assert capturado["template_name"] == "decompositor"
    assert capturado["examples"][0]["question"] == "Qual produto com mais lucro no ultimo mes"
    assert capturado["examples"][0]["sql"] == "SELECT nome_produto FROM fat_pedidos"


def test_decompositor_busca_few_shot_com_parametro_path(monkeypatch):
    agente = AgenteDecompositor(config=Config(api_key=""))

    capturado = {}

    class _FakeRetriever:
        def __init__(self, path):
            capturado["path"] = path

        def retrieve(self, pergunta, k=3):
            capturado["pergunta"] = pergunta
            capturado["k"] = k
            return []

    monkeypatch.setattr(
        "app.agent.agentes.agente_decompositor.FewShotRetriever",
        _FakeRetriever,
    )

    resultado = agente._buscar_exemplos_few_shot("Pergunta teste")

    assert resultado == []
    assert capturado["path"] == agente.config.few_shot_path
    assert capturado["pergunta"] == "Pergunta teste"
    assert capturado["k"] == 3
