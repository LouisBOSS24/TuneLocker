import { useNavigate } from "react-router-dom";

export default function Wishlist() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>
      <h1>Wishlist</h1>
      <p className="muted">
        Le matériel que tu souhaites acquérir (is_wishlist = true) sera listé
        ici.
      </p>
    </div>
  );
}
