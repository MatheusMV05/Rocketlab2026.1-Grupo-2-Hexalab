# MAC-SQL Architecture Guide


## Stack
- Python 3.10+
- LLM: Mistral via `mistralai` SDK (`open-mistral-7b`)
- Templates: Jinja2 (`.j2`)
- Few-shots: YAML + `sentence-transformers` (embedding retrieval)
- DB: SQLite via built-in `sqlite3`
- Tests: `pytest` with mocked LLM client

---

## Folder Structure

```
agent/
├── agentes/
│   ├── base.py          # Abstract BaseAgent — all agents inherit this
│   ├── selector.py      # Agent 1: filters DB schema
│   ├── decomposer.py    # Agent 2: generates SQL with chain-of-thought
│   └── refiner.py       # Agent 3: executes SQL, corrects errors in loop
├── prompts/
│   ├── selector.j2      # System prompt template for Selector
│   ├── decomposer.j2    # System prompt template for Decomposer
│   └── refiner.j2       # System prompt template for Refiner
├── db/
│   ├── schema_reader.py # Reads DB schema → returns DDL string
│   └── executor.py      # Executes SQL → returns ExecutionResult
├── few_shots/
│   ├── examples.yaml    # Curated question→SQL pairs
│   └── retriever.py     # FewShotRetriever: embedding-based similarity search
├── models/
│   ├── schema.py        # DatabaseSchema, TableSchema, ColumnSchema dataclasses
│   └── result.py        # SelectorResult, DecomposerResult, RefinerResult, PipelineResult
├── tests/
│   ├── test_selector.py
│   ├── test_decomposer.py
│   ├── test_refiner.py
│   └── test_pipeline_e2e.py
├── pipeline.py          # Orchestrator — only public entry point
├── config.py            # Config dataclass (reads from env)
├── .env                 # MISTRAL_API_KEY — never commit
└── requirements.txt
```

---

## Data Flow

```
question + db_path
  → read_schema(db_path)          → full_schema: str
  → SelectorAgent.run()           → SelectorResult.filtered_schema
  → FewShotRetriever.retrieve()   → few_shots: List[dict]
  → DecomposerAgent.run()         → DecomposerResult.sql + .reasoning
  → RefinerAgent.run()            → RefinerResult.sql + .success
  → PipelineResult
```

---

## Key Contracts

### BaseAgent (agents/base.py)
```python
class BaseAgent(ABC):
    def _call_llm(self, system: str, user: str) -> tuple[str, int]: ...
    # returns (response_text, tokens_used)
    # ALL LLM calls go through here — never call the API directly in subclasses

    def _render(self, template_name: str, **kwargs) -> str: ...
    # renders prompts/<template_name>.j2

    @abstractmethod
    def run(self, **kwargs): ...
```

### SelectorAgent (agents/selector.py)
```python
def run(self, full_schema: str, question: str) -> SelectorResult: ...
# Output must be valid DDL. Validate with re.findall(r"CREATE TABLE", result.filtered_schema)
# Fallback to full_schema if output is not DDL
```

### DecomposerAgent (agents/decomposer.py)
```python
def run(self, filtered_schema: str, question: str, few_shots: list[dict]) -> DecomposerResult: ...
# LLM output format expected: "Reasoning: ...\nSQL: ..."
# Use regex to extract each field
```

### RefinerAgent (agents/refiner.py)
```python
def run(self, sql: str, question: str, filtered_schema: str, db_path: str) -> RefinerResult: ...
# Loop: execute_sql() → if not ok → call LLM to fix → repeat up to config.max_retries
# Always return RefinerResult(success=False) when retries exhausted — never return broken SQL silently
```

### ExecutionResult (db/executor.py)
```python
@dataclass
class ExecutionResult:
    ok: bool        # False if error OR if 0 rows returned
    rows: list
    error: str | None
# executor.py must catch ALL exceptions — never propagate to agents
```

### Result Dataclasses (models/result.py)
```python
@dataclass
class SelectorResult:
    filtered_schema: str
    tables_selected: List[str]
    tokens_used: int

@dataclass
class DecomposerResult:
    sql: str
    reasoning: str
    tokens_used: int

@dataclass
class RefinerResult:
    sql: str
    attempts: int
    success: bool
    last_error: str | None
    tokens_used: int

@dataclass
class PipelineResult:
    question: str
    sql: str
    success: bool
    selector: SelectorResult
    decomposer: DecomposerResult
    refiner: RefinerResult
    total_tokens: int  # computed in __post_init__
```

### Config (config.py)
```python
@dataclass
class Config:
    api_key: str       = os.getenv("MISTRAL_API_KEY", "")
    model: str         = "open-mistral-7b"
    max_tokens: int    = 1024
    max_retries: int   = 3       # Refiner iterations
    few_shot_path: str = "few_shots/examples.yaml"
```

### Pipeline (pipeline.py)
```python
class MACPipeline:
    def run(self, question: str, db_path: str) -> PipelineResult: ...
# Public API: MACPipeline().run(question, db_path)
# Instantiates all agents internally — callers never touch agents directly
```

---

## Prompt Templates (prompts/*.j2)

Variables injected per agent:

| Template | Variables |
|---|---|
| `selector.j2` | `{{ schema }}`, `{{ question }}` |
| `decomposer.j2` | `{{ schema }}`, `{{ question }}`, `{{ examples }}` |
| `refiner.j2` | `{{ schema }}`, `{{ question }}`, `{{ previous_sql }}`, `{{ execution_result }}` |

**Rules:**
- No prompt strings in `.py` files — all prompts live in `.j2`
- Selector output instruction: `"Return ONLY the filtered DDL. No explanations."`
- Decomposer output instruction: `"Respond EXACTLY: Reasoning: [...]\nSQL: [...]"`
- Refiner output instruction: `"Return ONLY the corrected SQL query."`

---

## Few-shots (few_shots/examples.yaml)

```yaml
- question: "How many active customers are there?"
  sql: "SELECT COUNT(*) FROM customers WHERE status = 'active'"
```

`FewShotRetriever.retrieve(question, k=3)` returns `List[dict]` with `question` and `sql` keys.

---

## Hard Rules

1. **No direct API calls in agents** — always use `BaseAgent._call_llm()`
2. **No prompt strings in Python** — always use `.j2` templates
3. **No raw exceptions from executor** — always return `ExecutionResult`
4. **No broken SQL returned silently** — always set `success=False` when retries exhausted
5. **No `.env` in git** — `MISTRAL_API_KEY` only via environment variable
6. **No dict for inter-agent data** — always use typed dataclasses from `models/`
7. **Mock LLM client in unit tests** — only `test_pipeline_e2e.py` hits the real API

---

## Token Budget (reference)

| Agent | Avg tokens/call |
|---|---|
| Selector | ~2,800 |
| Decomposer | ~4,000 |
| Refiner (per attempt) | ~1,700 |
| **Full pipeline** | **~8,500** |

Mistral free tier ~500k tokens/month ≈ 58 full pipeline calls.

**Optimization levers:**
- Cache `schema_reader` output per `db_path` across calls
- Reduce few-shots from 5 → 2 (saves ~1,500 tokens/call)
- Strip comments and whitespace from DDL before injecting
- Break Refiner loop on first success (don't always run N iterations)