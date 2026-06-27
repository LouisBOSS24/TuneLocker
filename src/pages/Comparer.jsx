import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import { getFriends } from "../lib/friends";
import {
  getMyGear,
  getGearDetail,
  formatPrice,
  CATEGORY_LABELS,
} from "../lib/gear";
import supabase from "../supabase-client";

// =============================================================
//  Champs de comparaison
// =============================================================

const COMMON_FIELDS = [
  { key: "brand", label: "Marque" },
  { key: "model", label: "Modèle" },
  { key: "year", label: "Année" },
  { key: "country", label: "Pays" },
  { key: "color", label: "Couleur" },
  { key: "weight_g", label: "Poids (g)" },
  { key: "condition", label: "État" },
  { key: "purchase_price", label: "Prix d'achat", format: formatPrice },
  { key: "estimated_value", label: "Estimation", format: formatPrice },
];

const GUITAR_FIELDS = [
  { key: "guitar_type", label: "Type" },
  { key: "guitar_shape", label: "Forme" },
  { key: "num_strings", label: "Cordes" },
  { key: "num_frets", label: "Frettes" },
  { key: "body_wood", label: "Bois corps" },
  { key: "neck_wood", label: "Bois manche" },
  { key: "fretboard_wood", label: "Bois touche" },
  { key: "pickup_config", label: "Config. micros" },
  { key: "pickup_models", label: "Modèles micros", isArray: true },
  { key: "bridge", label: "Chevalet" },
  { key: "scale_length_mm", label: "Diapason (mm)" },
  { key: "construction_type", label: "Construction" },
];

const AMP_FIELDS = [
  { key: "amp_type", label: "Type" },
  { key: "technology", label: "Techno" },
  { key: "wattage", label: "Puissance (W)" },
  { key: "num_channels", label: "Canaux" },
  { key: "speakers", label: "HP", isArray: true },
  { key: "builtin_effects", label: "Effets", isArray: true },
  { key: "main_controls", label: "Contrôles", isArray: true },
  { key: "main_connectivity", label: "Connectique", isArray: true },
];

const PEDAL_FIELDS = [
  { key: "effect_type", label: "Type effet" },
  { key: "technology", label: "Techno" },
  { key: "main_controls", label: "Contrôles", isArray: true },
  { key: "bypass_type", label: "Bypass" },
  { key: "power", label: "Alim." },
  { key: "connectivity", label: "Connectique", isArray: true },
  { key: "format", label: "Format" },
];

function fieldsForCategory(category) {
  if (category === "guitar") return [...COMMON_FIELDS, ...GUITAR_FIELDS];
  if (category === "amp") return [...COMMON_FIELDS, ...AMP_FIELDS];
  if (category === "pedal") return [...COMMON_FIELDS, ...PEDAL_FIELDS];
  return COMMON_FIELDS;
}

function renderValue(item, field) {
  const v = item?.[field.key];
  if (v === null || v === undefined || v === "") return "—";
  if (field.format) return field.format(v);
  if (field.isArray) {
    return Array.isArray(v) && v.length > 0 ? v.join(", ") : "—";
  }
  return String(v);
}

// =============================================================
//  Page Comparer
// =============================================================

