import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyGear, formatPrice, CATEGORY_LABELS } from "../lib/gear";

const CATEGORY_FILTERS = [
  { value: "", label: "Toutes" },
  { value: "guitar", label: "Guitares" },
  { value: "amp", label: "Amplis" },
  { value: "pedal", label: "Pédales" },
];

export default function Locker() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getMyGear(user.id, {
      category: category || undefined,
      search: search || undefined,
    });
    setItems(data || []);
    setLoading(false);
  }, [user, category, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="page">
      <h1>Locker</h1>

      <input
        type="search"
        className="search-input"
        placeholder="🔍 Recherche…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="chip-row">
        {CATEGORY_FILTERS.map((c) => (
          <button
            key={c.value}
            type="button"
            className={
              category === c.value ? "chip chip--active" : "chip"
            }
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="muted">
        {loading ? "Chargement…" : `${items.length} article(s)`}
      </p>

      {!loading && items.length === 0 && (
        <p className="muted">
          Pas encore d'articles. Clique sur + pour en ajouter.
        </p>
      )}

      <div className="gear-grid">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className="gear-card"
            onClick={() => navigate(`/item/${item.id}`)}
          >
            <div className="gear-card__photo">
              {item.photo_urls?.[0] ? (
                <img src={item.photo_urls[0]} alt={item.name} />
              ) : (
                <span className="gear-card__placeholder">🎸</span>
              )}
            </div>
            <div className="gear-card__body">
              <span className="gear-card__name">{item.name}</span>
              <span className="gear-card__sub">
                {item.brand || "—"}{" "}
                {item.model ? `· ${item.model}` : ""}
              </span>
              <span className="gear-card__price">
                {formatPrice(item.estimated_value)}
              </span>
              <span className="gear-card__cat">
                {CATEGORY_LABELS[item.category] || item.category}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
