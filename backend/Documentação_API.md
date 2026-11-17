# TaskPilot — Documentação da API REST

Documentação dos endpoints, modelos de dados e formatos JSON utilizados pelo backend do TaskPilot.

**Base URL:** `http://localhost:8000/api/`

**Tecnologias:** Django REST Framework, SimpleJWT, SQLite e Google Gemini.

## 1. Autenticação

A API utiliza autenticação JWT. Os endpoints protegidos exigem o cabeçalho:

```http
Authorization: Bearer <access_token>
```

### POST `/auth/register/`

Cadastra um novo usuário.

**Body:**

```json
{
  "username": "usuario",
  "email": "usuario@email.com",
  "password": "SenhaForte123!"
}
```

**Resposta — 201 Created:**

```json
{
  "id": 1,
  "username": "usuario",
  "email": "usuario@email.com"
}
```

**Validações:** username único, e-mail não duplicado e senha válida conforme as regras do Django.

### POST `/auth/login/`

Autentica o usuário e retorna tokens JWT.

**Body:**

```json
{
  "username": "usuario",
  "password": "SenhaForte123!"
}
```

**Resposta — 200 OK:**

```json
{
  "refresh": "token_de_renovacao",
  "access": "token_de_acesso"
}
```

### POST `/auth/refresh/`

Gera um novo token de acesso.

**Body:**

```json
{
  "refresh": "token_de_renovacao"
}
```

**Resposta — 200 OK:**

```json
{
  "access": "novo_token_de_acesso"
}
```

### GET `/auth/me/`

Retorna as informações do usuário autenticado.

**Resposta — 200 OK:**

```json
{
  "id": 1,
  "username": "usuario",
  "email": "usuario@email.com"
}
```

---

## 2. Projetos

Todos os endpoints exigem autenticação JWT. Cada usuário pode acessar somente os próprios projetos.

### Modelo `Project`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | Integer | Identificador único |
| `owner` | Integer | ID do usuário proprietário |
| `title` | String | Título do projeto, até 200 caracteres |
| `description` | String | Descrição do objetivo |
| `color` | String | Cor hexadecimal `#RRGGBB` |
| `due_date` | Date/null | Prazo final, formato `YYYY-MM-DD` |
| `notes` | String | Anotações gerais |
| `progress` | Integer | Percentual de tarefas concluídas |
| `tasks_count` | Integer | Quantidade total de tarefas |
| `created_at` | DateTime | Data de criação |
| `updated_at` | DateTime | Última atualização |

Os campos `id`, `owner`, `progress`, `tasks_count`, `created_at` e `updated_at` são somente leitura na API.

### GET `/projects/`

Lista os projetos do usuário autenticado.

**Resposta — 200 OK:**

```json
[
  {
    "id": 1,
    "owner": 1,
    "title": "Aprender React",
    "description": "Aprender React em 20 dias",
    "color": "#2563EB",
    "due_date": "2026-12-10",
    "notes": "Estudar duas horas por dia.",
    "progress": 50,
    "tasks_count": 2,
    "created_at": "2026-11-17T10:00:00Z",
    "updated_at": "2026-11-17T10:00:00Z"
  }
]
```

### POST `/projects/`

Cria um projeto associado ao usuário autenticado.

**Body:**

```json
{
  "title": "Aprender React",
  "description": "Aprender React em 20 dias",
  "color": "#2563EB",
  "due_date": "2026-12-10",
  "notes": "Estudar duas horas por dia."
}
```

**Resposta — 201 Created:** objeto `Project` criado, incluindo ID e campos calculados.

O proprietário é definido automaticamente pelo backend.

### GET `/projects/{id}/`

Retorna os detalhes de um projeto.

**Resposta — 200 OK:** objeto `Project`.

### PATCH `/projects/{id}/`

Atualiza parcialmente um projeto.

**Body de exemplo:**

```json
{
  "title": "Aprender React e Vite",
  "color": "#16A34A",
  "notes": "Adicionar exercícios práticos."
}
```

