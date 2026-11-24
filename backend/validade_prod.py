import sys
import uuid
import requests

BACKEND_URL = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://127.0.0.1:8000"
FRONTEND_URL = sys.argv[2].rstrip("/") if len(sys.argv) > 2 else "http://localhost:5173"


def run():
    print(f"Validando backend: {BACKEND_URL}")
    print(f"Validando CORS para origem: {FRONTEND_URL}\n")

    opt = requests.options(
        f"{BACKEND_URL}/api/projects/",
        headers={
            "Origin": FRONTEND_URL,
            "Access-Control-Request-Method": "GET",
        },
        timeout=15,
    )
    allow_origin = opt.headers.get("Access-Control-Allow-Origin", "")
    assert allow_origin in (FRONTEND_URL, "*"), f"Falha CORS: {allow_origin}"
    print("[OK] CORS configurado corretamente.")

    unauth = requests.get(f"{BACKEND_URL}/api/projects/", timeout=15)
    assert unauth.status_code in (401, 403), f"Esperado 401/403, recebido {unauth.status_code}"
    print("[OK] Proteção de rota autenticada (401/403).")

    
    suffix = uuid.uuid4().hex[:6]
    username = f"val_{suffix}"
    password = "ProdCheckPassword123!"

    reg = requests.post(
        f"{BACKEND_URL}/api/users/register/",
        json={"username": username, "email": f"{username}@example.com", "password": password},
        timeout=15,
    )
    assert reg.status_code in (200, 201), f"Falha no cadastro: {reg.status_code} {reg.text}"

    login = requests.post(
        f"{BACKEND_URL}/api/users/login/",
        json={"username": username, "password": password},
        timeout=15,
    )
    assert login.status_code == 200, f"Falha no login: {login.status_code} {login.text}"
    token = login.json().get("access") or login.json().get("token")
    assert token, "Token JWT não retornado no login."
    print("[OK] Autenticação (cadastro e login) validada.")

    # 4. Testa persistência criando e relendo um projeto
    headers = {"Authorization": f"Bearer {token}"}
    criado = requests.post(
        f"{BACKEND_URL}/api/projects/",
        json={"title": "Projeto Validação Produção", "description": "Teste de persistência"},
        headers=headers,
        timeout=15,
    )
    assert criado.status_code in (200, 201), f"Falha ao criar projeto: {criado.status_code}"

    listagem = requests.get(f"{BACKEND_URL}/api/projects/", headers=headers, timeout=15)
    assert any(p.get("title") == "Projeto Validação Produção" for p in listagem.json()), "Projeto não persistiu!"
    print("[OK] Persistência de dados validada.")

    not_found = requests.get(f"{BACKEND_URL}/api/projects/999999/", headers=headers, timeout=15)
    assert not_found.status_code == 404, f"Esperado 404, recebido {not_found.status_code}"
    print("[OK] Tratamento de HTTP 404 validado.")

    print("\nTodas as validações automáticas de produção passaram com sucesso!")


if __name__ == "__main__":
    run()