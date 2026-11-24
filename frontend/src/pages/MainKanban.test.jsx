// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import api from "../services/api";
import MainKanban from "./MainKanban";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
});

const projetos = [
  {
    id: 1,
    title: "Aprender React",
    color: "#567565",
  },
];

const tarefas = [
  {
    id: 10,
    title: "Estudar componentes",
    description: "Revisar componentes React.",
    status: "todo",
    priority: "medium",
    due_date: null,
  },
  {
    id: 11,
    title: "Criar o primeiro componente",
    description: "",
    status: "done",
    priority: "low",
    due_date: null,
  },
];

describe("MainKanban", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("taskpilot_access", "token-teste");
    api.get.mockResolvedValue({ data: tarefas });
    api.patch.mockResolvedValue({ data: {} });
  });

  it("atualiza o progresso do projeto ao concluir uma tarefa", async () => {
    const onProgressoAtualizado = vi.fn();

    render(
      <MainKanban
        projetos={projetos}
        onProgressoAtualizado={onProgressoAtualizado}
      />
    );

    const seletorStatus = await screen.findByRole("combobox", {
      name: "Alterar status de Estudar componentes",
    });

    fireEvent.change(seletorStatus, {
      target: { value: "done" },
    });

    await waitFor(() => {
      expect(onProgressoAtualizado).toHaveBeenCalledWith(1, 100);
    });

    expect(api.patch).toHaveBeenCalledWith(
      "/api/tasks/10/",
      { status: "done" },
      {
        headers: { Authorization: "Bearer token-teste" },
      }
    );
  });

  it("restaura o status e o progresso se a atualização falhar", async () => {
    api.patch.mockRejectedValueOnce(new Error("Falha de conexão"));

    const onProgressoAtualizado = vi.fn();

    render(
      <MainKanban
        projetos={projetos}
        onProgressoAtualizado={onProgressoAtualizado}
      />
    );

    const seletorStatus = await screen.findByRole("combobox", {
      name: "Alterar status de Estudar componentes",
    });

    fireEvent.change(seletorStatus, {
      target: { value: "done" },
    });

    await waitFor(() => {
      expect(onProgressoAtualizado).toHaveBeenNthCalledWith(1, 1, 100);
      expect(onProgressoAtualizado).toHaveBeenNthCalledWith(2, 1, 50);
      expect(seletorStatus.value).toBe("todo");
    });
  });
});