**Resposta — 200 OK:** objeto `Project` atualizado.

### DELETE `/projects/{id}/`

Exclui o projeto e todas as tarefas vinculadas.

**Resposta — 204 No Content.**

---

## 3. Tarefas

Cada tarefa pertence a um projeto. O usuário só pode manipular tarefas de projetos próprios.

### Modelo `Task`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | Integer | Identificador único |
| `project` | Integer | ID do projeto |
| `title` | String | Título da tarefa |
| `description` | String | Descrição detalhada |
| `status` | String | `todo`, `doing`, `done` |
| `priority` | String | `low`, `medium`, `high` |
| `size` | String | `XS`, `S`, `M`, `L`, `XL` |
| `estimated_hours` | Decimal/null | Horas estimadas |
| `due_date` | Date/null | Prazo da tarefa |
| `notes` | String | Anotações individuais |
| `created_at` | DateTime | Data de criação |
| `updated_at` | DateTime | Última atualização |

O campo `project` é definido pela URL ao criar uma tarefa e não pode ser alterado pelo PATCH.

### GET `/projects/{id}/tasks/`

Lista todas as tarefas do projeto informado.

**Resposta — 200 OK:**

```json
[
  {
    "id": 1,
    "project": 1,
    "title": "Estudar JSX",
    "description": "Aprender JSX e componentes.",
    "status": "doing",
    "priority": "high",
    "size": "M",
    "estimated_hours": "4.00",
    "due_date": "2026-11-20",
    "notes": "Criar componentes reutilizáveis.",
    "created_at": "2026-11-17T10:00:00Z",
    "updated_at": "2026-11-17T10:00:00Z"
  }
]
```

### POST `/projects/{id}/tasks/`

Cria uma tarefa vinculada ao projeto.

**Body:**

```json
{
  "title": "Estudar JSX",
  "description": "Aprender JSX e componentes.",
  "status": "todo",
  "priority": "high",
  "size": "M",
  "estimated_hours": "4.00",
  "due_date": "2026-11-20",
  "notes": "Criar exemplos práticos."
}
```

**Resposta — 201 Created:** objeto `Task` criado.

### GET `/tasks/{id}/`

Consulta uma tarefa específica.

**Resposta — 200 OK:** objeto `Task`.

### PATCH `/tasks/{id}/`

Atualiza parcialmente uma tarefa.

**Body de exemplo:**

```json
{
  "status": "done",
  "priority": "medium",
  "notes": "Conteúdo concluído."
}
```

**Resposta — 200 OK:** objeto `Task` atualizado.

A alteração para `done` atualiza automaticamente o progresso calculado do projeto.

### DELETE `/tasks/{id}/`

Exclui uma tarefa.

**Resposta — 204 No Content.**

---

## 4. Inteligência Artificial — Gemini

### POST `/ai/generate-plan/`

Gera um planejamento personalizado utilizando a API Google Gemini.

**Autenticação:** JWT obrigatório.

**Modelo configurado:** `gemini-3.5-flash-lite`.

**Body:**

```json
{
  "title": "Aprender React",
  "description": "Quero aprender React e desenvolver uma aplicação web.",
  "deadline": "2026-12-10",
  "daily_hours": 2,
  "level": "beginner"
}
```

### Campos de entrada

| Campo | Tipo | Validação |
|---|---|---|
| `title` | String | Obrigatório, até 200 caracteres |
| `description` | String | Obrigatório, até 2.000 caracteres |
| `deadline` | Date | Data futura, no máximo 365 dias |
| `daily_hours` | Float | Entre 0,5 e 12 horas |
| `level` | String | `beginner`, `intermediate`, `advanced` |

### Resposta — 200 OK

Exemplo ilustrativo:

