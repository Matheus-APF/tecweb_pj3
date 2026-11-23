import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Main.css";

function Main() {
  const [projetos, setProjetos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [expandidos, setExpandidos] = useState([]);

  useEffect(() => {
    async function carregarProjetos() {
      const token = localStorage.getItem("taskpilot_access");

      if (!token) {
        setErro("Faça login para visualizar seus projetos.");
        setCarregando(false);
        return;
      }

      try {
        const resposta = await api.get("/api/projects/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const dados = Array.isArray(resposta.data)
          ? resposta.data
          : resposta.data.results || [];

        setProjetos(dados);
      } catch (erroApi) {
        setErro(
          erroApi.response?.status === 401
            ? "Sua sessão expirou. Faça login novamente."
            : "Não foi possível carregar seus projetos."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarProjetos();
  }, []);

  function alternarProjeto(id) {
    setExpandidos((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    );
  }

  function formatarData(data) {
    if (!data) return "Sem prazo definido";

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const totalTarefas = projetos.reduce(
    (total, projeto) => total + (projeto.tasks_count || 0),
    0
  );

  const progressoMedio = projetos.length
    ? Math.round(
        projetos.reduce(
          (total, projeto) => total + (projeto.progress || 0),
          0
        ) / projetos.length
      )
    : 0;

  if (carregando) {
    return <div className="main-loading">Carregando seus projetos...</div>;
  }

  return (
    <div className="main-page">
      <section className="main-intro">
        <div>
          <span className="main-etiqueta">SUA ROTINA, SEU RITMO</span>
          <h1>O que está nos seus planos?</h1>
          <p>Acompanhe seus objetivos e veja o quanto você já avançou.</p>
        </div>

        <Link to="/objetivos/novo" className="main-novo-button">
          <i className="bi bi-plus-lg"></i>
          Novo objetivo
        </Link>
      </section>

      {erro && <div className="main-message">{erro}</div>}

      <section className="main-resumo">
        <div className="main-resumo-item">
          <span>Projetos ativos</span>
          <strong>{projetos.length}</strong>
        </div>

        <div className="main-resumo-item">
          <span>Tarefas no total</span>
          <strong>{totalTarefas}</strong>
        </div>

        <div className="main-resumo-item">
          <span>Progresso médio</span>
          <strong>{progressoMedio}%</strong>
        </div>
      </section>

      <section className="main-projetos" id="projetos">
        <div className="main-section-title">
          <div>
            <span className="main-etiqueta">SEUS OBJETIVOS</span>
            <h2>Seus projetos</h2>
          </div>

          <span className="main-projetos-count">
            {projetos.length} {projetos.length === 1 ? "projeto" : "projetos"}
          </span>
        </div>

        {!erro && projetos.length === 0 ? (
          <div className="main-vazio">
            <i className="bi bi-journal-plus"></i>
            <h3>Por onde vamos começar?</h3>
            <p>
              Você ainda não tem projetos. Crie seu primeiro objetivo e
              organize os próximos passos.
            </p>
            <Link to="/objetivos/novo">Criar meu primeiro objetivo</Link>
          </div>
        ) : (
          <div className="main-lista">
            {projetos.map((projeto) => {
              const expandido = expandidos.includes(projeto.id);

              return (
                <article
                  className={`main-projeto ${expandido ? "expandido" : ""}`}
                  key={projeto.id}
                  style={{
                    "--project-color": projeto.color || "#567565",
                  }}
                >
                  <button
                    className="main-projeto-trigger"
                    onClick={() => alternarProjeto(projeto.id)}
                    aria-expanded={expandido}
                  >
                    <span className="main-projeto-cor"></span>

                    <span className="main-projeto-info">
                      <strong>{projeto.title}</strong>
                      <small>
                        {projeto.tasks_count}{" "}
                        {projeto.tasks_count === 1 ? "tarefa" : "tarefas"}
                      </small>
                    </span>

                    <span className="main-projeto-progresso">
                      <span>{projeto.progress || 0}%</span>
                      <span className="main-barra">
                        <span
                          style={{
                            width: `${projeto.progress || 0}%`,
                          }}
                        ></span>
                      </span>
                    </span>

                    <i
                      className={`bi ${
                        expandido ? "bi-chevron-up" : "bi-chevron-down"
                      }`}
                    ></i>
                  </button>

                  {expandido && (
                    <div className="main-projeto-detalhes">
                      <p>
                        {projeto.description || "Nenhuma descrição informada."}
                      </p>

                      <span>
                        Prazo: {formatarData(projeto.due_date)}
                      </span>

                      <Link to={`/projetos/${projeto.id}`}>
                        Abrir projeto
                        <i className="bi bi-arrow-up-right"></i>
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Main;