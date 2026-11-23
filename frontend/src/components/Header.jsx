import { Link } from "react-router-dom";
import "./Header.css";

function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="header-logo">
        TaskPilot<span>.</span>
      </Link>

      <div className="header-message">
        Um passo de cada vez.
      </div>
    </header>
  );
}

export default Header;