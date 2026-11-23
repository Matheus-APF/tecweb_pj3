import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NovoObjetivo from "./pages/NovoObjetivo";
import PreviaPlano from "./pages/PreviaPlano";
import Projeto from "./pages/Projeto";
import MainLayout from "./layouts/MainLayout";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="objetivos/novo" replace />} />
          <Route path="objetivos/novo" element={<NovoObjetivo />} />
          <Route path="objetivos/previa" element={<PreviaPlano />} />
          <Route path="projetos/:id" element={<Projeto />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;