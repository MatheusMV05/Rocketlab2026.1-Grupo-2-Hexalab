import yaml
import logging
import re
from functools import lru_cache
from pathlib import Path
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from app.agent.few_shots.modelos import ExemploFewShot

logger = logging.getLogger(__name__)


def _resolver_caminho_yaml(path: str | Path) -> Path:
    """Resolve o caminho do YAML de exemplos few-shot.

    Aceita caminho absoluto, caminho relativo ao diretório de execução e caminho
    relativo ao pacote `few_shots`. A resolução centralizada evita que cada
    agente precise repetir a mesma heurística de localização.
    """
    caminho_yaml = Path(path)

    if caminho_yaml.exists():
        return caminho_yaml.resolve()

    caminho_alternativo = Path(__file__).resolve().parent / path
    if caminho_alternativo.exists():
        return caminho_alternativo.resolve()

    caminho_alternativo2 = Path(__file__).resolve().parent / Path(path).name
    if caminho_alternativo2.exists():
        return caminho_alternativo2.resolve()

    return caminho_yaml


class FewShotRetriever:
    """Recupera exemplos few-shot mais parecidos com a pergunta do usuário.

    O retriever carrega os exemplos do YAML configurado, normaliza cada item
    para `ExemploFewShot` e cria um índice de embeddings para ranquear os
    exemplos por similaridade semântica.
    """

    def __init__(self, path: str | Path, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        caminho_yaml = _resolver_caminho_yaml(path)

        logger.info(f"Carregando exemplos few-shot de: {caminho_yaml}")

        with open(caminho_yaml, 'r', encoding='utf-8') as file:
            exemplos_raw = yaml.safe_load(file) or []

        self.exemplos = [
            exemplo
            for item in exemplos_raw
            if (exemplo := ExemploFewShot.from_raw(item)) is not None
        ]

        if not self.exemplos:
            logger.warning(f"Nenhum exemplo encontrado no arquivo {path}.")
            self.model = None
            self.index = None
            return

        logger.info(f"Carregando modelo de embeddings: {model_name}")
        try:
            self.model = SentenceTransformer(model_name)
            perguntas_yaml = [e.question for e in self.exemplos]
            self.index = self.model.encode(perguntas_yaml, convert_to_numpy=True)
            logger.info(f"Modelo carregado e {len(self.exemplos)} exemplos indexados.")
        except Exception as erro:
            logger.warning(
                "Modelo de embeddings indisponível (%s). Usando retrieval lexical.",
                erro,
            )
            self.model = None
            self.index = None

    def retrieve(self, pergunta: str, k: int = 3) -> list[ExemploFewShot]:
        """Retorna os `k` exemplos mais similares à pergunta informada."""
        if not self.exemplos or k <= 0:
            return []

        if not self.model or self.index is None:
            return self._retrieve_lexical(pergunta, k)

        vetor_pergunta = self.model.encode([pergunta], convert_to_numpy=True)
        scores = cosine_similarity(vetor_pergunta, self.index)[0]
        top_k_indices = scores.argsort()[::-1][:k]
        return [self.exemplos[i] for i in top_k_indices]

    def _retrieve_lexical(self, pergunta: str, k: int) -> list[ExemploFewShot]:
        tokens_pergunta = self._tokens(pergunta)
        ranqueados: list[tuple[int, ExemploFewShot]] = []
        for exemplo in self.exemplos:
            texto = f"{exemplo.question} {exemplo.reasoning} {exemplo.sql}"
            score = len(tokens_pergunta & self._tokens(texto))
            ranqueados.append((score, exemplo))

        ranqueados.sort(key=lambda item: item[0], reverse=True)
        return [exemplo for score, exemplo in ranqueados[:k] if score > 0] or self.exemplos[:k]

    @staticmethod
    def _tokens(texto: str) -> set[str]:
        return {
            token
            for token in re.findall(r"[A-Za-zÀ-ÿ0-9_]+", (texto or "").lower())
            if len(token) > 2
        }


@lru_cache(maxsize=8)
def _cached_retriever(
    caminho_yaml: str,
    model_name: str,
    mtime_ns: int,
) -> FewShotRetriever:
    """Instancia e guarda em cache um `FewShotRetriever`.

    A chave inclui caminho resolvido, nome do modelo de embeddings e `mtime_ns`
    do YAML. Assim, o índice de embeddings é reutilizado no processo atual e
    invalidado automaticamente quando o arquivo de exemplos muda.
    """
    logger.info(
        "Criando FewShotRetriever cacheado: path=%s model=%s mtime_ns=%s",
        caminho_yaml,
        model_name,
        mtime_ns,
    )
    return FewShotRetriever(path=caminho_yaml, model_name=model_name)


def get_cached_fewshot_retriever(
    path: str | Path,
    model_name: str = "paraphrase-multilingual-MiniLM-L12-v2",
) -> FewShotRetriever:
    """Retorna um retriever few-shot cacheado.

    Use esta função no pipeline em vez de instanciar `FewShotRetriever`
    diretamente. Ela evita recarregar o modelo `SentenceTransformer` e
    recalcular embeddings a cada pergunta, mantendo fallback lexical se o modelo
    de embeddings não estiver disponível.
    """
    caminho_yaml = _resolver_caminho_yaml(path)
    try:
        mtime_ns = caminho_yaml.stat().st_mtime_ns
    except OSError:
        mtime_ns = 0
    return _cached_retriever(str(caminho_yaml), model_name, mtime_ns)
