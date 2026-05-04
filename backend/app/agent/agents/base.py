from __future__ import annotations
 
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any
 
from jinja2 import Environment, FileSystemLoader, StrictUndefined
 
from app.agent.config import Config
 
try:
    from mistralai import Mistral
except ImportError:  # pragma: no cover
    Mistral = None  # type: ignore[assignment]
 
 
class BaseAgent(ABC):
    """Classe base abstrata para todos os agentes da pipeline MAC-SQL.
 
    Centraliza três responsabilidades compartilhadas por todos os agentes:
 
    1. Inicialização do cliente LLM — instancia o cliente Mistral uma
       única vez, reutilizando a conexão entre chamadas.
    2. Chamada ao LLM — método `_call_llm` que encapsula a API do
       Mistral e retorna a resposta junto com o número de tokens consumidos.
    3. Renderização de prompts — método `_render` que carrega templates
       Jinja2 do diretório `prompts/` e injeta variáveis.
 
    Todos os agentes concretos (SelectorAgent, DecomposerAgent, RefinerAgent)
    herdam desta classe e implementam apenas o método `run`.
 
    Attributes:
        config: Configurações da pipeline (modelo, tokens, chave de API etc.).
 
    Example:
        Não instancie diretamente — use um agente concreto::
 
            agent = SelectorAgent(config=Config())
            result = agent.run(full_schema=ddl, question="...")
    """
 
    def __init__(self, config: Config | None = None) -> None:
        """Inicializa o agente com configurações e cliente LLM.
 
        Resolve o diretório de prompts como `<pacote>/prompts/` relativo
        ao arquivo `base.py`, garantindo que o caminho funcione
        independentemente do diretório de trabalho atual.
 
        O cliente Mistral só é instanciado se:
        - O pacote `mistralai` estiver instalado.
        - `config.api_key` for uma string não vazia.
 
        Em ambiente de testes, basta passar uma `Config` sem `api_key`
        para que `self._client` seja `None` e os agentes possam ser
        mockados sem chamar a API real.
 
        Args:
            config: Configurações da pipeline. Se `None`, usa `Config()`
                com os valores padrão lidos das variáveis de ambiente.
        """
        global Mistral
        self.config = config or Config()
 
        prompts_dir = Path(__file__).resolve().parents[1] / "prompts"
        self._jinja = Environment(
            loader=FileSystemLoader(str(prompts_dir)),
            autoescape=False,         # prompts não são HTML — XSS irrelevante
            undefined=StrictUndefined,  # falha explicitamente se variável não existir
            trim_blocks=True,         # remove newline após bloco Jinja2
            lstrip_blocks=True,       # remove espaços antes de bloco Jinja2
        )
 
        self._client: Any | None = None

        # Resolve the Mistral client class, trying a late import if the
        # top-level import failed (common when running without the
        # project's venv activated). We keep this local to avoid
        # mutating module-level state.
        _mistral_cls = Mistral
        if _mistral_cls is None:
            try:
                from mistralai import Mistral as _ImportedMistral

                _mistral_cls = _ImportedMistral
            except Exception:
                _mistral_cls = None

        if _mistral_cls is not None and self.config.api_key:
            self._client = _mistral_cls(api_key=self.config.api_key)
        elif self.config.api_key and self._client is None:
            # If an API key is configured but we couldn't instantiate the
            # client, raise an explicit error to surface the problem to
            # the caller instead of silently returning empty responses.
            raise RuntimeError(
                "LLM client could not be initialized. Ensure `mistralai` is installed "
                "and the virtualenv with the package is activated."
            )
 
    def _call_llm(self, system: str, user: str) -> tuple[str, int]:
        """Envia uma mensagem ao LLM e retorna a resposta com o consumo de tokens.
 
        Monta a conversa no formato ``[system, user]`` e chama
        ``client.chat.complete`` com temperatura 0 implícita (controlada
        pela `Config`). Usa `getattr` com fallback para não quebrar caso
        a estrutura do objeto de resposta mude entre versões do SDK.
 
        Se o cliente não estiver disponível (sem API key ou `mistralai`
        não instalado), retorna ``("", 0)`` sem lançar exceção
 
        Args:
            system: Conteúdo do system prompt (geralmente renderizado por
                `_render`).
            user: Mensagem do usuário — normalmente a pergunta ou instrução
                de saída para o agente.
 
        Returns:
            Tupla ``(texto_resposta, tokens_usados)``.
            - ``texto_resposta``: string gerada pelo modelo, ou ``""`` se
              a resposta vier vazia ou o cliente for `None`.
            - ``tokens_usados``: total de tokens (input + output) reportado
              pela API, ou ``0`` se não disponível.
        """
        if self._client is None:
            return "", 0
 
        response = self._client.chat.complete(
            model=self.config.model,
            max_tokens=self.config.max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
 
        text = ""
        if getattr(response, "choices", None):
            text = response.choices[0].message.content or ""
 
        usage = getattr(response, "usage", None)
        tokens_used = int(getattr(usage, "total_tokens", 0) or 0)
        return text, tokens_used
 
    def _render(self, template_name: str, **kwargs: object) -> str:
        """Renderiza um template Jinja2 do diretório ``prompts/``.
 
        O template é carregado pelo nome sem extensão; a extensão ``.j2``
        é adicionada automaticamente. Usa `StrictUndefined`, portanto
        qualquer variável referenciada no template mas não passada em
        ``kwargs`` levanta ``UndefinedError`` imediatamente — falha rápida
        em vez de prompt silenciosamente incompleto.
 
        Args:
            template_name: Nome do arquivo de template sem extensão
                (ex.: ``"selector"`` carrega ``prompts/selector.j2``).
            **kwargs: Variáveis injetadas no contexto do template.
 
        Returns:
            String do prompt renderizado, pronto para ser passado ao LLM.
 
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
        satisfazer o ABC — os agentes concretos tipam seus parâmetros
        explicitamente.
 
        Raises:
            NotImplementedError: Se chamado diretamente na classe base.
        """
        raise NotImplementedError