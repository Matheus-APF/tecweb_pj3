# TaskPilot — Backend

API REST do **TaskPilot**, uma plataforma de gerenciamento de projetos e tarefas com planejamento automatizado por Inteligência Artificial.

Desenvolvido com **Python, Django REST Framework e Google Gemini**, o backend gerencia autenticação, projetos, tarefas e geração de planejamentos personalizados, com controle de consumo da IA e testes automatizados.

## Tecnologias

- **Python + Django** — Estrutura e regras de negócio.
- **Django REST Framework** — Endpoints REST e serializers.
- **SimpleJWT** — Autenticação com tokens JWT.
- **Google Gemini API** — Geração de planejamentos com IA.
- **Pydantic** — Validação de respostas estruturadas.
- **SQLite** — Banco de dados local.
- **django-cors-headers** — Integração com o frontend React.
- **python-dotenv** — Gerenciamento de variáveis de ambiente.
- **pytest / pytest-django** — Testes automatizados.
- **GitHub Actions** — Integração contínua.

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

Crie o arquivo `.env` com base no `.env.example`, configurando a chave do Django, a chave da API Gemini e os limites de utilização da IA.

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
| POST | `/api/auth/refresh/` | Renovar token |
| GET | `/api/auth/me/` | Consultar usuário autenticado |

### Projetos

| Método | Endpoint | Descrição |
|---|---|---|
| GET / POST | `/api/projects/` | Listar e criar projetos |
| GET | `/api/projects/{id}/` | Consultar projeto |
| PATCH | `/api/projects/{id}/` | Atualizar projeto |
| DELETE | `/api/projects/{id}/` | Excluir projeto e tarefas |

### Tarefas

| Método | Endpoint | Descrição |
|---|---|---|
| GET / POST | `/api/projects/{id}/tasks/` | Listar e criar tarefas |
| GET | `/api/tasks/{id}/` | Consultar tarefa |
| PATCH | `/api/tasks/{id}/` | Atualizar tarefa ou status |
| DELETE | `/api/tasks/{id}/` | Excluir tarefa |

### Inteligência Artificial

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/ai/generate-plan/` | Gerar planejamento com Gemini |

**Autenticação:** os endpoints de projetos, tarefas e IA exigem JWT:

```http
Authorization: Bearer <access_token>
```

Cada usuário possui acesso somente aos próprios projetos e tarefas.

---

## Arquitetura

### Estrutura do backend

```text
backend/
├── config/           # Configurações e rotas globais
├── core/             # Endpoint de status
├── users/            # Cadastro e autenticação JWT
├── projects/         # Modelos, serializers e CRUD
├── ai/
│   ├── models.py     # Histórico de consumo de tokens
│   ├── schemas.py    # Contratos JSON com Pydantic
│   ├── serializers.py
│   ├── prompts.py    # Instruções da IA
│   ├── services.py   # Integração com Gemini
│   ├── scheduling.py # Cálculo de cronogramas
│   ├── views.py      # Endpoint e controle de quotas
│   ├── urls.py
│   └── limits.py
├── reports/          # Relatórios de testes
├── manage.py
├── run_tests.ps1
├── requirements.txt
└── .env.example
```

### Fluxo de geração com IA

1. O usuário informa objetivo, prazo e disponibilidade.
2. O Django autentica a requisição e valida os dados.
3. O sistema verifica os limites de consumo e reserva quota.
4. O Gemini gera tarefas em JSON estruturado.
5. O Pydantic valida e normaliza a resposta.
6. O Django calcula o cronograma conforme a disponibilidade.
7. O consumo de tokens é registrado.
8. O planejamento é retornado para revisão, sem persistência automática.

### Integração Google Gemini

**Modelo configurado:** `gemini-3.5-flash-lite`

A integração utiliza o SDK `google-genai`, mantendo a chave privada exclusivamente no backend.

Principais configurações:

- Respostas estruturadas e validadas com Pydantic.
- Normalização de prioridades, tamanhos e ordenação das tarefas.
- Timeout padrão de 20 segundos.
- Uma tentativa por geração, sem retries automáticos.
- Limite de entrada de 2.000 tokens e saída de 2.500 tokens.
- Temperatura de geração de `0.3`.
- Tratamento de timeout, indisponibilidade e respostas inválidas.

### Controle de consumo e segurança

- Autenticação JWT e isolamento dos dados por usuário.
- Limites diários de tokens por usuário e globais.
- Reserva atômica e reconciliação do consumo.
- Expiração de reservas órfãs.
- Histórico de consumo no modelo `AIUsage`.
- Bloqueio manual da IA por `AI_ENABLED`.
- Tratamento de erros sem exposição de informações internas.

Os limites internos complementam as restrições da API Google Gemini, que pode retornar `429 Too Many Requests` quando a quota é excedida.

---

## Testes automatizados

O backend utiliza **pytest e Django TestCase** para validar autenticação, CRUD, persistência, permissões e integração com IA, utilizando um banco de testes isolado.

### Como executar

Na pasta `backend/`, com o ambiente virtual ativado:

**Testes gratuitos (Gemini simulado):**

```powershell
.\run_tests.ps1
```

**Teste com Gemini real:**

```powershell
.\run_tests.ps1 -LiveGemini
```

O teste real consome quota da API e permanece desabilitado por padrão.

### Relatórios

Gerados em `backend/reports/`:

| Arquivo | Descrição |
|---|---|
| `test-report.html` | Resultados e falhas dos testes |
| `htmlcov/index.html` | Cobertura de código |
| `coverage.xml` | Cobertura para ferramentas de CI |
| `junit.xml` | Resultados estruturados |
| `debug.log` | Logs e erros de execução |
| `gemini-live.html` | Teste real do Gemini |

Os relatórios são locais e não são versionados no Git.

### Integração contínua

O **GitHub Actions** executa automaticamente os testes gratuitos em pushes e pull requests nas branches configuradas, sem consumir tokens reais do Gemini.

---

## Status atual — Histórico de commits

### Commit 01 — Configuração do ambiente
- Estrutura inicial do Django REST Framework.
- Configuração de CORS, dependências e variáveis de ambiente.
- Implementação do endpoint de status.

### Commit 02 — Usuários e autenticação JWT
- Cadastro, login e renovação de tokens.
- Validação de credenciais e proteção de rotas.
- Endpoint de usuário autenticado.

### Commit 03 — Modelos de Projetos e Tarefas
- Criação dos modelos `Project` e `Task`.
- Definição de relacionamentos, status e prioridades.
- Implementação de serializers, migrações e Django Admin.

### Commit 04 — APIs CRUD de Projetos e Tarefas
- Endpoints REST para gerenciamento de projetos e tarefas.
- Atualização de status, prazos e estimativas.
- Cálculo automático do progresso dos projetos.
- Controle de acesso e testes de permissões.

### Commit 05 — Integração Gemini e Planejamento Inteligente
- Integração com Google Gemini e endpoint de geração.
- Validação de respostas JSON com Pydantic.
- Geração de cronogramas conforme prazo e disponibilidade.
- Controle de quotas, histórico de tokens e tratamento de erros.
- Planejamentos retornados sem persistência automática.

### Commit 06 — Testes automatizados e relatórios
- Implementação de testes com pytest e IA simulada.
- Testes de autenticação, CRUD, permissões e validações.
- Script `run_tests.ps1` e relatórios HTML/XML.
- Configuração de logs e cobertura de código.
- Integração com GitHub Actions.
- Teste real do Gemini executado com sucesso.