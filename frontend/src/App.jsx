import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NovoObjetivo from "./pages/NovoObjetivo";
import PreviaPlano from "./pages/PreviaPlano";
import Projeto from "./pages/Projeto";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/objetivos/novo" replace />} />
        <Route path="/objetivos/novo" element={<NovoObjetivo />} />
        <Route path="/objetivos/previa" element={<PreviaPlano />} />
        <Route path="/projetos/:id" element={<Projeto />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;