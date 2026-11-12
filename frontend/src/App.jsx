import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [status, setStatus] = useState("Carregando...");

  useEffect(() => {
    api.get("/api/status/")
      .then(res => setStatus(res.data.status))
      .catch(() => setStatus("Erro na conexão"));
  }, []);

  return <h1>TaskPilot — API: {status}</h1>;
}

export default App;