# TaskPilot — Backend

API REST do TaskPilot, desenvolvida com **Python, Django e Django REST Framework**.

## Status atual

**Commit inicial — Configuração do ambiente**

- Estrutura inicial do projeto Django criada.
- Django REST Framework configurado.
- Configuração de CORS para comunicação com o frontend React.
- Variáveis de ambiente configuradas com `python-dotenv`.
- Criação do aplicativo `core`.
- Implementação do endpoint `GET /api/status/` para verificar o funcionamento da API.
- Configuração inicial das dependências em `requirements.txt`.

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