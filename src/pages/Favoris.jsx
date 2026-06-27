import { useNavigate } from "react-router-dom";

export default function Favoris() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>
      <h1>Favoris</h1>
      <p className="muted">
        Tes objets favoris apparaîtront ici (filtrage sur is_favorite = true
        depuis ta collection).
      </p>
    </div>
  );
}
