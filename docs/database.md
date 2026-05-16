# Conexão com o Banco de Dados

Banco PostgreSQL hospedado no **Google Cloud SQL**.

## Credenciais

| Parâmetro | Valor |
|-----------|-------|
| Host | `34.151.192.232` |
| Porta | `5432` |
| Banco | `postgres` |
| Usuário | `postgres` |
| Senha | Disponivel no notion |

## Configuração

Crie o arquivo `backend/.env` com base no `backend/.env.example`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:<SENHA>@34.151.192.232:5432/postgres
ENVIRONMENT=development
```

## Testar a conexão

```bash
python -c "
import asyncio, asyncpg
async def test():
    conn = await asyncpg.connect('postgresql://postgres:<SENHA>@34.151.192.232:5432/postgres')
    print('Conectado:', await conn.fetchval('SELECT version()'))
    await conn.close()
asyncio.run(test())
"
```
