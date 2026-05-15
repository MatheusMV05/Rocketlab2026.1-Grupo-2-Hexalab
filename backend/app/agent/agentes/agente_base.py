from __future__ import annotations
 
import asyncio
import json
import os
from jinja2 import Environment, FileSystemLoader, StrictUndefined
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any
 
from app.agent.config import Config
 
from pydantic_ai import Agent, RunContext
from pydantic_ai import messages as pai_messages
from pydantic_ai.models.mistral import MistralModel
from pydantic_ai.providers.mistral import MistralProvider

from app.agent.config import Config
from app.agent.contexto import ContextoAgente


class AgenteBase(ABC):
    """Classe base abstrata para todos os agentes da pipeline MAC-SQL.
 
    Centraliza três responsabilidades compartilhadas por todos os agentes:
 
     1. Inicialização do cliente LLM - instancia o agente do PydanticAI uma
         única vez, reutilizando a conexão entre chamadas.
     2. Chamada ao LLM - método `_call_llm` que encapsula o agente e retorna
         a resposta junto com o número de tokens consumidos.
    3. Renderização de prompts — método `_render` que carrega templates
         Jinja2 do diretório `prompts/` e injeta variáveis.
 
     Todos os agentes concretos (AgenteSeletor, DecomposerAgent, RefinerAgent)
    herdam desta classe e implementam apenas o método `run`.
 
    Attributes:
        config: Configurações da pipeline (modelo, tokens, chave de API etc.).
 
    Example:
        Não instancie diretamente — use um agente concreto::
 
                agente = AgenteSeletor(config=Config())
                resultado = agente.run(esquema_completo=ddl, pergunta="...")
    """
 
    def __init__(self, config: Config | None = None) -> None:
        """Inicializa o agente com configurações e cliente LLM PydanticAI.
 
        Resolve o diretório de prompts como `<pacote>/prompts/` relativo
        ao arquivo `base.py`, garantindo que o caminho funcione
        independentemente do diretório de trabalho atual.
 
        O agente PydanticAI só é instanciado se:
        - O pacote `pydantic-ai` estiver instalado.
        - `config.api_key` for uma string não vazia.
 
        Args:
            config: Configurações da pipeline. Se `None`, usa `Config()`
                com os valores padrão lidos das variáveis de ambiente.
        """
        self.config = config or Config()

        self._garantir_event_loop()

        diretorio_prompts = Path(__file__).resolve().parents[1] / "prompts"
        self._jinja = Environment(
            loader=FileSystemLoader(str(diretorio_prompts)),
            autoescape=False,  # prompts não são HTML - XSS irrelevante
            undefined=StrictUndefined,  # falha explicitamente se variável não existir
            trim_blocks=True,  # remove nova linha após bloco Jinja2
            lstrip_blocks=True,  # remove espaços antes do bloco Jinja2
        )
 
        self._agent: Any | None = None

        if self.config.api_key:
            model = self._criar_modelo_mistral()
            self._agent = Agent(
                model,
                deps_type=ContextoAgente,
            )

            @self._agent.system_prompt
            def get_system_prompt(ctx: RunContext[ContextoAgente]) -> str:
                return ctx.deps.sistema

    def _criar_modelo_mistral(self) -> MistralModel:
        """Cria o modelo Mistral de forma compatível com versões do PydanticAI."""
        os.environ["MISTRAL_API_KEY"] = self.config.api_key
        try:
            return MistralModel(
                self.config.model,
                provider=MistralProvider(api_key=self.config.api_key),
            )
        except TypeError:
            return MistralModel(self.config.model, api_key=self.config.api_key)

    @staticmethod
    def _garantir_event_loop() -> None:
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            asyncio.set_event_loop(asyncio.new_event_loop())
 
    def _call_llm(
        self, 
        sistema: str, 
        usuario: str,
        message_history: list[Any] | None = None
    ) -> tuple[str, int, list[Any]]:
        """Envia uma mensagem ao LLM e retorna a resposta com o consumo de tokens.
 
        Usa o PydanticAI via `run_sync` injetando o contexto renderizado.
 
        Se o agente não estiver disponível (sem chave de API ou sem
        `pydantic-ai`), retorna ``("", 0)`` sem lançar exceção.
 
        Args:
            sistema: Conteúdo do prompt do sistema, geralmente renderizado
                por `_render`.
            usuario: Mensagem do usuário - normalmente a pergunta ou a
                instrução de saída para o agente.
 
        Returns:
            Tupla ``(texto_resposta, tokens_usados)``.
            - ``texto_resposta``: string gerada pelo modelo, ou ``""`` se
              a resposta vier vazia ou o cliente for ``None``.
            - ``tokens_usados``: total de tokens (entrada + saída)
              reportado pela API, ou ``0`` se não disponível.
        """
        if self._agent is None:
            return "", 0, []
 
        deps = ContextoAgente(config=self.config, sistema=sistema)
        try:
            historico_pydantic = self._normalizar_message_history(message_history)
            if hasattr(self._agent, "run_sync"):
                # Injeta message_history nativamente
                try:
                    resultado = self._agent.run_sync(usuario, deps=deps, message_history=historico_pydantic)
                except TypeError as erro:
                    if "message_history" not in str(erro):
                        raise
                    resultado = self._agent.run_sync(usuario, deps=deps)
            else:
                try:
                    resultado = asyncio.run(self._agent.run(usuario, deps=deps, message_history=historico_pydantic))
                except TypeError as erro:
                    if "message_history" not in str(erro):
                        raise
                    resultado = asyncio.run(self._agent.run(usuario, deps=deps))
            
            output = self._extrair_output(resultado)
            texto = self._serializar_output(output)
            tokens_usados = self._extrair_tokens(resultado)
            
            # 3. Captura o histórico de mensagens resultante (já com compressão automática se ativada)
            novo_historico = self._historico_serializavel(message_history, usuario, texto)
        except Exception as e:
            if os.getenv("AGENT_DEBUG_TRACEBACK") == "1":
                import traceback
                traceback.print_exc()
            print(f"Erro em _call_llm: {e}")
            texto = ""
            tokens_usados = 0
            novo_historico = []

        return texto, tokens_usados, novo_historico

    @staticmethod
    def _normalizar_message_history(message_history: list[Any] | None) -> list[Any] | None:
        """Converte historico simples role/content para ModelMessage do PydanticAI."""
        if not message_history:
            return None

        mensagens: list[Any] = []
        for item in message_history:
            if hasattr(item, "conversation_id") and hasattr(item, "parts"):
                mensagens.append(item)
                continue

            if isinstance(item, dict):
                role = str(item.get("role") or item.get("from") or "user").lower()
                content = str(item.get("content") or "")
            elif isinstance(item, str):
                role = "user"
                content = item
            else:
                role = str(getattr(item, "role", "user")).lower()
                content = str(getattr(item, "content", item))

            if not content.strip():
                continue

            if role in {"assistant", "model"}:
                mensagens.append(
                    pai_messages.ModelResponse(
                        parts=[pai_messages.TextPart(content=content)]
                    )
                )
            else:
                if role == "system":
                    content = f"Resumo de contexto anterior: {content}"
                mensagens.append(
                    pai_messages.ModelRequest(
                        parts=[pai_messages.UserPromptPart(content=content)]
                    )
                )

        return mensagens or None

    @staticmethod
    def _extrair_output(resultado: Any) -> Any:
        if hasattr(resultado, "output"):
            return resultado.output
        return getattr(resultado, "data", "")

    @staticmethod
    def _serializar_output(output: Any) -> str:
        if hasattr(output, "model_dump"):
            return json.dumps(output.model_dump(), ensure_ascii=False)
        return str(output or "")

    @staticmethod
    def _extrair_tokens(resultado: Any) -> int:
        uso = getattr(resultado, "usage", None)
        if uso is not None and hasattr(uso, "total_tokens"):
            return int(getattr(uso, "total_tokens", 0) or 0)
        if callable(uso):
            uso = uso()
        return int(getattr(uso, "total_tokens", 0) or 0)

    @staticmethod
    def _historico_serializavel(
        message_history: list[Any] | None,
        usuario: str,
        resposta: str,
    ) -> list[dict[str, str]]:
        historico: list[dict[str, str]] = []

        for item in message_history or []:
            if isinstance(item, dict):
                role = str(item.get("role") or item.get("from") or "user")
                content = str(item.get("content") or "")
            elif isinstance(item, str):
                role = "user"
                content = item
            else:
                role = str(getattr(item, "role", "user"))
                content = str(getattr(item, "content", item))

            if content.strip():
                historico.append({"role": role, "content": content})

        if usuario.strip():
            historico.append({"role": "user", "content": usuario})
        if resposta.strip():
            historico.append({"role": "assistant", "content": resposta})

        return historico

    @staticmethod
    def _desempacotar_call_llm(resultado: Any) -> tuple[str, int, list[Any]]:
        if isinstance(resultado, tuple):
            if len(resultado) >= 3:
                return str(resultado[0] or ""), int(resultado[1] or 0), list(resultado[2] or [])
            if len(resultado) == 2:
                return str(resultado[0] or ""), int(resultado[1] or 0), []
            if len(resultado) == 1:
                return str(resultado[0] or ""), 0, []
        return str(resultado or ""), 0, []
 
    def _render(self, template_name: str, **kwargs: object) -> str:
        """Renderiza um template Jinja2 do diretório ``prompts/``.
 
        O template é carregado pelo nome sem extensão; a extensão ``.j2``
        é adicionada automaticamente. Usa ``StrictUndefined``, portanto
        qualquer variável referenciada no template mas não passada em
        ``kwargs`` levanta ``UndefinedError`` imediatamente - falha rápida
        em vez de um prompt silenciosamente incompleto.
 
        Args:
            template_name: Nome do arquivo de template sem extensão
                (ex.: ``"seletor"`` carrega ``prompts/seletor.j2``).
            **kwargs: Variáveis injetadas no contexto do template.
 
        Returns:
            String do prompt renderizado, pronta para ser passada ao LLM.
 
        Raises:
            jinja2.TemplateNotFound: Se o arquivo ``.j2`` não existir.
            jinja2.UndefinedError: Se uma variável usada no template não
                for fornecida em ``kwargs``.
        """
        template = self._jinja.get_template(f"{template_name}.j2")
        return template.render(**kwargs)
 
    @abstractmethod
    def run(self, **kwargs: object):
        """Executa a lógica principal do agente.
 
        Cada subclasse define seus próprios parâmetros nomeados e tipo
        de retorno. A assinatura genérica ``**kwargs`` existe apenas para
        satisfazer o ABC - os agentes concretos tipam seus parâmetros
        explicitamente.
 
        Raises:
            NotImplementedError: Se chamado diretamente na classe base.
        """
        raise NotImplementedError
