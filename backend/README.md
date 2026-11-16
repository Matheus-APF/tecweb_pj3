# TaskPilot — Backend

API REST do TaskPilot, desenvolvida com **Python, Django e Django REST Framework**.

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

## Endpoints disponíveis

### Status da API
- `GET /api/status/` — Verificar status da API.

### Autenticação
- `POST /api/auth/register/` — Cadastrar usuário.
- `POST /api/auth/login/` — Realizar login e obter tokens JWT.
- `POST /api/auth/refresh/` — Renovar token de acesso.
- `GET /api/auth/me/` — Consultar usuário autenticado.

### Projetos
- `GET /api/projects/` — Listar projetos do usuário autenticado.
- `POST /api/projects/` — Criar novo projeto.
- `GET /api/projects/{id}/` — Consultar detalhes de um projeto.
- `PATCH /api/projects/{id}/` — Atualizar informações do projeto.
- `DELETE /api/projects/{id}/` — Excluir projeto e suas tarefas.

### Tarefas
- `GET /api/projects/{id}/tasks/` — Listar tarefas de um projeto.
- `POST /api/projects/{id}/tasks/` — Criar tarefa vinculada ao projeto.
- `GET /api/tasks/{id}/` — Consultar detalhes de uma tarefa.
- `PATCH /api/tasks/{id}/` — Atualizar tarefa, incluindo status, prioridade e prazo.
- `DELETE /api/tasks/{id}/` — Excluir tarefa.

> **Autenticação:** Todos os endpoints de projetos e tarefas exigem token JWT no cabeçalho `Authorization: Bearer <access_token>`. Cada usuário possui acesso somente aos próprios projetos e tarefas.


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

### Commit 03 — Modelos de Projetos e Tarefas
- Criação do aplicativo `projects` e registro no Django.
- Implementação dos modelos `Project` e `Task`, com relacionamento entre usuários, projetos e tarefas.
- Definição de status, prioridades e tamanhos de tarefas com `TextChoices`.
- Criação dos serializers com validação de dados e permissões de associação.
- Registro dos modelos no Django Admin.
- Criação e aplicação das migrações no banco de dados.
- Testes de criação e relacionamento dos modelos realizados com sucesso pelo Django Shell.

### Commit 04 — APIs CRUD de Projetos e Tarefas
- Implementação dos endpoints REST para criação, listagem, consulta, edição e exclusão de projetos.
- Implementação do CRUD de tarefas vinculadas aos projetos.
- Gerenciamento dos status `To Do`, `Doing` e `Feito`.
- Validação de prioridades, tamanhos, prazos e estimativas de horas.
- Cálculo automático do progresso e quantidade de tarefas por projeto.
- Proteção dos endpoints com autenticação JWT.
- Restrição de acesso aos projetos e tarefas do usuário autenticado.
- Testes das operações CRUD, validações e permissões da API.