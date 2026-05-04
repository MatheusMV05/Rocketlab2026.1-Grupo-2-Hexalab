# Testes do backend

Esta pasta reúne os testes automatizados do agente e do leitor de esquema.

## Cobertura principal

- `teste_agente_seletor.py`: valida o `AgenteSeletor` com LLM simulado e com um caso de integração opcional.
- `teste_leitor_esquema.py`: valida a leitura do DDL de um banco SQLite.

## O que os testes do agente verificam

- seleção correta de tabelas quando o LLM devolve DDL válido;
- retorno ao esquema completo quando a resposta do LLM não é DDL;
- preservação de chaves estrangeiras e tabelas relacionadas;
- extração de nomes de tabelas em variações comuns de SQL;
- exclusão de views da lista de tabelas selecionadas;
- propagação dos tokens usados pela chamada ao modelo.

## Como executar

Execute os testes a partir da pasta `backend`:

```bash
python -m pytest tests/teste_agente_seletor.py tests/teste_leitor_esquema.py
```

O teste de integração do seletor depende da variável `MISTRAL_API_KEY`; sem ela, o caso é pulado.