```json
{
  "title": "Aprender React",
  "tasks": [
    {
      "title": "Revisar JavaScript",
      "description": "Revisar conceitos de ES6.",
      "priority": "high",
      "size": "S",
      "estimated_hours": 3,
      "order": 1,
      "start_date": "2026-11-18",
      "due_date": "2026-11-19"
    },
    {
      "title": "Aprender JSX",
      "description": "Estudar componentes React.",
      "priority": "high",
      "size": "M",
      "estimated_hours": 4,
      "order": 2,
      "start_date": "2026-11-19",
      "due_date": "2026-11-21"
    }
  ],
  "saved": false
}
```

O backend valida o JSON com Pydantic e calcula as datas conforme o prazo e a disponibilidade informados.

**Importante:** o planejamento é apenas uma prévia. Nenhum projeto ou tarefa é salvo automaticamente.

### Modelo `AIUsage`

Registra o consumo de IA para auditoria e controle de quotas.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | Integer | Identificador do registro |
| `user` | ForeignKey/null | Usuário responsável |
| `model_name` | String | Modelo utilizado |
| `input_tokens` | Integer | Tokens de entrada |
| `output_tokens` | Integer | Tokens de saída |
| `reserved_tokens` | Integer | Tokens reservados |
| `status` | String | `reserved`, `completed`, `failed` |
| `created_at` | DateTime | Data da solicitação |
| `updated_at` | DateTime | Última atualização |

Esse modelo é interno ao backend e não possui endpoint público de consulta no escopo atual.

### Limites e proteções

- Limite diário de requisições por usuário.
- Limite global de requisições.
- Controle de consumo e reserva de tokens.
- Timeout configurável.
- Uma tentativa por geração, sem retries automáticos.
- Bloqueio manual por `AI_ENABLED`.
- Validação de estrutura, prioridades, tamanhos e estimativas.

---

## 5. Status HTTP e erros

| Código | Significado | Exemplo |
|---|---|---|
| `200` | Operação realizada | Consulta ou geração concluída |
| `201` | Recurso criado | Projeto ou tarefa cadastrada |
| `204` | Recurso excluído | Exclusão bem-sucedida |
| `400` | Entrada inválida | Data ou prioridade incorreta |
| `401` | Não autenticado | JWT ausente ou inválido |
| `404` | Não encontrado | Projeto inexistente ou de outro usuário |
| `422` | Planejamento inválido | JSON da IA inconsistente |
| `429` | Limite atingido | Quota de geração esgotada |
| `503` | Serviço indisponível | IA desativada ou falha externa |
| `504` | Tempo excedido | Timeout do Gemini |

### Exemplo de erro de validação

```json
{
  "estimated_hours": [
    "A estimativa de horas não pode ser negativa."
  ]
}
```

### Exemplo de erro da IA

```json
{
  "detail": "O serviço de IA está indisponível no momento."
}
```

Os erros internos do provedor não devem expor chaves, tokens ou detalhes sensíveis ao frontend.

---

## 6. Relacionamento entre modelos

```text
User
 ├── Project (1:N)
 │    ├── Task (1:N)
 │    └── Notes (campo do projeto)
 │
 └── AIUsage (1:N)
```

- Um usuário pode possuir vários projetos.
- Um projeto pode possuir várias tarefas.
- Cada tarefa pertence a um único projeto.
- Cada projeto possui um proprietário.
- Os registros de uso da IA podem ser preservados após a exclusão do usuário, com a referência ao usuário definida como nula.

---

## 7. Fluxo principal da aplicação

```text
Cadastro / Login
       |
       v
Autenticação JWT
       |
       v
Criar objetivo
       |
       v
POST /api/ai/generate-plan/
       |
       v
Validação + Gemini + Cronograma
       |
       v
Prévia editável no React
       |
       v
POST /api/projects/
       |
       v
POST /api/projects/{id}/tasks/
       |
       v
Gerenciamento Kanban / Backlog
```

A geração com IA e a persistência são operações separadas. O usuário revisa o planejamento antes de confirmar a criação do projeto e de suas tarefas.
