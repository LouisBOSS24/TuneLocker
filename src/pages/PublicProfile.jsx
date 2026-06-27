import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import {
  getProfileByUsername,
  getRelationshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriendship,
  formatLastSeen,
  isOnline,
} from "../lib/friends";
import {
  getMyGear,
  getMyGearSummary,
  formatPrice,
  CATEGORY_LABELS,
} from "../lib/gear";

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [relation, setRelation] = useState({
    status: "none",
    friendshipId: null,
  });
  const [summary, setSummary] = useState({ total: 0, count: 0 });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: p, error: pErr } = await getProfileByUsername(username);
    if (pErr || !p) {
      setError("Profil introuvable.");
      setLoading(false);
      return;
    }
    setProfile(p);

    if (user && user.id !== p.id) {
      const { data: rel } = await getRelationshipStatus(user.id, p.id);
      setRelation(rel || { status: "none", friendshipId: null });
    }

    const [{ data: summaryData }, { data: gearData }] = await Promise.all([
      getMyGearSummary(p.id),
      getMyGear(p.id),
    ]);
    if (summaryData) setSummary(summaryData);
    setItems(gearData || []);

    setLoading(false);
  }, [username, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function withBusy(fn) {
    setBusy(true);
    await fn();
    await load();
    setBusy(false);
  }

  async function handleSend() {
    await withBusy(() => sendFriendRequest(user.id, profile.id));
  }
  async function handleAccept() {
    await withBusy(() => acceptFriendRequest(relation.friendshipId));
  }
  async function handleDecline() {
    await withBusy(() => declineFriendRequest(relation.friendshipId));
  }
  async function handleRemove() {
    if (!confirm("Retirer cette personne de tes amis ?")) return;
    await withBusy(() => removeFriendship(relation.friendshipId));
  }
  async function handleCancel() {
    if (!confirm("Annuler ta demande ?")) return;
    await withBusy(() => removeFriendship(relation.friendshipId));
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Chargement…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <button type="button" className="btn-back" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <p className="form-error">{error}</p>
      </div>
    );
  }

  const isMe = user && user.id === profile.id;
  const isFriend = relation.status === "friends";
  const canSeeLocker = isMe || isFriend;

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username;

  return (
    <div className="page">
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <div className="profile-header">
        <Avatar profile={profile} size={96} />
        <h1>{fullName}</h1>
        <p className="muted">@{profile.username}</p>
        <p
          className={
            isOnline(profile.last_seen_at)
              ? "friend-row__status friend-row__status--online"
              : "friend-row__status"
          }
        >
          {formatLastSeen(profile.last_seen_at)}
        </p>
      </div>

      {isMe ? (
        <p className="muted">C'est ton profil.</p>
      ) : relation.status === "friends" ? (
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={handleRemove}
        >
          ✓ Amis · Retirer
        </button>
      ) : relation.status === "pending_outgoing" ? (
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={handleCancel}
        >
          Demande envoyée · Annuler
        </button>
      ) : relation.status === "pending_incoming" ? (
        <div className="stack">
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={handleAccept}
          >
            Accepter la demande
          </button>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={handleDecline}
          >
            Refuser
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={handleSend}
        >
          + Ajouter en ami
        </button>
      )}

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-card__label">Valeur du casier :</span>
          <span className="stat-card__value">{formatPrice(summary.total)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Nombre d'articles :</span>
          <span className="stat-card__value">{summary.count}</span>
        </div>
      </div>

      <section className="about">
        <h2 className="about__title">À propos</h2>
        <p className="about__text">
          {profile.bio || (
            <span className="muted">Pas encore de biographie.</span>
          )}
        </p>
      </section>

      <section>
        <h2 className="about__title">
          {isMe ? "Mon casier" : `Le casier de ${profile.first_name || profile.username}`}
        </h2>

        {!canSeeLocker ? (
          <p className="muted">
            Tu dois être ami avec cette personne pour voir son casier.
          </p>
        ) : items.length === 0 ? (
          <p className="muted">
            {isMe
              ? "Pas encore d'articles."
              : "Aucun article public à afficher."}
          </p>
        ) : (
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
        )}
      </section>
    </div>
  );
}
