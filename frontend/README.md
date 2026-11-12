# TaskPilot — Frontend

Interface web do TaskPilot, desenvolvida com **React + Vite**.

## Status atual

**Commit inicial — Configuração do ambiente**

- Estrutura inicial do frontend criada.
- React e Vite configurados.
- Instalação do React Router, Axios, Bootstrap 5 e Bootstrap Icons.
- Configuração do Axios para comunicação com o backend Django.
- Integração inicial com o endpoint `/api/status/` para verificar a conexão.

## Como executar

**1.** Acesse a pasta do frontend:

```bash
cd frontend
```

**2.** Instale as dependências:

```bash
npm install
```

**3.** Configure o arquivo `.env` com base no `.env.example`.

**4.** Inicie o servidor:

```bash
npm run dev
```

Acesse: http://localhost:5173

> O backend precisa estar em execução para o teste de conexão funcionar.