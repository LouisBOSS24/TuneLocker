import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import { getMyGearSummary, formatPrice } from "../lib/gear";
import { getMyProfile } from "../lib/profile";

function MenuRow({ iconName, label, to }) {
  const navigate = useNavigate();
  return (
    <button type="button" className="menu-row" onClick={() => navigate(to)}>
      <span
        className={`menu-icon menu-icon--${iconName}`}
        aria-hidden="true"
      />
      <span className="menu-row__label">{label}</span>
      <span className="menu-icon menu-icon--chevron" aria-hidden="true" />
    </button>
  );
}

// =============================================================
//  Page Compte
// =============================================================

export default function Compte() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState({ total: 0, count: 0 });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: stats }, { data: prof }] = await Promise.all([
      getMyGearSummary(user.id),
      getMyProfile(user.id),
    ]);
    if (stats) setSummary(stats);
    if (prof) setProfile(prof);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  const firstName = profile?.first_name || user?.user_metadata?.first_name;
  const username = profile?.username || user?.user_metadata?.username;
  const displayName = firstName || username || user?.email;

  const bio =
    profile?.bio || "Ajoute une petite description de toi dans Paramètres.";

  const avatarProfile = {
    id: user?.id,
    username,
    first_name: firstName,
    avatar_url: profile?.avatar_url,
  };

  return (
    <div className="page page--compte">
      <div className="compte-hero">
        <h1>Compte</h1>
        <div className="profile-banner">
          <Avatar profile={avatarProfile} size={72} />
          <div className="profile-banner__text">
            <span className="profile-banner__name">{displayName}</span>
            {username && (
              <span className="profile-banner__pseudo">@{username}</span>
            )}
          </div>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-card__label">Valeur du casier :</span>
          <span className="stat-card__value">
            {loading ? "…" : formatPrice(summary.total)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Nombre d'articles :</span>
          <span className="stat-card__value">
            {loading ? "…" : summary.count}
          </span>
        </div>
      </div>

      <section className="about">
        <h2 className="about__title">À propos</h2>
        <p className="about__text">{bio}</p>
      </section>

      <nav className="menu">
        <MenuRow iconName="archive" label="Collection" to="/locker" />
        <MenuRow iconName="heart" label="Favoris" to="/favoris" />
        <MenuRow iconName="medal" label="Wishlist" to="/wishlist" />
        <MenuRow iconName="users" label="Amis" to="/amis" />
        <MenuRow iconName="gear" label="Paramètres" to="/parametres" />
        {profile?.is_admin && (
          <MenuRow iconName="shield" label="Administration" to="/admin" />
        )}
      </nav>

      <button type="button" className="btn" onClick={handleSignOut}>
        Se déconnecter
      </button>
    </div>
  );
}
