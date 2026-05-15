from __future__ import annotations
 
import asyncio
import json
import logging
import os
import sys
import time
from collections.abc import Sequence
from jinja2 import Environment, FileSystemLoader, StrictUndefined
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any
import httpx
from pydantic_ai import Agent, RunContext
from pydantic_ai import messages as pai_messages
from pydantic_ai.models.mistral import MistralModel
from pydantic_ai.providers.mistral import MistralProvider
from pydantic_ai_summarization import ContextManagerCapability

from app.agent.config import Config
from app.agent.contexto import ContextoAgente

logger = logging.getLogger(__name__)

def _configurar_event_loop_windows() -> None:
    """Evita cancelamentos ruidosos do ProactorEventLoop no Windows.

    O cliente HTTP usado pelo PydanticAI pode deixar leituras pendentes durante
    o encerramento do loop. Em Windows, o loop Proactor emite erros como
    "Cancelling an overlapped future failed" ao cancelar essas leituras. O loop
    Selector não usa overlapped I/O e é suficiente para este backend.

    Em Python 3.14+, as APIs globais de policy do asyncio estão depreciadas; a
    função vira no-op nessas versões para não poluir a suíte de testes com
    warnings de depreciação.
    """
    if os.name != "nt":
        return
    if sys.version_info >= (3, 14):
        return

    policy_cls = getattr(asyncio, "WindowsSelectorEventLoopPolicy", None)
    if policy_cls is None:
        return

    current_policy = asyncio.get_event_loop_policy()
    if not isinstance(current_policy, policy_cls):
        asyncio.set_event_loop_policy(policy_cls())


