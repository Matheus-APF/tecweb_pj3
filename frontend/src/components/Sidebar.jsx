import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="app-sidebar">
      <span className="sidebar-label">MENU</span>

      <nav className="sidebar-nav">
        <NavLink to="/" end className="sidebar-link">
          <i className="bi bi-house"></i>
          <span>Início</span>
        </NavLink>

        <NavLink to="/objetivos/novo" className="sidebar-link">
          <i className="bi bi-plus-circle"></i>
          <span>Novo objetivo</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <span>Planeje com calma.</span>
        <span>Faça acontecer.</span>
      </div>
    </aside>
  );
}

export default Sidebar;