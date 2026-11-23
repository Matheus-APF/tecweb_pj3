import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

function Cadastro() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function criarConta(event) {
    event.preventDefault();
    setErro("");

    if (password !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (password.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      await api.post("/api/auth/register/", {
        username,
        email,
        password,
      });

      navigate("/login", {
        state: {
          mensagem: "Conta criada com sucesso! Agora faça seu login.",
        },
      });
    } catch (error) {
      const dados = error.response?.data;

      if (dados) {
        const mensagem = Object.entries(dados)
          .map(([campo, mensagens]) => {
            const texto = Array.isArray(mensagens)
              ? mensagens.join(" ")
              : mensagens;

            return `${campo}: ${texto}`;
          })
          .join(" ");

        setErro(mensagem);
      } else {
        setErro("Não foi possível criar sua conta. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          TaskPilot<span>.</span>
        </Link>

        <span className="auth-etiqueta">UM NOVO COMEÇO</span>

        <h1>Crie sua conta.</h1>
        <p>Organize suas ideias e comece a tirar seus planos do papel.</p>

        <form onSubmit={criarConta}>
          <label htmlFor="username">Nome de usuário</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="confirmarSenha">Confirmar senha</label>
          <input
            id="confirmarSenha"
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            autoComplete="new-password"
            required
          />

          {erro && <div className="auth-erro">{erro}</div>}

          <button type="submit" disabled={carregando}>
            {carregando ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div className="auth-alternativa">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}

export default Cadastro;