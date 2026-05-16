from __future__ import annotations

from app.agent.agentes.agente_sugestor import AgenteSugestor


def criar_agente() -> AgenteSugestor:
	return AgenteSugestor()


def test_sugestor_interpreta_json_e_propaga_tokens(monkeypatch):
	agente = criar_agente()

	resposta_json = '{"perguntas": ["Qual o top 10 produtos?", "Qual a receita por categoria?", "Qual o ticket medio?"]}'

	def fake_call_llm(*, sistema: str, usuario: str):
		return resposta_json, 23

	monkeypatch.setattr(agente, "_call_llm", fake_call_llm)

	resultado = agente.run(
		pergunta="Me mostre vendas",
		sql_gerado="SELECT id, nome FROM customers;",
		schema=None,
		amostra_resultado="id,nome\n1,Fernando",
	)

	assert resultado.sugestoes == [
		"Qual o top 10 produtos?",
		"Qual a receita por categoria?",
		"Qual o ticket medio?",
	]
	assert resultado.tabela_principal == "customers"
	assert resultado.tokens_usados == 23


def test_sugestor_interpreta_texto_livre_e_normaliza(monkeypatch):
	agente = criar_agente()

	texto = """
	- Qual produto mais vendido\n
	- Qual produto mais vendido\n
	- Quais categorias geram mais receita\n
	"""

	def fake_call_llm(*, sistema: str, usuario: str):
		return texto, 7

	monkeypatch.setattr(agente, "_call_llm", fake_call_llm)

	resultado = agente.run(
		pergunta="Venda do mes",
		sql_gerado="SELECT * FROM products;",
		schema=None,
		amostra_resultado="",
	)

	assert resultado.sugestoes == [
		"Qual produto mais vendido",
		"Quais categorias geram mais receita",
	]
	assert resultado.tokens_usados == 7


def test_extrai_tabelas_do_sql_variantes():
	sql = 'SELECT a.id, b.name FROM `schema`.`Orders` AS a JOIN customers b ON a.customer_id = b.id;'
	# Injetar um parser sqlglot falso que expõe parse_one e nós Table
	import types
	import sys
	fake = types.ModuleType("sqlglot")

	class FakeTable:
		def __init__(self, name):
			self.name = name

	class FakeTree:
		def __init__(self, tables):
			self._tables = tables

		def find_all(self, _type):
			return self._tables

	def parse_one(_sql):
		return FakeTree([FakeTable("Orders"), FakeTable("customers")])

	fake.parse_one = parse_one
	expr_mod = types.ModuleType("sqlglot.expressions")
	expr_mod.Table = object

	sys.modules["sqlglot"] = fake
	sys.modules["sqlglot.expressions"] = expr_mod

	tabelas = AgenteSugestor._extrair_tabelas_do_sql(sql)
	# Deve extrair orders e customers (em lowercase)
	assert "orders" in tabelas
	assert "customers" in tabelas
