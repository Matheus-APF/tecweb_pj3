import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <section className="not-found-page">
      <div className="not-found-number">404</div>

      <span className="not-found-label">OPA, CAMINHO ERRADO!</span>

      <h1>Essa página não existe.</h1>

      <p>
        Parece que nos perdemos pelo caminho.
        Que tal voltar e tentar novamente?
      </p>

      <Link to="/" className="not-found-button">
        <i className="bi bi-arrow-left"></i>
        Voltar ao início
      </Link>
    </section>
  );
}

export default NotFound;