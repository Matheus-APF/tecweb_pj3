# TaskPilot — Backend

API REST do TaskPilot, desenvolvida com **Python, Django e Django REST Framework**.

## Status atual

### Commit 01 — Configuração do ambiente
- Estrutura inicial do Django e Django REST Framework.
- Configuração de CORS e variáveis de ambiente com `python-dotenv`.
- Criação do aplicativo `core` e endpoint `GET /api/status/`.
- Configuração das dependências em `requirements.txt`.

### Commit 02 — Usuários e autenticação JWT
- Criação do aplicativo `users` e organização das rotas da API.
- Configuração de autenticação JWT com `SimpleJWT`.
- Implementação de cadastro de usuários com validação de e-mail e senha.
- Implementação de login e renovação de tokens.
- Criação do endpoint protegido para consulta do usuário autenticado.
- Configuração de permissões e proteção dos endpoints.

**Endpoints disponíveis:**
- `GET /api/status/` — Verificar status da API.
- `POST /api/auth/register/` — Cadastrar usuário.
- `POST /api/auth/login/` — Realizar login e obter tokens JWT.
- `POST /api/auth/refresh/` — Renovar token de acesso.
- `GET /api/auth/me/` — Consultar usuário autenticado.

## Como executar

**1.** Acesse a pasta do backend:

```bash
cd backend
```

**2.** Crie e ative o ambiente virtual:

```bash
python -m venv .venv
```

Windows (PowerShell):
```powershell
.venv\Scripts\Activate.ps1
```

**3.** Instale as dependências:

```bash
pip install -r requirements.txt
```

**4.** Configure o arquivo `.env` com base no `.env.example`.

**5.** Execute as migrações:

```bash
python manage.py migrate
```

**6.** Inicie o servidor:

```bash
python manage.py runserver
```

API disponível em: http://localhost:8000

Endpoint de teste: http://localhost:8000/api/status/

**Resposta esperada:**
```json
{
  "status": "ok",
  "app": "TaskPilot"
}
```