_configurar_event_loop_windows()



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
        """Cria o modelo Mistral usado pelos agentes.

        Injeta a chave no ambiente para compatibilidade com o provider do
        PydanticAI e configura um `httpx.AsyncClient` com timeout explícito.
        Esse timeout evita que chamadas longas ao Mistral fiquem presas sem uma
        janela operacional clara.
        """
        os.environ["MISTRAL_API_KEY"] = self.config.api_key
        timeout = httpx.Timeout(self.config.mistral_timeout_seconds)
        http_client = httpx.AsyncClient(timeout=timeout)
        try:
            return MistralModel(
                self.config.model,
                provider=MistralProvider(
                    api_key=self.config.api_key,
                    http_client=http_client,
                ),
            )
        except TypeError:
            return MistralModel(self.config.model, api_key=self.config.api_key)

    def _criar_capabilities_memoria(self) -> list[Any]:
        """Cria a capability obrigatória de sumarização de memória.

        A pipeline sempre usa `ContextManagerCapability`. A sumarização roda
        com `config.context_summarizer_model`, por padrão
        `mistral:ministral-8b-latest`, e dispara quando o histórico estimado
        passa de `compress_threshold * max_tokens`.

        O corte preventivo em `_limitar_message_history` continua existindo:
        ele limita o que vai para o provider, enquanto esta capability compacta
        o histórico processado pelo PydanticAI quando a janela configurada é
        atingida.
        """
        keep_messages = int(os.getenv("AGENT_CONTEXT_KEEP_MESSAGES", "20"))
        max_tokens = int(
            os.getenv(
                "AGENT_CONTEXT_MAX_TOKENS",
                str(max(1, self.config.input_history_max_tokens)),
            )
        )
        compress_threshold = float(os.getenv("AGENT_CONTEXT_COMPRESS_THRESHOLD", "0.8"))
        logger.info(
            "Context capability obrigatoria: summarize model=%s max_tokens=%s "
            "threshold=%s keep=%s",
            self.config.context_summarizer_model,
            max_tokens,
            compress_threshold,
            keep_messages,
        )
        return [
            ContextManagerCapability(
                max_tokens=max_tokens,
                compress_threshold=compress_threshold,
                keep=("messages", keep_messages),
                summarization_model=self.config.context_summarizer_model,
            )
        ]

    @staticmethod
    def _garantir_event_loop() -> None:
        """Compatibilidade para chamadas antigas que esperavam preparar o loop."""
        _configurar_event_loop_windows()
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return
 
    def _call_llm(
        self, 
        sistema: str, 
        usuario: str,
        message_history: list[Any] | None = None
    ) -> tuple[str, int, list[Any]]:
        """Executa uma chamada ao LLM e captura resposta, tokens e memória.
 
        Antes da chamada, o histórico recebido é reduzido por
        `_limitar_message_history` e convertido para mensagens do PydanticAI por
        `_normalizar_message_history`. O prompt de sistema não é duplicado no
        histórico: ele é enviado via `deps.sistema` e resolvido pelo
        `@system_prompt`.
 
        Se o agente não estiver disponível (sem chave de API ou sem
        `pydantic-ai`), retorna ``("", 0)`` sem lançar exceção.

        Em caso de erro da chamada, registra tipo e duração do erro e retorna
        resposta vazia. Esse comportamento mantém compatibilidade com os agentes
        atuais, que tratam saída vazia como falha/fallback.
 
        Args:
            sistema: Conteúdo do prompt do sistema, geralmente renderizado
                por `_render`.
            usuario: Mensagem do usuário - normalmente a pergunta ou a
                instrução de saída para o agente.
 
        Returns:
            Tupla ``(texto_resposta, tokens_usados, novo_historico)``.
            - ``texto_resposta``: string gerada pelo modelo, ou ``""`` se
              a resposta vier vazia ou o cliente for ``None``.
            - ``tokens_usados``: total de tokens (entrada + saída)
              reportado pela API, ou ``0`` se não disponível.
            - ``novo_historico``: histórico retornado pelo PydanticAI depois
              das capabilities de memória.
        """
        if self._agent is None:
            return "", 0, []
 
        deps = ContextoAgente(config=self.config, sistema=sistema)
        inicio = time.perf_counter()
        try:
            historico_limitado = self._limitar_message_history(message_history)
            historico_pydantic = self._normalizar_message_history(historico_limitado, sistema=sistema)
            logger.info(
                "_call_llm: iniciando chamada model=%s historico_original=%s "
                "historico_enviado=%s tokens_hist_enviado~=%s chars_sistema=%s",
                self.config.model,
                len(message_history or []),
                len(historico_limitado or []),
                self._estimar_tokens_history(historico_limitado),
                len(sistema or ""),
            )
            resultado = self._agent.run_sync(
                usuario,
                deps=deps,
                message_history=historico_pydantic,
            )
            
            output = self._extrair_output(resultado)
            texto = self._serializar_output(output)
            tokens_usados = self._extrair_tokens(resultado)
            logger.info(
                "_call_llm: chamada concluida em %.2fs tokens_usados=%s",
                time.perf_counter() - inicio,
                tokens_usados,
            )
            
            # Captura o histórico real do PydanticAI, já processado por capabilities.
            novo_historico = self._extrair_historico_resultado(
                resultado,
                message_history=historico_limitado,
                usuario=usuario,
                resposta=texto,
            )
        except Exception as e:
            elapsed = time.perf_counter() - inicio
            if os.getenv("AGENT_DEBUG_TRACEBACK") == "1":
                logger.exception("Erro em _call_llm após %.2fs", elapsed)
                import traceback
                traceback.print_exc()
            else:
                logger.warning(
                    "Erro em _call_llm após %.2fs: %s: %s",
                    elapsed,
                    type(e).__name__,
                    e,
                )
            print(f"Erro em _call_llm: {e}")
            texto = ""
            tokens_usados = 0
            novo_historico = []

        return texto, tokens_usados, novo_historico

    @staticmethod
    def _extrair_content_message_history(item: Any) -> tuple[str, str]:
        """Normaliza um item de histórico para par `(role, content)`.

        Aceita dicionários `{"role": ..., "content": ...}`, strings puras e
        objetos com atributos `role`/`content`. É usado por contagem de tokens,
        truncamento e conversão para mensagens PydanticAI.
        """
        if isinstance(item, dict):
            role = str(item.get("role") or item.get("from") or "user")
            content = str(item.get("content") or "")
        elif isinstance(item, str):
            role = "user"
            content = item
        else:
            role = str(getattr(item, "role", "user"))
            content = str(getattr(item, "content", item))
        return role, content

    @staticmethod
    def _estimar_tokens_texto(texto: str) -> int:
        """Estima tokens por heurística simples de 4 caracteres por token."""
        return max(1, round(len(texto or "") / 4))

    @classmethod
    def _estimar_tokens_history(cls, message_history: list[Any] | None) -> int:
        """Soma a estimativa de tokens do conteúdo textual do histórico."""
        total = 0
        for item in message_history or []:
            _, content = cls._extrair_content_message_history(item)
            total += cls._estimar_tokens_texto(content)
        return total

    def _limitar_message_history(
        self,
        message_history: list[Any] | None,
    ) -> list[Any] | None:
        """Limita o histórico antes da chamada ao provider.

        Mantém as mensagens mais recentes até `config.input_history_max_tokens`
        tokens aproximados. Quando mensagens antigas são omitidas, insere uma
        mensagem `system` curta avisando que houve truncamento. Isso reduz
        timeout/custo sem depender exclusivamente da sumarização automática.
        """
        if not message_history:
            return None

        max_tokens = int(getattr(self.config, "input_history_max_tokens", 0) or 0)
        if max_tokens <= 0:
            return message_history

        selecionadas_reverso: list[Any] = []
        tokens_usados = 0
        mensagens_omitidas = 0

        for item in reversed(message_history):
            _, content = self._extrair_content_message_history(item)
            tokens_item = self._estimar_tokens_texto(content)
            if selecionadas_reverso and tokens_usados + tokens_item > max_tokens:
                mensagens_omitidas += 1
                continue
            selecionadas_reverso.append(item)
            tokens_usados += tokens_item

        historico_limitado = list(reversed(selecionadas_reverso))
        if mensagens_omitidas:
            historico_limitado.insert(
                0,
                {
                    "role": "system",
                    "content": (
                        f"{mensagens_omitidas} mensagens antigas foram omitidas "
                        "automaticamente para manter o contexto dentro do limite "
                        "operacional. Preserve a intenção das mensagens recentes."
                    ),
                },
            )
            logger.info(
                "Histórico limitado antes da chamada LLM: %s mensagens omitidas, "
                "%s mensagens enviadas, limite aproximado=%s tokens",
                mensagens_omitidas,
                len(historico_limitado),
                max_tokens,
            )

        return historico_limitado

    @staticmethod
    def _normalizar_message_history(
        message_history: list[Any] | None,
        sistema: str | None = None,
    ) -> list[Any] | None:
        """Converte histórico simples para `ModelMessage` do PydanticAI.

        Mensagens de usuário/sistema viram `ModelRequest`; mensagens de
        assistente/modelo viram `ModelResponse`. O parâmetro `sistema` é mantido
        por compatibilidade, mas não é inserido aqui para evitar duplicar o
        prompt de sistema, que já é fornecido via `deps.sistema`.
        """
        if not message_history:
            return None

        mensagens: list[Any] = []
        for item in message_history:
            if hasattr(item, "parts"):
                mensagens.append(item)
                continue

            role, content = AgenteBase._extrair_content_message_history(item)
            role = role.lower()

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
            role, content = AgenteBase._extrair_content_message_history(item)

            if content.strip():
                historico.append({"role": role, "content": content})

        if usuario.strip():
            historico.append({"role": "user", "content": usuario})
        if resposta.strip():
            historico.append({"role": "assistant", "content": resposta})

        return historico

    @classmethod
    def _extrair_historico_resultado(
        cls,
        resultado: Any,
        message_history: list[Any] | None,
        usuario: str,
        resposta: str,
    ) -> list[Any]:
        all_messages = getattr(resultado, "all_messages", None)
        if callable(all_messages):
            try:
                historico = all_messages()
                if isinstance(historico, Sequence) and not isinstance(historico, (str, bytes)):
                    return list(historico)
            except Exception:
                logger.exception("Erro ao extrair all_messages() do resultado PydanticAI")

        return cls._historico_serializavel(message_history, usuario, resposta)

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
