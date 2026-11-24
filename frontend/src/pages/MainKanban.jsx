import { useEffect, useState } from "react";
import api from "../services/api";
import "./MainKanban.css";

const nomesStatus = {
  todo: "To Do",
  doing: "Doing",
  done: "Feito",
};

const nomesPrioridade = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

function MainKanban({ projetos, onProgressoAtualizado }) {
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizando, setAtualizando] = useState([]);

  useEffect(() => {
    let ativo = true;

    async function carregarTarefas() {
      const token = localStorage.getItem("taskpilot_access");

      if (!token) {
        setErro("Você precisa estar logada para visualizar as tarefas.");
        setCarregando(false);
        return;
      }

      if (projetos.length === 0) {
        setTarefas([]);
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro("");

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const resultados = await Promise.allSettled(
        projetos.map(async (projeto) => {
          const resposta = await api.get(
            `/api/projects/${projeto.id}/tasks/`,
            config
          );

          const dados = Array.isArray(resposta.data)
            ? resposta.data
            : resposta.data.results || [];

          return dados.map((tarefa) => ({
            ...tarefa,
            project_id: projeto.id,
            project_title: projeto.title,
            project_color: projeto.color || "#567565",
          }));
        })
      );

      if (!ativo) return;

      const tarefasCarregadas = resultados.flatMap((resultado) =>
        resultado.status === "fulfilled" ? resultado.value : []
      );

      setTarefas(tarefasCarregadas);

      if (resultados.some((resultado) => resultado.status === "rejected")) {
        setErro("Algumas tarefas não puderam ser carregadas.");
      }

      setCarregando(false);
    }

    carregarTarefas();

    return () => {
      ativo = false;
    };
  }, [projetos]);

  function obterHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function obterPrazo(tarefa) {
    if (!tarefa.due_date || tarefa.status === "done") return "";

    if (tarefa.due_date < obterHoje()) return "Atrasada";
    if (tarefa.due_date === obterHoje()) return "Hoje";

    return "";
  }

  function formatarData(data) {
    if (!data) return "Sem prazo";

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function calcularProgresso(projetoId, listaTarefas) {
    const tarefasDoProjeto = listaTarefas.filter(
      (tarefa) => String(tarefa.project_id) === String(projetoId)
    );

    if (tarefasDoProjeto.length === 0) return 0;

    const tarefasConcluidas = tarefasDoProjeto.filter(
      (tarefa) => tarefa.status === "done"
    ).length;

    return Math.round(
      (tarefasConcluidas / tarefasDoProjeto.length) * 100
    );
  }

  async function moverTarefa(tarefa, novoStatus) {
    if (tarefa.status === novoStatus) return;

    const token = localStorage.getItem("taskpilot_access");
    const statusAntigo = tarefa.status;

    const tarefasAtualizadas = tarefas.map((item) =>
      item.id === tarefa.id
        ? { ...item, status: novoStatus }
        : item
    );

    setErro("");
    setAtualizando((atuais) => [...atuais, tarefa.id]);
    setTarefas(tarefasAtualizadas);

    const progressoNovo = calcularProgresso(
      tarefa.project_id,
      tarefasAtualizadas
    );

    onProgressoAtualizado?.(tarefa.project_id, progressoNovo);

    try {
      await api.patch(
        `/api/tasks/${tarefa.id}/`,
        { status: novoStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch {
      const tarefasRestauradas = tarefasAtualizadas.map((item) =>
        item.id === tarefa.id
          ? { ...item, status: statusAntigo }
          : item
      );

      setTarefas(tarefasRestauradas);

      const progressoRestaurado = calcularProgresso(
        tarefa.project_id,
        tarefasRestauradas
      );

      onProgressoAtualizado?.(
        tarefa.project_id,
        progressoRestaurado
      );

      setErro("Não foi possível atualizar o status da tarefa.");
    } finally {
      setAtualizando((atuais) =>
        atuais.filter((id) => id !== tarefa.id)
      );
    }
  }

  function iniciarArraste(event, tarefa) {
    event.dataTransfer.setData("text/plain", String(tarefa.id));
    event.dataTransfer.effectAllowed = "move";
  }

  function soltarTarefa(event, novoStatus) {
    event.preventDefault();

    const tarefaId = Number(event.dataTransfer.getData("text/plain"));
    const tarefa = tarefas.find((item) => item.id === tarefaId);

    if (tarefa) moverTarefa(tarefa, novoStatus);
  }

  const tarefasHoje = tarefas.filter(
    (tarefa) => obterPrazo(tarefa) === "Hoje"
  );

  const tarefasAtrasadas = tarefas.filter(
    (tarefa) => obterPrazo(tarefa) === "Atrasada"
  );

  if (carregando) {
    return (
      <section className="main-kanban">
        <p className="main-kanban-mensagem">
          Carregando suas tarefas...
        </p>
      </section>
    );
  }

  return (
    <section className="main-kanban">
      <div className="main-kanban-titulo">
        <div>
          <span className="main-etiqueta">SEU DIA A DIA</span>
          <h2>Quadro de tarefas</h2>
          <p>Um panorama do que está acontecendo em todos os projetos.</p>
        </div>
      </div>

      <div className="main-kanban-resumo">
        <div>
          <strong>{tarefasHoje.length}</strong>
          <span>Para hoje</span>
        </div>

        <div>
          <strong>{tarefasAtrasadas.length}</strong>
          <span>Atrasadas</span>
        </div>
      </div>

      {erro && (
        <p className="main-kanban-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="main-kanban-colunas">
        {Object.entries(nomesStatus).map(([status, nome]) => {
          const tarefasDaColuna = tarefas.filter(
            (tarefa) => tarefa.status === status
          );

          return (
            <section
              className={`main-kanban-coluna coluna-${status}`}
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => soltarTarefa(event, status)}
            >
              <header className="main-kanban-coluna-header">
                <strong>{nome}</strong>
                <span>{tarefasDaColuna.length}</span>
              </header>

              {tarefasDaColuna.length === 0 && (
                <p className="main-kanban-coluna-vazia">
                  Nenhuma tarefa aqui.
                </p>
              )}

              {tarefasDaColuna.map((tarefa) => {
                const prazo = obterPrazo(tarefa);

                return (
                  <article
                    className="main-kanban-card"
                    key={tarefa.id}
                    draggable
                    onDragStart={(event) =>
                      iniciarArraste(event, tarefa)
                    }
                    style={{
                      "--task-color": tarefa.project_color,
                    }}
                  >
                    <div className="main-kanban-projeto">
                      <span></span>
                      {tarefa.project_title}
                    </div>

                    <strong>{tarefa.title}</strong>

                    {tarefa.description && (
                      <p>{tarefa.description}</p>
                    )}

                    <div className="main-kanban-card-footer">
                      <span>
                        {nomesPrioridade[tarefa.priority] ||
                          tarefa.priority}
                      </span>

                      <span>{formatarData(tarefa.due_date)}</span>
                    </div>

                    {prazo && (
                      <span
                        className={`main-kanban-prazo ${
                          prazo === "Atrasada" ? "atrasada" : "hoje"
                        }`}
                      >
                        {prazo}
                      </span>
                    )}

                    <select
                      value={tarefa.status}
                      disabled={atualizando.includes(tarefa.id)}
                      onChange={(event) =>
                        moverTarefa(tarefa, event.target.value)
                      }
                      aria-label={`Alterar status de ${tarefa.title}`}
                    >
                      <option value="todo">To Do</option>
                      <option value="doing">Doing</option>
                      <option value="done">Feito</option>
                    </select>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </section>
  );
}

export default MainKanban;