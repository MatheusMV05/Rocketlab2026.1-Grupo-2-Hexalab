# 🚀 Guia de Configuração do Projeto

Este guia explica como configurar o ambiente de desenvolvimento do zero para o **Rocketlab 2026.1 - Grupo 2**.

---

## 1. Pré-requisitos
Certifique-se de ter instalado em sua máquina:
- [Python 3.11+](https://www.python.org/)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Node.js 20+](https://nodejs.org/) (opcional, se não usar Docker)

---

## 2. Passo a Passo Inicial

### Passo 1: Clonar o Repositório
```bash
git clone <url-do-repositorio>
cd Rocketlab2026.1-Grupo-2-Hexalab
```

### Passo 2: Baixar o Banco de Dados
O banco de dados de 1GB não está no Git. Você precisa rodar o script de automação para baixá-lo do Google Drive:
```bash
python baixar_banco.py
```
*Este comando criará o arquivo em `backend/data/database.db`.*

### Passo 3: Validar o Banco de Dados (Opcional)
Você pode verificar se o download foi bem-sucedido e se o arquivo está íntegro rodando o script de diagnóstico:
```bash
python teste_banco.py
```

### Passo 4: Configurar Variáveis de Ambiente
Crie um arquivo `.env` na pasta `backend/` baseado no exemplo:
```bash
cp backend/.env.example backend/.env
```
*Importante:* Para usar as funcionalidades de IA (agente), você precisará adicionar sua `MISTRAL_API_KEY` no arquivo `.env` recém-criado.

---

## 3. Rodando com Docker (Recomendado) 🐳

Para subir o **Backend** e o **Frontend** simultaneamente:
```bash
docker-compose up --build
```
- **Backend:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Frontend:** [http://localhost:5173](http://localhost:5173)

---

## 4. Rodando Localmente (Sem Docker) 🛠️

### Backend
1. Entre na pasta: `cd backend`
2. Crie um ambiente virtual: `python -m venv venv`
3. Ative o venv:
   - Mac/Linux: `source venv/bin/activate`
   - Windows: `venv\Scripts\activate`
4. Instale as dependências: `pip install -r requirements.txt`
5. Rode a API: `uvicorn app.main:app --reload`

### Frontend
1. Entre na pasta: `cd frontend`
2. Instale as dependências: `npm install`
3. Rode o projeto: `npm run dev`

---

## 5. Executando Testes ✅

Para garantir que o backend está funcionando corretamente, você pode rodar os testes:

### Teste de Integração (Pipeline de Agentes)
Este teste valida o fluxo completo de extração de esquema e geração de SQL:
```bash
cd backend
python run_test.py
```

### Testes Automatizados (Pytest)
Para rodar a suíte completa de testes unitários e de integração:
```bash
cd backend
python -m pytest
```

---

## Dicas Úteis
- Se o banco de dados for atualizado na nuvem, basta rodar `python baixar_banco.py` novamente.
- Arquivos `.db` e `.zip` estão configurados para serem ignorados pelo Git, evitando que você suba arquivos pesados por engano.
