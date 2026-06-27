import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <NavLink to="/home" className="nav-item">
        <span className="nav-icon nav-icon--home" aria-hidden="true" />
        <span>Accueil</span>
      </NavLink>

      <NavLink to="/locker" className="nav-item">
        <span className="nav-icon nav-icon--locker" aria-hidden="true" />
        <span>Locker</span>
      </NavLink>

      <button
        type="button"
        className="nav-add"
        aria-label="Ajouter du matériel"
        onClick={() => navigate("/ajouter")}
      >
        <span className="nav-addbutton nav-icon--add" />
      </button>

      <NavLink to="/amis" className="nav-item">
        <span className="nav-icon nav-icon--amis" aria-hidden="true" />
        <span>Amis</span>
      </NavLink>

      <NavLink to="/compte" className="nav-item">
        <span className="nav-icon nav-icon--compte" aria-hidden="true" />
        <span>Compte</span>
      </NavLink>
    </nav>
  );
}
