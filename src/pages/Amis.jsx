import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getFriends,
  getIncomingRequests,
  searchProfiles,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriendship,
} from "../lib/friends";
import FriendRow from "../components/FriendRow";

export default function Amis() {
  const { user } = useAuth();

  const [tab, setTab] = useState("friends");

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: f }, { data: r }] = await Promise.all([
      getFriends(user.id),
      getIncomingRequests(user.id),
    ]);
    setFriends(f || []);
    setRequests(r || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user || !query.trim()) return;
    const handle = setTimeout(async () => {
      const { data } = await searchProfiles(user.id, query);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, user]);

  async function handleAccept(friendshipId) {
    await acceptFriendRequest(friendshipId);
    refresh();
  }
  async function handleDecline(friendshipId) {
    await declineFriendRequest(friendshipId);
    refresh();
  }
  async function handleRemove(friendshipId) {
    if (!confirm("Retirer cet ami de ta liste ?")) return;
    await removeFriendship(friendshipId);
    refresh();
  }

  const searching = query.trim().length > 0;

  return (
    <div className="page">
      <h1>Amis</h1>

      <div className="tabs">
        <button
          type="button"
          className={tab === "friends" ? "tab tab--active" : "tab"}
          onClick={() => setTab("friends")}
        >
          Mes amis ({friends.length})
        </button>
        <button
          type="button"
          className={tab === "requests" ? "tab tab--active" : "tab"}
          onClick={() => setTab("requests")}
        >
          Demandes ({requests.length})
        </button>
      </div>

      <input
        type="search"
        className="search-input"
        placeholder="🔍  Recherche…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {searching ? (
        <section className="friend-list">
          {searchResults.length === 0 ? (
            <p className="muted">Aucun utilisateur trouvé.</p>
          ) : (
            searchResults.map((p) => (
              <FriendRow
                key={p.id}
                profile={p}
                right={
                  p.isSelf ? (
                    <span className="badge">toi</span>
                  ) : undefined
                }
              />
            ))
          )}
        </section>
      ) : loading ? (
        <p className="muted">Chargement…</p>
      ) : tab === "friends" ? (
        <section className="friend-list">
          {friends.length === 0 ? (
            <p className="muted">
              Pas encore d'amis. Cherche quelqu'un par pseudo ci-dessus.
            </p>
          ) : (
            friends.map(({ friendshipId, profile }) => (
              <FriendRow
                key={friendshipId}
                profile={profile}
                right={
                  <button
                    type="button"
                    className="row-action row-action--ghost"
                    onClick={() => handleRemove(friendshipId)}
                    aria-label="Retirer cet ami"
                    title="Retirer"
                  >
                    ⋮
                  </button>
                }
              />
            ))
          )}
        </section>
      ) : (
        <section className="friend-list">
          {requests.length === 0 ? (
            <p className="muted">Aucune demande en attente.</p>
          ) : (
            requests.map(({ friendshipId, profile }) => (
              <FriendRow
                key={friendshipId}
                profile={profile}
                right={
                  <div className="row-actions">
                    <button
                      type="button"
                      className="row-action row-action--accept"
                      onClick={() => handleAccept(friendshipId)}
                    >
                      Accepter
                    </button>
                    <button
                      type="button"
                      className="row-action row-action--ghost"
                      onClick={() => handleDecline(friendshipId)}
                    >
                      Refuser
                    </button>
                  </div>
                }
              />
            ))
          )}
        </section>
      )}
    </div>
  );
}
