import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import {
  getActivityFeed,
  formatRelativeTime,
  CATEGORY_LABELS,
} from "../lib/gear";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getActivityFeed(user.id);
    setFeed(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="page">
      <header className="home-header">
        <h1 className="home-title">
          Tune<span className="home-title__accent">Locker</span>
        </h1>
        <button
          type="button"
          className="home-search-btn"
          aria-label="Rechercher"
          onClick={() => navigate("/amis")}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </header>

      <button
        type="button"
        className="btn btn--primary btn--compare"
        onClick={() => navigate("/comparer")}
      >
        <span>Comparateur</span>
        <span className="balance-icon" aria-hidden="true" />
      </button>

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : feed.length === 0 ? (
        <p className="muted">
          Pas encore d'activité. Ajoute ton premier article ou des amis pour
          voir leurs ajouts !
        </p>
      ) : (
        <div className="feed">
          {feed.map((post) => (
            <article key={post.id} className="post">
              <header className="post__header">
                <Avatar profile={post.author} size={42} />
                <div className="post__meta">
                  <span className="post__name">
                    {post.author
                      ? post.author.first_name ||
                        post.author.username ||
                        "Sans nom"
                      : "Utilisateur"}
                  </span>
                  <span className="post__pseudo">
                    @{post.author?.username || "inconnu"}
                  </span>
                </div>
                <span className="post__time">
                  {formatRelativeTime(post.created_at)}
                </span>
                <button
                  type="button"
                  className="post__more"
                  aria-label="Options"
                >
                  ⋮
                </button>
              </header>
              <p className="post__body">
                a ajouté un nouvel article : <strong>{post.name}</strong>{" "}
                <span className="muted">
                  ({CATEGORY_LABELS[post.category] || post.category})
                </span>
              </p>
              {post.photo_urls?.[0] && (
                <img
                  className="post__photo"
                  src={post.photo_urls[0]}
                  alt={post.name}
                />
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
