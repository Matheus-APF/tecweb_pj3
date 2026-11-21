import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./NovoObjetivo.css";

function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function NovoObjetivo() {
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  const limiteMaximo = new Date();
  limiteMaximo.setDate(hoje.getDate() + 365);

  const [formulario, setFormulario] = useState({
    title: "",
    description: "",
    deadline: "",
    daily_hours: "",
    level: "beginner",
  });

  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const navigate = useNavigate();

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((atual) => ({
      ...atual,
      [name]: value,
    }));

    setMensagemErro("");
    setMensagemSucesso("");
  }

  async function enviarFormulario(event) {
    event.preventDefault();
    setMensagemErro("");
    setMensagemSucesso("");

    const token = localStorage.getItem("taskpilot_access");

    if (!token) {
      setMensagemErro(
        "Você precisa estar logada para gerar um plano. A tela de login ainda precisa salvar o token de acesso."
      );
      return;
    }

    setCarregando(true);

    try {
      const resposta = await api.post(
        "/api/ai/generate-plan/",
        {
          ...formulario,
          daily_hours: Number(formulario.daily_hours),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      sessionStorage.setItem(
        "taskpilot_plan_preview",
        JSON.stringify(resposta.data)
      );

      setMensagemSucesso(
        `Plano gerado com ${resposta.data.tasks.length} tarefas! Na próxima etapa, vamos montar a tela de prévia.`
      );
    } catch (erro) {
      const detalhe = erro.response?.data?.detail;

      if (erro.response?.status === 401) {
        setMensagemErro("Sua sessão expirou ou o token de acesso é inválido.");
      } else {
        setMensagemErro(
          detalhe || "Não foi possível gerar o plano. Tente novamente."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="objetivo-page">
      <header className="objetivo-topbar">
        <button
          className="voltar-button"
          type="button"
          onClick={() => navigate("/")}
        >
          <i className="bi bi-arrow-left" /> Voltar
        </button>

        <span className="topbar-titulo">TaskPilot</span>
        <span className="topbar-etapa">Novo objetivo</span>
      </header>

      <section className="objetivo-container">
        <div className="objetivo-intro">
          <span className="objetivo-etiqueta">PLANEJAMENTO INTELIGENTE</span>
          <h1>O que você quer alcançar?</h1>
          <p>
            Conte um pouco sobre seu objetivo. Vamos usar essas informações
            para montar um plano de tarefas que combine com sua rotina.
          </p>
        </div>

        <form className="objetivo-form" onSubmit={enviarFormulario}>
          <label htmlFor="title">Nome do objetivo</label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="Ex.: Aprender React"
            value={formulario.title}
            onChange={atualizarCampo}
            minLength={3}
            maxLength={200}
            required
          />

          <label htmlFor="description">Descrição</label>
          <textarea
            id="description"
            name="description"
            placeholder="O que você quer aprender ou realizar?"
            value={formulario.description}
            onChange={atualizarCampo}
            minLength={10}
            maxLength={2000}
            rows={4}
            required
          />
          <span className="campo-ajuda">
            Descreva seu objetivo com pelo menos 10 caracteres.
          </span>

          <div className="campos-linha">
            <div className="campo-grupo">
              <label htmlFor="deadline">Prazo final</label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                min={formatarData(amanha)}
                max={formatarData(limiteMaximo)}
                value={formulario.deadline}
                onChange={atualizarCampo}
                required
              />
            </div>

            <div className="campo-grupo">
              <label htmlFor="daily_hours">Disponibilidade por dia</label>
              <div className="input-com-sufixo">
                <input
                  id="daily_hours"
                  name="daily_hours"
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  placeholder="2"
                  value={formulario.daily_hours}
                  onChange={atualizarCampo}
                  required
                />
                <span>horas</span>
              </div>
            </div>
          </div>

          <label htmlFor="level">Seu nível atual</label>
          <select
            id="level"
            name="level"
            value={formulario.level}
            onChange={atualizarCampo}
            required
          >
            <option value="beginner">Iniciante</option>
            <option value="intermediate">Intermediário</option>
            <option value="advanced">Avançado</option>
          </select>

          {mensagemErro && (
            <div className="mensagem mensagem-erro" role="alert">
              <i className="bi bi-exclamation-circle" />
              {mensagemErro}
            </div>
          )}

          {mensagemSucesso && (
            <div className="mensagem mensagem-sucesso" role="status">
              <i className="bi bi-check-circle" />
              {mensagemSucesso}
            </div>
          )}

          <button
            className="gerar-button"
            type="submit"
            disabled={carregando}
          >
            {carregando ? (
              <>
                <span className="spinner" />
                Gerando seu plano...
              </>
            ) : (
              <>
                <i className="bi bi-stars" />
                Gerar plano com IA
              </>
            )}
          </button>

          <p className="aviso-ia">
            Você poderá revisar o plano antes de salvar o projeto.
          </p>
        </form>
      </section>
    </main>
  );
}

export default NovoObjetivo;