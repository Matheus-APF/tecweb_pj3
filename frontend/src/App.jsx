import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NovoObjetivo from "./pages/NovoObjetivo";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/objetivos/novo" replace />} />
        <Route path="/objetivos/novo" element={<NovoObjetivo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;