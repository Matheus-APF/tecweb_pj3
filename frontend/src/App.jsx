import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NovoObjetivo from "./pages/NovoObjetivo";
import PreviaPlano from "./pages/PreviaPlano";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/objetivos/novo" replace />} />
        <Route path="/objetivos/novo" element={<NovoObjetivo />} />
        <Route path="/objetivos/previa" element={<PreviaPlano />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;