import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import { getUserGearForAdmin, adminDeleteUser } from "../lib/admin";
import { getMyProfile } from "../lib/profile";
import { deleteGear, formatPrice, CATEGORY_LABELS } from "../lib/gear";

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: g }] = await Promise.all([
      getMyProfile(id),
      getUserGearForAdmin(id),
    ]);
    setProfile(p);
    setItems(g || []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDeleteUser() {
    const yes1 = confirm(
      `⚠️ Supprimer définitivement le compte de @${profile?.username} ?\n\n` +
        "Toutes ses données (matériel, photos, amitiés) seront perdues.",
    );
    if (!yes1) return;
    const yes2 = prompt("Pour confirmer, tape SUPPRIMER :");
    if (yes2 !== "SUPPRIMER") {
      setError("Suppression annulée.");
      return;
    }
    const { error: dErr } = await adminDeleteUser(id);
    if (dErr) {
      setError(dErr.message);
      return;
    }
    navigate("/admin", { replace: true });
  }

  async function handleDeleteItem(gearId) {
    if (!confirm("Supprimer cet article du casier de l'utilisateur ?")) return;
    const { error: dErr } = await deleteGear(gearId);
    if (dErr) {
      setError(dErr.message);
      return;
    }
    load();
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Chargement…</p>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="page">
        <button type="button" className="btn-back" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <p className="form-error">Utilisateur introuvable.</p>
      </div>
    );
  }

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username;

  return (
    <div className="page">
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <div className="profile-header">
        <Avatar profile={profile} size={88} />
        <h1>{fullName}</h1>
        <p className="muted">@{profile.username}</p>
        {profile.is_admin && <span className="badge">admin</span>}
      </div>

      {profile.bio && (
        <section className="about">
          <h2 className="about__title">Biographie</h2>
          <p className="about__text">{profile.bio}</p>
        </section>
      )}

      <button
        type="button"
        className="btn"
        onClick={handleDeleteUser}
        style={{ borderColor: "#c0392b", color: "#c0392b" }}
      >
        🗑 Supprimer ce compte
      </button>

      {error && <p className="form-error">{error}</p>}

      <h2 className="about__title">
        Casier ({items.length}{" "}
        {items.length > 1 ? "articles" : "article"})
      </h2>

      {items.length === 0 ? (
        <p className="muted">Aucun article dans ce casier.</p>
      ) : (
        <div className="friend-list">
          {items.map((item) => (
            <div key={item.id} className="friend-row">
              <button
                type="button"
                className="friend-row__main"
                onClick={() => navigate(`/item/${item.id}`)}
              >
                <span style={{ width: 48, height: 48, flexShrink: 0 }}>
                  {item.photo_urls?.[0] ? (
                    <img
                      src={item.photo_urls[0]}
                      alt=""
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 48,
                        height: 48,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--code-bg)",
                        borderRadius: 8,
                      }}
                    >
                      🎸
                    </span>
                  )}
                </span>
                <span className="friend-row__text">
                  <span className="friend-row__name">{item.name}</span>
                  <span className="friend-row__pseudo">
                    {CATEGORY_LABELS[item.category]} ·{" "}
                    {item.brand || "—"}{" "}
                    {item.model ? `· ${item.model}` : ""} ·{" "}
                    {formatPrice(item.estimated_value)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="row-action row-action--ghost"
                onClick={() => handleDeleteItem(item.id)}
                aria-label="Supprimer cet article"
                title="Supprimer"
                style={{ color: "#c0392b" }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
