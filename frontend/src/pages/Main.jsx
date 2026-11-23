import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import MainKanban from "./MainKanban";
import "./Main.css";

const CORES_PROJETO = [
  "#567565",
  "#D98267",
  "#4777B9",
  "#C49A55",
  "#8B789F",
  "#6E9290",
];

function Main() {
  const [projetos, setProjetos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [expandidos, setExpandidos] = useState([]);
  const [atualizando, setAtualizando] = useState([]);
  const [coresAtualizando, setCoresAtualizando] = useState([]);

  useEffect(() => {
    async function carregarProjetos() {
      const token = localStorage.getItem("taskpilot_access");

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
      } catch {
        setErro("Não foi possível carregar seus projetos.");
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

  async function alterarStatus(projeto) {
    const token = localStorage.getItem("taskpilot_access");
    const novoStatus = projeto.is_active === false;

    setErro("");
    setAtualizando((atuais) => [...atuais, projeto.id]);

    try {
      await api.patch(
        `/api/projects/${projeto.id}/`,
        { is_active: novoStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjetos((atuais) =>
        atuais.map((item) =>
          item.id === projeto.id
            ? { ...item, is_active: novoStatus }
            : item
        )
      );
    } catch {
      setErro("Não foi possível alterar o status do projeto.");
    } finally {
      setAtualizando((atuais) =>
        atuais.filter((id) => id !== projeto.id)
      );
    }
  }

  async function alterarCorProjeto(projeto, novaCor) {
    if (projeto.color === novaCor) return;

    const token = localStorage.getItem("taskpilot_access");

    setErro("");
    setCoresAtualizando((atuais) => [...atuais, projeto.id]);

    try {
      await api.patch(
        `/api/projects/${projeto.id}/`,
        { color: novaCor },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjetos((atuais) =>
        atuais.map((item) =>
          item.id === projeto.id
            ? { ...item, color: novaCor }
            : item
        )
      );
    } catch {
      setErro("Não foi possível alterar a cor do projeto.");
    } finally {
      setCoresAtualizando((atuais) =>
        atuais.filter((id) => id !== projeto.id)
      );
    }
  }

  function renderProjetos(lista) {
    if (lista.length === 0) {
      return (
        <div className="main-vazio">
          <i className="bi bi-journal-plus"></i>
          <h3>Nenhum projeto por aqui.</h3>
        </div>
      );
    }

    return (
      <div className="main-lista">
        {lista.map((projeto) => {
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
                  <small>{projeto.tasks_count || 0} tarefas</small>
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
                    {projeto.description ||
                      "Nenhuma descrição informada."}
                  </p>

                  <span>
                    Prazo: {formatarData(projeto.due_date)}
                  </span>

                  <div className="main-projeto-acoes">
                    <Link to={`/projetos/${projeto.id}`}>
                      Abrir projeto
                      <i className="bi bi-arrow-up-right"></i>
                    </Link>

                    <button
                      className="main-status-button"
                      onClick={() => alterarStatus(projeto)}
                      disabled={atualizando.includes(projeto.id)}
                    >
                      {atualizando.includes(projeto.id)
                        ? "Atualizando..."
                        : projeto.is_active === false
                        ? "Ativar projeto"
                        : "Desativar projeto"}
                    </button>
                  </div>

                  <div className="main-projeto-cores">
                    <span>Cor do projeto</span>

                    <div className="main-projeto-paleta">
                      {CORES_PROJETO.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          disabled={coresAtualizando.includes(projeto.id)}
                          className={
                            projeto.color === cor ? "selecionada" : ""
                          }
                          style={{ backgroundColor: cor }}
                          onClick={() =>
                            alterarCorProjeto(projeto, cor)
                          }
                          aria-label={`Alterar cor para ${cor}`}
                          aria-pressed={projeto.color === cor}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  }

  const projetosAtivos = projetos.filter(
    (projeto) => projeto.is_active !== false
  );

  const projetosInativos = projetos.filter(
    (projeto) => projeto.is_active === false
  );

  const totalTarefas = projetosAtivos.reduce(
    (total, projeto) => total + (projeto.tasks_count || 0),
    0
  );

  const progressoMedio = projetosAtivos.length
    ? Math.round(
        projetosAtivos.reduce(
          (total, projeto) => total + (projeto.progress || 0),
          0
        ) / projetosAtivos.length
      )
    : 0;

  if (carregando) {
    return (
      <div className="main-loading">
        Carregando seus projetos...
      </div>
    );
  }

  return (
    <div className="main-page">
      <section className="main-intro">
        <div>
          <span className="main-etiqueta">SUA ROTINA, SEU RITMO</span>

          <h1>O que está nos seus planos?</h1>

          <p>
            Seus projetos, suas prioridades e tudo o que você já
            conquistou até aqui.
          </p>
        </div>

        <Link to="/objetivos/novo" className="main-novo-button">
          <i className="bi bi-plus-lg"></i>
          Novo objetivo
        </Link>
      </section>

      {erro && (
        <div className="main-message">
          {erro}
        </div>
      )}

      <section className="main-resumo">
        <div className="main-resumo-item">
          <span>Projetos ativos</span>
          <strong>{projetosAtivos.length}</strong>
        </div>

        <div className="main-resumo-item">
          <span>Tarefas em projetos ativos</span>
          <strong>{totalTarefas}</strong>
        </div>

        <div className="main-resumo-item">
          <span>Progresso médio</span>
          <strong>{progressoMedio}%</strong>
        </div>
      </section>

      <section className="main-projetos">
        <div className="main-section-title">
          <div>
            <span className="main-etiqueta">EM ANDAMENTO</span>
            <h2>Projetos ativos</h2>
          </div>

          <span className="main-projetos-count">
            {projetosAtivos.length} projetos
          </span>
        </div>

        {renderProjetos(projetosAtivos)}
      </section>

      <MainKanban projetos={projetos} />

      <section className="main-projetos main-projetos-inativos">
        <div className="main-section-title">
          <div>
            <span className="main-etiqueta">
              GUARDADOS POR ENQUANTO
            </span>
            <h2>Projetos inativos</h2>
          </div>

          <span className="main-projetos-count">
            {projetosInativos.length} projetos
          </span>
        </div>

        {renderProjetos(projetosInativos)}
      </section>
    </div>
  );
}

export default Main;