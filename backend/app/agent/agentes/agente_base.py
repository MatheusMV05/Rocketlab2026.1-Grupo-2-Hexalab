from __future__ import annotations
 
import asyncio
import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any
 
from jinja2 import Environment, FileSystemLoader, StrictUndefined
 
from app.agent.config import Config
 
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.mistral import MistralModel

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

        import asyncio
        try:
            asyncio.get_event_loop()
        except RuntimeError:
            asyncio.set_event_loop(asyncio.new_event_loop())

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
            model = MistralModel(self.config.model, api_key=self.config.api_key)
            self._agent = Agent(
                model,
                deps_type=ContextoAgente,
            )

            @self._agent.system_prompt
            def get_system_prompt(ctx: RunContext[ContextoAgente]) -> str:
                return ctx.deps.sistema
 
    def _call_llm(self, sistema: str, usuario: str) -> tuple[str, int]:
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
            return "", 0
 
        deps = ContextoAgente(config=self.config, sistema=sistema)
        try:
            if hasattr(self._agent, "run_sync"):
                resultado = self._agent.run_sync(usuario, deps=deps)
            else:
                resultado = asyncio.run(self._agent.run(usuario, deps=deps))
            texto = str(resultado.data)
            uso = resultado.usage()
            tokens_usados = uso.total_tokens if uso else 0
            if hasattr(resultado.data, "model_dump"):
                texto = json.dumps(resultado.data.model_dump(), ensure_ascii=False)
        except Exception:
            # Fallback seguro caso ocorra falha de conexão / parser no PydanticAI
            texto = ""
            tokens_usados = 0

        return texto, tokens_usados
 
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