
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./PreviaPlano.css";

const CORES_PROJETO = [
  "#567565",
  "#D98267",
  "#4777B9",
  "#C49A55",
  "#8B789F",
  "#6E9290",
];

function lerPreviaSalva() {
  try {
    return JSON.parse(sessionStorage.getItem("taskpilot_plan_preview"));
  } catch {
    return null;
  }
}

function PreviaPlano() {
  const navigate = useNavigate();
  const [previa] = useState(lerPreviaSalva);
  const [tarefas, setTarefas] = useState(previa?.plan?.tasks || []);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [corProjeto, setCorProjeto] = useState(CORES_PROJETO[0]);

  useEffect(() => {
    async function sugerirCor() {
      const token = localStorage.getItem("taskpilot_access");

      try {
        const resposta = await api.get("/api/projects/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const projetos = Array.isArray(resposta.data)
          ? resposta.data
          : resposta.data.results || [];

        const coresUsadas = projetos.map((projeto) =>
          projeto.color?.toLowerCase()
        );

        const corLivre = CORES_PROJETO.find(
          (cor) => !coresUsadas.includes(cor.toLowerCase())
        );

        setCorProjeto(
          corLivre ||
            CORES_PROJETO[projetos.length % CORES_PROJETO.length]
        );
      } catch {
        setCorProjeto(CORES_PROJETO[0]);
      }
    }

    sugerirCor();
  }, []);

  function atualizarTarefa(indice, campo, valor) {
    setTarefas((atuais) =>
      atuais.map((tarefa, i) =>
        i === indice ? { ...tarefa, [campo]: valor } : tarefa
      )
    );
  }

  function removerTarefa(indice) {
    setTarefas((atuais) => atuais.filter((_, i) => i !== indice));
  }

  function adicionarTarefa() {
    setTarefas((atuais) => [
      ...atuais,
      {
        title: "",
        description: "",
        priority: "medium",
        size: "M",
        estimated_hours: 1,
        due_date: previa?.objective?.deadline || "",
        order: atuais.length + 1,
      },
    ]);
  }

  async function confirmarPlano() {
    setErro("");

    const token = localStorage.getItem("taskpilot_access");

    if (!token) {
      setErro("Você precisa estar logada para salvar o projeto.");
      return;
    }

    if (
      tarefas.length === 0 ||
      tarefas.some((tarefa) => !tarefa.title.trim())
    ) {
      setErro("Adicione pelo menos uma tarefa e preencha o título de todas.");
      return;
    }

    setSalvando(true);

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const respostaProjeto = await api.post(
        "/api/projects/",
        {
          title: previa.plan.title,
          description: previa.objective.description,
          color: corProjeto,
          due_date: previa.objective.deadline,
          notes: "",
        },
        config
      );

      const projetoId = respostaProjeto.data.id;

      for (const tarefa of tarefas) {
        await api.post(
          `/api/projects/${projetoId}/tasks/`,
          {
            title: tarefa.title,
            description: tarefa.description || "",
            status: "todo",
            priority: tarefa.priority,
            size: tarefa.size,
            estimated_hours: tarefa.estimated_hours,
            due_date: tarefa.due_date || null,
            notes: "",
          },
          config
        );
      }

      sessionStorage.removeItem("taskpilot_plan_preview");
      navigate(`/projetos/${projetoId}`);
    } catch (error) {
      setErro(
        error.response?.data?.detail ||
          "Não foi possível salvar o projeto. Confira sua conexão e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (!previa?.plan || !previa?.objective) {
    return (
      <main className="previa-page">
        <section className="previa-vazia">
          <h1>Nenhum plano para revisar</h1>
          <p>
            Gere um plano primeiro para poder conferir e salvar as tarefas.
          </p>
          <button onClick={() => navigate("/objetivos/novo")}>
            Voltar para o objetivo
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="previa-page">
      <header className="previa-topbar">
        <button
          className="previa-voltar"
          onClick={() => navigate("/objetivos/novo")}
        >
          <i className="bi bi-arrow-left" /> Voltar
        </button>

        <strong>TaskPilot</strong>
        <span>Prévia do plano</span>
      </header>

      <section className="previa-container">
        <p className="previa-etiqueta">PLANO SUGERIDO</p>

        <h1>{previa.plan.title}</h1>

        <p className="previa-descricao">
          Revise as tarefas antes de salvar o projeto.
        </p>

        <div className="previa-resumo">
          <span>
            <i className="bi bi-calendar3" />
            Prazo: {previa.objective.deadline}
          </span>

          <span>
            <i className="bi bi-clock" />
            {previa.objective.daily_hours}h disponíveis por dia
          </span>
        </div>

        <div className="previa-cor">
          <div className="previa-cor-info">
            <strong>Escolha uma cor para seu projeto</strong>
            <span>
              Ela vai identificar seu projeto e suas tarefas.
            </span>
          </div>

          <div className="previa-paleta">
            {CORES_PROJETO.map((cor) => (
              <button
                key={cor}
                type="button"
                className={corProjeto === cor ? "selecionada" : ""}
                style={{ backgroundColor: cor }}
                onClick={() => setCorProjeto(cor)}
                aria-label={`Selecionar cor ${cor}`}
                aria-pressed={corProjeto === cor}
                title={`Selecionar cor ${cor}`}
              >
                {corProjeto === cor && (
                  <i className="bi bi-check2"></i>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="previa-lista">
          {tarefas.map((tarefa, indice) => (
            <article className="previa-tarefa" key={indice}>
              <div className="previa-tarefa-topo">
                <span className="previa-numero">
                  {String(indice + 1).padStart(2, "0")}
                </span>

                <button
                  className="remover-tarefa"
                  type="button"
                  onClick={() => removerTarefa(indice)}
                  aria-label="Remover tarefa"
                  title="Remover tarefa"
                >
                  <i className="bi bi-trash" />
                </button>
              </div>

              <label htmlFor={`titulo-${indice}`}>
                Tarefa
              </label>

              <input
                id={`titulo-${indice}`}
                value={tarefa.title}
                onChange={(event) =>
                  atualizarTarefa(indice, "title", event.target.value)
                }
                maxLength={200}
              />

              <label htmlFor={`descricao-${indice}`}>
                Descrição
              </label>

              <textarea
                id={`descricao-${indice}`}
                value={tarefa.description || ""}
                onChange={(event) =>
                  atualizarTarefa(
                    indice,
                    "description",
                    event.target.value
                  )
                }
                rows={2}
                maxLength={1500}
              />

              <div className="previa-detalhes">
                <span>
                  <i className="bi bi-clock" /> {tarefa.estimated_hours}h
                </span>

                <span>Prioridade: {tarefa.priority}</span>
                <span>Tamanho: {tarefa.size}</span>

                {tarefa.due_date && (
                  <span>Prazo: {tarefa.due_date}</span>
                )}
              </div>
            </article>
          ))}
        </div>

        <button
          className="adicionar-tarefa"
          type="button"
          onClick={adicionarTarefa}
        >
          <i className="bi bi-plus-lg" /> Adicionar tarefa
        </button>

        {erro && <p className="previa-erro">{erro}</p>}

        {salvo && (
          <p className="previa-sucesso">
            Projeto e tarefas salvos com sucesso!
          </p>
        )}

        <button
          className="confirmar-plano"
          type="button"
          onClick={confirmarPlano}
          disabled={salvando || salvo}
        >
          {salvando
            ? "Salvando..."
            : salvo
            ? "Projeto salvo"
            : "Salvar projeto e tarefas"}
        </button>
      </section>
    </main>
  );
}

export default PreviaPlano;