export default function Comparer() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [friendId, setFriendId] = useState("");
  const [friendItems, setFriendItems] = useState([]);
  const [friendProfile, setFriendProfile] = useState(null);

  const [myItemId, setMyItemId] = useState("");
  const [otherItemId, setOtherItemId] = useState("");
  const [myItemDetail, setMyItemDetail] = useState(null);
  const [otherItemDetail, setOtherItemDetail] = useState(null);

  const myAvatarProfile = {
    id: user?.id,
    first_name: user?.user_metadata?.first_name,
    username: user?.user_metadata?.username,
  };

  const loadInitial = useCallback(async () => {
    if (!user) return;
    const [{ data: f }, { data: g }] = await Promise.all([
      getFriends(user.id),
      getMyGear(user.id),
    ]);
    setFriends(f || []);
    setMyItems(g || []);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!friendId) {
      setFriendItems([]);
      setFriendProfile(null);
      setOtherItemId("");
      setOtherItemDetail(null);
      return;
    }
    (async () => {
      if (friendId === user?.id) {
        setFriendProfile(myAvatarProfile);
        setFriendItems(myItems);
      } else {
        const friend = friends.find((f) => f.profile.id === friendId)?.profile;
        setFriendProfile(friend || null);
        const { data } = await supabase
          .from("gear")
          .select("*")
          .eq("owner_id", friendId)
          .eq("is_public", true)
          .order("created_at", { ascending: false });
        setFriendItems(data || []);
      }
      setOtherItemId("");
      setOtherItemDetail(null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId, friends, myItems, user?.id]);

  useEffect(() => {
    if (!myItemId) {
      setMyItemDetail(null);
      return;
    }
    (async () => {
      const { data } = await getGearDetail(myItemId);
      setMyItemDetail(data);
    })();
  }, [myItemId]);

  useEffect(() => {
    if (!otherItemId) {
      setOtherItemDetail(null);
      return;
    }
    (async () => {
      const { data } = await getGearDetail(otherItemId);
      setOtherItemDetail(data);
    })();
  }, [otherItemId]);

  function computeFields() {
    if (!myItemDetail && !otherItemDetail) {
      return COMMON_FIELDS;
    }
    if (myItemDetail && otherItemDetail) {
      if (myItemDetail.category !== otherItemDetail.category) {
        return COMMON_FIELDS;
      }
      return fieldsForCategory(myItemDetail.category);
    }
    if (myItemDetail) {
      return fieldsForCategory(myItemDetail.category);
    }
    return fieldsForCategory(otherItemDetail.category);
  }
  const fields = computeFields();

  return (
    <div className="page">
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>
      <h1>Comparateur</h1>

      <div className="compare-grid">
        <div className="compare-col">
          <div className="compare-head">
            <Avatar profile={myAvatarProfile} size={56} />
            <div>
              <div className="compare-name">
                {user?.user_metadata?.first_name || user?.user_metadata?.username}
              </div>
              <div className="muted">@{user?.user_metadata?.username}</div>
            </div>
          </div>

          <select
            className="search-input"
            value={myItemId}
            onChange={(e) => setMyItemId(e.target.value)}
          >
            <option value="">Choisis un de tes objets…</option>
            {myItems.map((i) => (
              <option key={i.id} value={i.id}>
                {CATEGORY_LABELS[i.category]} — {i.brand} {i.name}
              </option>
            ))}
          </select>

          {myItemDetail?.photo_urls?.[0] && (
            <img
              className="compare-photo"
              src={myItemDetail.photo_urls[0]}
              alt={myItemDetail.name}
            />
          )}
          {myItemDetail && (
            <h3 className="compare-item-name">{myItemDetail.name}</h3>
          )}
        </div>

        <div className="compare-col">
          <div className="compare-head">
            {friendProfile ? (
              <>
                <Avatar profile={friendProfile} size={56} />
                <div>
                  <div className="compare-name">
                    {friendProfile.first_name || friendProfile.username}
                  </div>
                  <div className="muted">@{friendProfile.username}</div>
                </div>
              </>
            ) : (
              <div className="muted">Choisis qui comparer →</div>
            )}
          </div>

          <select
            className="search-input"
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
          >
            <option value="">Choisis qui comparer…</option>
            <option value={user?.id}>Moi (mes objets)</option>
            {friends.map(({ profile }) => (
              <option key={profile.id} value={profile.id}>
                {profile.first_name || profile.username} (@{profile.username})
              </option>
            ))}
          </select>

          {friendId && (
            <select
              className="search-input"
              value={otherItemId}
              onChange={(e) => setOtherItemId(e.target.value)}
              disabled={friendItems.length === 0}
            >
              <option value="">
                {friendItems.length === 0
                  ? friendId === user?.id
                    ? "Tu n'as pas encore d'objets"
                    : "Aucun objet public"
                  : friendId === user?.id
                    ? "Choisis un de tes objets…"
                    : "Choisis un de ses objets…"}
              </option>
              {friendItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {CATEGORY_LABELS[i.category]} — {i.brand} {i.name}
                </option>
              ))}
            </select>
          )}

          {otherItemDetail?.photo_urls?.[0] && (
            <img
              className="compare-photo"
              src={otherItemDetail.photo_urls[0]}
              alt={otherItemDetail.name}
            />
          )}
          {otherItemDetail && (
            <h3 className="compare-item-name">{otherItemDetail.name}</h3>
          )}
        </div>
      </div>

      {(myItemDetail || otherItemDetail) && (
        <table className="compare-table">
          <tbody>
            {fields.map((f) => {
              const a = renderValue(myItemDetail, f);
              const b = renderValue(otherItemDetail, f);
              const diff = a !== b && a !== "—" && b !== "—";
              return (
                <tr key={f.key} className={diff ? "compare-row-diff" : ""}>
                  <td className="compare-cell">{a}</td>
                  <th className="compare-label">{f.label}</th>
                  <td className="compare-cell">{b}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
