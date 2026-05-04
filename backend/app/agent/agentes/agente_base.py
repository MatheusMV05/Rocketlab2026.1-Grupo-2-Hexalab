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
 
 
class AgenteBase(ABC):
    """Classe base abstrata para todos os agentes da pipeline MAC-SQL.
 
    Centraliza três responsabilidades compartilhadas por todos os agentes:
 
     1. Inicialização do cliente LLM - instancia o cliente Mistral uma
         única vez, reutilizando a conexão entre chamadas.
     2. Chamada ao LLM - método `_call_llm` que encapsula a API do
         Mistral e retorna a resposta junto com o número de tokens consumidos.
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
 
        diretorio_prompts = Path(__file__).resolve().parents[1] / "prompts"
        self._jinja = Environment(
            loader=FileSystemLoader(str(diretorio_prompts)),
            autoescape=False,  # prompts não são HTML - XSS irrelevante
            undefined=StrictUndefined,  # falha explicitamente se variável não existir
            trim_blocks=True,  # remove nova linha após bloco Jinja2
            lstrip_blocks=True,  # remove espaços antes do bloco Jinja2
        )
 
        self._client: Any | None = None

        # Resolve a classe do cliente Mistral, tentando um import tardio
        # quando o import de topo falhar.
        classe_mistral = Mistral
        if classe_mistral is None:
            try:
                from mistralai import Mistral as MistralImportado

                classe_mistral = MistralImportado
            except Exception:
                classe_mistral = None

        if classe_mistral is not None and self.config.api_key:
            self._client = classe_mistral(api_key=self.config.api_key)
        elif self.config.api_key and self._client is None:
            # Se a chave da API estiver configurada, mas o cliente não
            # puder ser instanciado, expomos o erro explicitamente.
            raise RuntimeError(
                "O cliente LLM não pôde ser inicializado. Verifique se `mistralai` "
                "está instalado e se o ambiente virtual correto está ativado."
            )
 
    def _call_llm(self, sistema: str, usuario: str) -> tuple[str, int]:
        """Envia uma mensagem ao LLM e retorna a resposta com o consumo de tokens.
 
        Monta a conversa no formato ``[system, user]`` e chama
        ``client.chat.complete`` com temperatura 0 implícita (controlada
        pela `Config`). Usa `getattr` com fallback para não quebrar caso
        a estrutura do objeto de resposta mude entre versões do SDK.
 
        Se o cliente não estiver disponível (sem chave de API ou sem
        `mistralai`), retorna ``("", 0)`` sem lançar exceção.
 
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
        if self._client is None:
            return "", 0
 
        resposta = self._client.chat.complete(
            model=self.config.model,
            max_tokens=self.config.max_tokens,
            messages=[
                {"role": "system", "content": sistema},
                {"role": "user", "content": usuario},
            ],
        )
 
        texto = ""
        if getattr(resposta, "choices", None):
            texto = resposta.choices[0].message.content or ""
 
        uso = getattr(resposta, "usage", None)
        tokens_usados = int(getattr(uso, "total_tokens", 0) or 0)
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