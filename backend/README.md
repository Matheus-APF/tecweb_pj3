# TaskPilot — Backend

API REST do **TaskPilot**, uma plataforma de gerenciamento de projetos e tarefas com planejamento automatizado por Inteligência Artificial.

Desenvolvido com **Python, Django REST Framework e Google Gemini**, o backend gerencia autenticação, projetos, tarefas e geração de planejamentos personalizados.

## Tecnologias

- **Python + Django** — Estrutura e regras de negócio.
- **Django REST Framework** — Endpoints REST e serializers.
- **SimpleJWT** — Autenticação com tokens JWT.
- **Google Gemini API** — Geração de planejamentos com IA.
- **Pydantic** — Validação de respostas estruturadas.
- **SQLite** — Banco de dados local.
- **django-cors-headers** — Comunicação com o frontend React.
- **python-dotenv** — Gerenciamento de variáveis de ambiente.

---

## Como executar

### 1. Acessar o backend

```bash
cd backend
```

### 2. Criar e ativar o ambiente virtual

```bash
python -m venv .venv
```

Windows (PowerShell):

```powershell
.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
source .venv/bin/activate
```

### 3. Instalar as dependências

```bash
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente

Crie o arquivo `.env` com base no `.env.example`.

Configure a chave do Django, a chave da API Gemini e os limites de utilização da IA.

### 5. Aplicar as migrações

```bash
python manage.py migrate
```

### 6. Iniciar o servidor

```bash
python manage.py runserver
```

**API:** http://localhost:8000

**Status:** http://localhost:8000/api/status/

Resposta esperada:

```json
{
  "status": "ok",
  "app": "TaskPilot"
}
```

---

## Endpoints disponíveis

### Status e autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/status/` | Verificar status da API |
| POST | `/api/auth/register/` | Cadastrar usuário |
| POST | `/api/auth/login/` | Obter tokens JWT |
| POST | `/api/auth/refresh/` | Renovar token de acesso |
| GET | `/api/auth/me/` | Consultar usuário autenticado |

### Projetos

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/projects/` | Listar projetos |
| POST | `/api/projects/` | Criar projeto |
| GET | `/api/projects/{id}/` | Consultar projeto |
| PATCH | `/api/projects/{id}/` | Atualizar projeto |
| DELETE | `/api/projects/{id}/` | Excluir projeto e tarefas |

### Tarefas

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/projects/{id}/tasks/` | Listar tarefas do projeto |
| POST | `/api/projects/{id}/tasks/` | Criar tarefa |
| GET | `/api/tasks/{id}/` | Consultar tarefa |
| PATCH | `/api/tasks/{id}/` | Atualizar tarefa ou status |
| DELETE | `/api/tasks/{id}/` | Excluir tarefa |

### Gemmini

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/ai/generate-plan/` | Gerar planejamento com Gemini |

**Autenticação:** Os endpoints de projetos, tarefas e IA exigem JWT no cabeçalho:

`Authorization: Bearer <access_token>`

Cada usuário possui acesso somente aos próprios projetos e tarefas.

---

## Arquitetura

### Estrutura do backend

```text
backend/
├── config/              # Configurações e rotas globais
├── core/                # Endpoint de status
├── users/               # Cadastro e autenticação JWT
├── projects/            # Modelos, serializers e CRUD
├── ai/
│   ├── models.py        # Histórico de consumo de tokens
│   ├── schemas.py       # Contratos JSON com Pydantic
│   ├── serializers.py   # Validação das requisições
│   ├── prompts.py       # Instruções e prompts da IA
│   ├── services.py      # Integração com Gemini
│   ├── scheduling.py    # Cálculo de datas e horas
│   ├── views.py         # Endpoint e controle de quotas
│   ├── urls.py          # Rotas da IA
│   └── limits.py        # Reservado para limites
├── manage.py
├── requirements.txt
└── .env.example
```

### Fluxo de geração com IA

1. O usuário envia um objetivo, prazo e disponibilidade.
2. O Django autentica a requisição e valida os dados.
3. O sistema verifica o consumo de tokens e reserva quota.
4. O Gemini gera tarefas em formato JSON estruturado.
5. O Pydantic valida e normaliza os dados retornados.
6. O Django calcula datas conforme as horas disponíveis.
7. O consumo de tokens é registrado.
8. O planejamento é retornado para revisão do usuário.


### Integração Google Gemini

**Modelo configurado:** `gemini-3.5-flash-lite`

A integração utiliza o SDK `google-genai`, com chave privada armazenada exclusivamente no backend.

Principais configurações:

- Respostas estruturadas e validadas com Pydantic.
- Normalização de prioridades, tamanhos e ordenação das tarefas.
- Timeout configurável, com padrão de 20 segundos.
- Uma tentativa por geração, sem retries automáticos.
- Limite de entrada de 2.000 tokens.
- Limite de saída configurado em 2.500 tokens.
- Temperatura de geração de `0.3`.
- Tratamento de respostas inválidas, indisponibilidade e timeout.

### Controle de consumo e segurança

O TaskPilot implementa mecanismos para reduzir o risco de consumo excessivo da API:

- Bloqueio manual de geração com variável de ambiente `AI_ENABLED`.
- Controle de quota diária por usuário e global.
- Reserva atômica de tokens antes da geração.
- Reconciliação do consumo após a resposta.
- Expiração de reservas órfãs.
- Histórico de consumo registrado no modelo `AIUsage`.
- Proteção do endpoint com autenticação JWT.
- Tratamento de erros HTTP sem exposição de informações internas.

---

## Status atual

### Commit 01 — Configuração do ambiente
- Estrutura inicial do Django REST Framework.
- Configuração de CORS, variáveis de ambiente e dependências.
- Criação do aplicativo `core` e endpoint de status.

### Commit 02 — Usuários e autenticação JWT
- Implementação de cadastro, login e renovação de tokens.
- Validação de e-mail, senha e credenciais.
- Criação do endpoint de usuário autenticado e proteção de rotas.

### Commit 03 — Modelos de Projetos e Tarefas
- Criação dos modelos `Project` e `Task` e seus relacionamentos.
- Definição de status, prioridades e tamanhos.
- Implementação de serializers, validações e Django Admin.
- Migrações e testes de relacionamento realizados com sucesso.

### Commit 04 — APIs CRUD de Projetos e Tarefas
- Implementação dos endpoints REST de projetos e tarefas.
- Atualização de status, prioridades, prazos e estimativas.
- Cálculo automático do progresso dos projetos.
- Controle de acesso aos dados do usuário autenticado.
- Testes de CRUD e permissões da API.

### Commit 05 — Integração Gemini e Planejamento Inteligente
- Criação do aplicativo `ai` e integração com Google Gemini.
- Implementação do endpoint autenticado de geração.
- Criação de prompts com separação entre instruções e dados do usuário.
- Validação e normalização das respostas JSON com Pydantic.
- Cálculo de cronogramas conforme prazo e disponibilidade.
- Implementação de controle de quotas e histórico de tokens.
- Tratamento de timeout, falhas da API e respostas inválidas.
- Geração de planejamentos sem persistência automática.

---

## Observações

- O frontend React consome exclusivamente os endpoints do Django.
- Chaves privadas e credenciais não devem ser versionadas.
- O armazenamento de arquivos de mídia, caso implementado, deverá utilizar um serviço externo.
- Para produção, está prevista a utilização de PostgreSQL persistente e deploy separado do frontend e backend.