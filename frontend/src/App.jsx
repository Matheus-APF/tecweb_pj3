import { BrowserRouter, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Main from "./pages/Main";
import NovoObjetivo from "./pages/NovoObjetivo";
import PreviaPlano from "./pages/PreviaPlano";
import Projeto from "./pages/Projeto";
import NotFound from "./pages/NotFound";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Main />} />
            <Route path="/objetivos/novo" element={<NovoObjetivo />} />
            <Route path="/objetivos/previa" element={<PreviaPlano />} />
            <Route path="/projetos/:id" element={<Projeto />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;