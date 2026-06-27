import { Link, useNavigate } from "react-router-dom";

export default function Front() {
  const navigate = useNavigate();

  return (
    <div className="page front">
      <div className="front-images" aria-hidden="true">
        <img
          src="/orangespeaker.png"
          alt=""
          className="front-images__speaker"
        />
        <img src="/orangeguitar.png" alt="" className="front-images__guitar" />
      </div>

      <div className="title">
        <h1 className="title-tune">Tune</h1>
        <h1 className="title-locker">Locker</h1>
      </div>
      <p className="slogan">
        Référencez et comparez votre <br /> matériel musical
      </p>

      <div className="stack">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate("/login")}
        >
          Se connecter
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => navigate("/register")}
        >
          Créer un compte
        </button>

        <Link to="/home" className="link-muted">
          Continuer sans connexion
        </Link>
      </div>
    </div>
  );
}
