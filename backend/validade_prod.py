import sys
import uuid

import requests


BACKEND_URL = (
    sys.argv[1].rstrip("/")
    if len(sys.argv) > 1
    else "http://127.0.0.1:8000"
)
FRONTEND_URL = (
    sys.argv[2].rstrip("/")
    if len(sys.argv) > 2
    else "http://localhost:5173"
)


def verificar(condicao, mensagem):
    if not condicao:
        raise RuntimeError(mensagem)


def obter_lista_projetos(resposta):
    dados = resposta.json()

    if isinstance(dados, list):
        return dados

    if isinstance(dados, dict) and isinstance(dados.get("results"), list):
        return dados["results"]

    raise RuntimeError("A resposta da lista de projetos não tem o formato esperado.")


def run():
    print(f"Validando backend: {BACKEND_URL}")
    print(f"Validando CORS para origem: {FRONTEND_URL}\n")

    status = requests.get(
        f"{BACKEND_URL}/api/status/",
        timeout=15,
    )
    verificar(
        status.status_code == 200,
        f"Endpoint de status falhou: {status.status_code} {status.text}",
    )
    verificar(
        status.json().get("status") == "ok",
        "O endpoint de status não retornou status 'ok'.",
    )
    print("[OK] Backend respondeu ao endpoint de status.")

    preflight = requests.options(
        f"{BACKEND_URL}/api/projects/",
        headers={
            "Origin": FRONTEND_URL,
            "Access-Control-Request-Method": "GET",
        },
        timeout=15,
    )
    origem_permitida = preflight.headers.get(
        "Access-Control-Allow-Origin", ""
    )
    verificar(
        origem_permitida in (FRONTEND_URL, "*"),
        f"Falha de CORS. Origem permitida retornada: {origem_permitida!r}",
    )
    print("[OK] CORS permite a origem do frontend.")

    sem_login = requests.get(
        f"{BACKEND_URL}/api/projects/",
        timeout=15,
    )
    verificar(
        sem_login.status_code in (401, 403),
        "A rota de projetos deveria exigir login, "
        f"mas retornou {sem_login.status_code}.",
    )
    print("[OK] Rota de projetos exige autenticação.")

    identificador = uuid.uuid4().hex[:8]
    username = f"validacao_{identificador}"
    password = f"Validacao_{identificador}_123!"

    cadastro = requests.post(
        f"{BACKEND_URL}/api/auth/register/",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": password,
        },
        timeout=15,
    )
    verificar(
        cadastro.status_code in (200, 201),
        f"Falha no cadastro: {cadastro.status_code} {cadastro.text}",
    )

    login = requests.post(
        f"{BACKEND_URL}/api/auth/login/",
        json={
            "username": username,
            "password": password,
        },
        timeout=15,
    )
    verificar(
        login.status_code == 200,
        f"Falha no login: {login.status_code} {login.text}",
    )

    token = login.json().get("access")
    verificar(token, "O login não retornou um token de acesso.")
    print("[OK] Cadastro e login funcionaram.")

    cabecalhos = {"Authorization": f"Bearer {token}"}

    projeto = requests.post(
        f"{BACKEND_URL}/api/projects/",
        json={
            "title": f"Projeto de validação {identificador}",
            "description": "Projeto temporário para validar a integração.",
        },
        headers=cabecalhos,
        timeout=15,
    )
    verificar(
        projeto.status_code in (200, 201),
        f"Falha ao criar projeto: {projeto.status_code} {projeto.text}",
    )

    projeto_id = projeto.json().get("id")
    verificar(projeto_id, "A resposta de criação não retornou o ID do projeto.")

    listagem = requests.get(
        f"{BACKEND_URL}/api/projects/",
        headers=cabecalhos,
        timeout=15,
    )
    verificar(
        listagem.status_code == 200,
        f"Falha ao listar projetos: {listagem.status_code} {listagem.text}",
    )

    projetos = obter_lista_projetos(listagem)
    projeto_persistido = any(
        str(item.get("id")) == str(projeto_id)
        for item in projetos
    )
    verificar(
        projeto_persistido,
        "O projeto criado não apareceu na listagem.",
    )
    print("[OK] Criação e persistência de projeto funcionaram.")

    inexistente = requests.get(
        f"{BACKEND_URL}/api/projects/99999999/",
        headers=cabecalhos,
        timeout=15,
    )
    verificar(
        inexistente.status_code == 404,
        "A consulta de um projeto inexistente deveria retornar 404, "
        f"mas retornou {inexistente.status_code}.",
    )
    print("[OK] Projeto inexistente retorna HTTP 404.")

    exclusao = requests.delete(
        f"{BACKEND_URL}/api/projects/{projeto_id}/",
        headers=cabecalhos,
        timeout=15,
    )
    verificar(
        exclusao.status_code in (200, 204),
        f"Falha ao remover o projeto temporário: "
        f"{exclusao.status_code} {exclusao.text}",
    )
    print("[OK] Projeto temporário removido.")

    print("\nTodas as validações da integração passaram.")


if __name__ == "__main__":
    try:
        run()
    except requests.RequestException as erro:
        print(f"\nFalha de conexão com o backend: {erro}")
        sys.exit(1)
    except (RuntimeError, ValueError) as erro:
        print(f"\nValidação falhou: {erro}")
        sys.exit(1)