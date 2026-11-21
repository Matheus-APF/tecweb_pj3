import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../services/api";
import "./Projeto.css";

const nomesStatus = {
  todo: "To Do",
  doing: "Doing",
  done: "Feito",
};

function Projeto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const view = searchParams.get("view") === "backlog" ? "backlog" : "quadro";

  const [projeto, setProjeto] = useState(null);
  const [tarefas, setTarefas] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarProjeto() {
      const token = localStorage.getItem("taskpilot_access");

      if (!token) {
        setErro("Você precisa estar logada para ver este projeto.");
        setCarregando(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      try {
        const [respostaProjeto, respostaTarefas] = await Promise.all([
          api.get(`/api/projects/${id}/`, config),
          api.get(`/api/projects/${id}/tasks/`, config),
        ]);

        if (ativo) {
          setProjeto(respostaProjeto.data);
          setTarefas(respostaTarefas.data);
        }
      } catch (erroApi) {
        if (ativo) {
          setErro(
            erroApi.response?.data?.detail ||
              "Não foi possível carregar o projeto."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarProjeto();

    return () => {
      ativo = false;
    };
  }, [id]);

  function trocarVisualizacao(novaView) {
    const parametros = new URLSearchParams(searchParams);

    if (novaView === "quadro") {
      parametros.delete("view");
    } else {
      parametros.set("view", novaView);
    }

    setSearchParams(parametros);
  }

  async function moverTarefa(tarefa, novoStatus) {
    if (tarefa.status === novoStatus) return;

    const token = localStorage.getItem("taskpilot_access");
    const statusAntigo = tarefa.status;

    setErro("");
    setTarefas((atuais) =>
      atuais.map((item) =>
        item.id === tarefa.id ? { ...item, status: novoStatus } : item
      )
    );

    try {
      await api.patch(
        `/api/tasks/${tarefa.id}/`,
        { status: novoStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      setTarefas((atuais) =>
        atuais.map((item) =>
          item.id === tarefa.id ? { ...item, status: statusAntigo } : item
        )
      );
      setErro("Não foi possível atualizar o status da tarefa.");
    }
  }

  function soltarTarefa(event, status) {
    event.preventDefault();
    const tarefaId = Number(event.dataTransfer.getData("text/plain"));
    const tarefa = tarefas.find((item) => item.id === tarefaId);

    if (tarefa) moverTarefa(tarefa, status);
  }

  const tarefasFiltradas = tarefas.filter((tarefa) => {
    const correspondeBusca = tarefa.title
      .toLowerCase()
      .includes(busca.toLowerCase());

    const correspondeStatus =
      filtroStatus === "todos" || tarefa.status === filtroStatus;

    return correspondeBusca && correspondeStatus;
  });

  if (carregando) {
    return <main className="projeto-estado">Carregando projeto...</main>;
  }

  if (erro && !projeto) {
    return (
      <main className="projeto-estado">
        <p className="projeto-erro">{erro}</p>
        <button onClick={() => navigate(-1)}>Voltar</button>
      </main>
    );
  }

  if (!projeto) return null;

  return (
    <main className="projeto-page">
      <header className="projeto-topbar">
        <button className="projeto-voltar" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" /> Voltar
        </button>
        <strong>TaskPilot</strong>
      </header>

      <section className="projeto-container">
        <div className="projeto-cabecalho">
          <div>
            <p className="projeto-etiqueta">MEU PROJETO</p>
            <h1>{projeto.title}</h1>
            {projeto.description && <p>{projeto.description}</p>}
          </div>
          <div className="projeto-contagem">
            {tarefas.length} {tarefas.length === 1 ? "tarefa" : "tarefas"}
          </div>
        </div>

        <div className="progresso-area">
          <div className="progresso-texto">
            <span>Progresso</span>
            <strong>{projeto.progress ?? 0}%</strong>
          </div>
          <div className="progresso-trilho">
            <span style={{ width: `${projeto.progress ?? 0}%` }} />
          </div>
        </div>

        <nav className="projeto-abas">
          <button
            className={view === "quadro" ? "ativa" : ""}
            onClick={() => trocarVisualizacao("quadro")}
          >
            <i className="bi bi-kanban" /> Quadro
          </button>
          <button
            className={view === "backlog" ? "ativa" : ""}
            onClick={() => trocarVisualizacao("backlog")}
          >
            <i className="bi bi-list-task" /> Backlog
          </button>
        </nav>

        {erro && <p className="projeto-erro">{erro}</p>}

        {tarefas.length === 0 ? (
          <div className="projeto-vazio">
            <i className="bi bi-inbox" />
            <h2>Este projeto ainda não tem tarefas</h2>
            <p>As tarefas do plano aparecerão aqui depois que forem salvas.</p>
          </div>
        ) : view === "quadro" ? (
          <>
            <p className="dica-quadro">
              Arraste uma tarefa para outra coluna para atualizar o status.
            </p>

            <div className="kanban">
              {Object.entries(nomesStatus).map(([status, nome]) => {
                const tarefasDaColuna = tarefas.filter(
                  (tarefa) => tarefa.status === status
                );

                return (
                  <section
                    className="kanban-coluna"
                    key={status}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => soltarTarefa(event, status)}
                  >
                    <header>
                      <strong>{nome}</strong>
                      <span>{tarefasDaColuna.length}</span>
                    </header>

                    {tarefasDaColuna.map((tarefa) => (
                      <article
                        className="kanban-tarefa"
                        key={tarefa.id}
                        draggable
                        onDragStart={(event) =>
                          event.dataTransfer.setData(
                            "text/plain",
                            String(tarefa.id)
                          )
                        }
                      >
                        <strong>{tarefa.title}</strong>
                        {tarefa.description && <p>{tarefa.description}</p>}
                        <div className="kanban-meta">
                          <span>{tarefa.priority}</span>
                          {tarefa.due_date && <span>{tarefa.due_date}</span>}
                        </div>
                      </article>
                    ))}
                  </section>
                );
              })}
            </div>
          </>
        ) : (
          <section className="backlog">
            <div className="backlog-filtros">
              <input
                type="search"
                placeholder="Buscar tarefa..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />

              <select
                value={filtroStatus}
                onChange={(event) => setFiltroStatus(event.target.value)}
              >
                <option value="todos">Todos os status</option>
                <option value="todo">To Do</option>
                <option value="doing">Doing</option>
                <option value="done">Feito</option>
              </select>
            </div>

            {tarefasFiltradas.length === 0 ? (
              <p className="backlog-vazio">Nenhuma tarefa encontrada.</p>
            ) : (
              <div className="tabela-responsiva">
                <table>
                  <thead>
                    <tr>
                      <th>Tarefa</th>
                      <th>Status</th>
                      <th>Prioridade</th>
                      <th>Prazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarefasFiltradas.map((tarefa) => (
                      <tr key={tarefa.id}>
                        <td>{tarefa.title}</td>
                        <td>{nomesStatus[tarefa.status]}</td>
                        <td>{tarefa.priority}</td>
                        <td>{tarefa.due_date || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

export default Projeto;