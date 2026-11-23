import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin(event) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await api.post("/api/auth/login/", {
        username,
        password,
      });

      localStorage.setItem("taskpilot_access", resposta.data.access);
      localStorage.setItem("taskpilot_refresh", resposta.data.refresh);

      navigate("/");
    } catch (error) {
      if (error.response?.status === 401) {
        setErro("Usuário ou senha incorretos.");
      } else {
        setErro("Não foi possível conectar ao servidor. Tente novamente.");
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

        <span className="auth-etiqueta">BOM TER VOCÊ DE VOLTA</span>

        <h1>Vamos entrar?</h1>
        <p>Acesse sua conta e continue de onde parou.</p>

        {location.state?.mensagem && (
          <div className="auth-sucesso">
            {location.state.mensagem}
          </div>
        )}

        <form onSubmit={fazerLogin}>
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {erro && <div className="auth-erro">{erro}</div>}

          <button type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="auth-alternativa">
          Ainda não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;