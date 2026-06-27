import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import { getAllUsersForAdmin } from "../lib/admin";
import { formatPrice } from "../lib/gear";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await getAllUsersForAdmin();
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.username || "").toLowerCase().includes(q) ||
      (u.first_name || "").toLowerCase().includes(q) ||
      (u.last_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="page">
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>
      <h1>Admin · Utilisateurs</h1>
      <p className="muted">{filtered.length} compte(s)</p>

      <input
        type="search"
        className="search-input"
        placeholder="🔍 Filtrer par nom ou pseudo…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : (
        <div className="friend-list">
          {filtered.map((u) => (
            <div key={u.id} className="friend-row">
              <button
                type="button"
                className="friend-row__main"
                onClick={() => navigate(`/admin/user/${u.id}`)}
              >
                <Avatar profile={u} />
                <span className="friend-row__text">
                  <span className="friend-row__name">
                    {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                      u.username ||
                      "Sans nom"}
                    {u.is_admin && (
                      <span className="badge" style={{ marginLeft: 8 }}>
                        admin
                      </span>
                    )}
                  </span>
                  <span className="friend-row__pseudo">
                    @{u.username || "—"} · {u.gear_count} items ·{" "}
                    {formatPrice(u.gear_total)}
                  </span>
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
