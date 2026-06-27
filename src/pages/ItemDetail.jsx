import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ImageUpload from "../components/ImageUpload";
import {
  getGearDetail,
  updateGearBase,
  updateGearExtension,
  deleteGear,
  formatPrice,
  splitList,
  toNumber,
  toText,
  buildTypeData,
  CATEGORY_LABELS,
} from "../lib/gear";
import { uploadGearPhoto } from "../lib/storage";
import { isMeAdmin } from "../lib/admin";

// =============================================================
//  Listes d'options
// =============================================================

const CONDITION_OPTIONS = [
  { value: "new", label: "Neuf" },
  { value: "like_new", label: "Comme neuf" },
  { value: "very_good", label: "Très bon état" },
  { value: "good", label: "Bon état" },
  { value: "fair", label: "État moyen" },
  { value: "poor", label: "Mauvais état" },
  { value: "for_parts", label: "Pour pièces" },
];
const GUITAR_TYPE_OPTIONS = [
  { value: "electric", label: "Électrique" },
  { value: "electro_acoustic", label: "Électro-acoustique" },
  { value: "acoustic", label: "Acoustique" },
  { value: "classical", label: "Classique" },
  { value: "bass", label: "Basse" },
  { value: "semi_hollow", label: "Semi-hollow" },
  { value: "hollow", label: "Hollow" },
  { value: "resonator", label: "Résonateur" },
  { value: "other", label: "Autre" },
];
const PICKUP_CONFIG_OPTIONS = [
  "SSS", "HH", "HSS", "HSH", "SS", "H", "S", "P", "J", "PJ", "none", "custom",
].map((v) => ({ value: v, label: v }));
const CONSTRUCTION_OPTIONS = [
  { value: "bolt_on", label: "Bolt-on" },
  { value: "set_neck", label: "Set-neck" },
  { value: "neck_through", label: "Neck-through" },
  { value: "other", label: "Autre" },
];
const AMP_TYPE_OPTIONS = [
  { value: "combo", label: "Combo" },
  { value: "head", label: "Tête" },
  { value: "cabinet", label: "Cabinet" },
  { value: "stack", label: "Stack" },
  { value: "modeling", label: "Modélisation" },
];
const AMP_TECH_OPTIONS = [
  { value: "tube", label: "Lampes" },
  { value: "solid_state", label: "Transistors" },
  { value: "hybrid", label: "Hybride" },
  { value: "digital", label: "Numérique" },
];
const EFFECT_TYPE_OPTIONS = [
  "overdrive", "distortion", "fuzz", "boost", "compressor", "eq",
  "delay", "reverb", "chorus", "flanger", "phaser", "tremolo", "vibrato",
  "octaver", "pitch", "harmonizer", "wah", "filter", "noise_gate",
  "looper", "tuner", "utility", "multi", "other",
].map((v) => ({ value: v, label: v }));
const PEDAL_TECH_OPTIONS = [
  { value: "analog", label: "Analogique" },
  { value: "digital", label: "Numérique" },
  { value: "hybrid", label: "Hybride" },
];
const BYPASS_OPTIONS = [
  { value: "true_bypass", label: "True bypass" },
  { value: "buffered", label: "Buffered" },
  { value: "soft", label: "Soft" },
];
const PEDAL_FORMAT_OPTIONS = [
  "mini", "standard", "double", "triple", "rack", "desktop", "other",
].map((v) => ({ value: v, label: v }));

const COMMON_VIEW_FIELDS = [
  { key: "brand", label: "Marque" },
  { key: "model", label: "Modèle" },
  { key: "year", label: "Année" },
  { key: "country", label: "Pays" },
  { key: "color", label: "Couleur" },
  { key: "weight_g", label: "Poids (g)" },
  { key: "condition", label: "État" },
  { key: "purchase_date", label: "Date d'achat" },
  { key: "purchase_price", label: "Prix d'achat", format: formatPrice },
  { key: "estimated_value", label: "Estimation", format: formatPrice },
];

const TYPE_FIELDS = {
  guitar: [
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
  ],
  amp: [
    { key: "amp_type", label: "Type" },
    { key: "technology", label: "Techno" },
    { key: "wattage", label: "Puissance (W)" },
    { key: "num_channels", label: "Canaux" },
    { key: "speakers", label: "HP", isArray: true },
    { key: "builtin_effects", label: "Effets", isArray: true },
    { key: "main_controls", label: "Contrôles", isArray: true },
    { key: "main_connectivity", label: "Connectique", isArray: true },
  ],
  pedal: [
    { key: "effect_type", label: "Type effet" },
    { key: "technology", label: "Techno" },
    { key: "main_controls", label: "Contrôles", isArray: true },
    { key: "bypass_type", label: "Bypass" },
    { key: "power", label: "Alim." },
    { key: "connectivity", label: "Connectique", isArray: true },
    { key: "format", label: "Format" },
  ],
};

function renderValue(item, field) {
  const v = item?.[field.key];
  if (v === null || v === undefined || v === "") return "—";
  if (field.format) return field.format(v);
  if (field.isArray) {
    return Array.isArray(v) && v.length > 0 ? v.join(", ") : "—";
  }
  return String(v);
}

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    if (user?.id) {
      const adminFlag = await isMeAdmin(user.id);
      setIsAdmin(adminFlag);
    }
    const { data } = await getGearDetail(id);
    setItem(data);
    if (data) {
      setForm({
        name: data.name || "",
        brand: data.brand || "",
        model: data.model || "",
        year: data.year || "",
        country: data.country || "",
        color: data.color || "",
        weight_g: data.weight_g || "",
        condition: data.condition || "",
        purchase_date: data.purchase_date || "",
        purchase_price: data.purchase_price || "",
        estimated_value: data.estimated_value || "",
        description: data.description || "",
        photo_url: data.photo_urls?.[0] || "",
        is_public: data.is_public || false,
        is_favorite: data.is_favorite || false,
        is_wishlist: data.is_wishlist || false,
        guitar_type: data.guitar_type || "",
        guitar_shape: data.guitar_shape || "",
        num_strings: data.num_strings || "",
        num_frets: data.num_frets || "",
        body_wood: data.body_wood || "",
        neck_wood: data.neck_wood || "",
        fretboard_wood: data.fretboard_wood || "",
        pickup_config: data.pickup_config || "",
        pickup_models_text: (data.pickup_models || []).join(", "),
        pickup_active: data.pickup_active || false,
        bridge: data.bridge || "",
        scale_length_mm: data.scale_length_mm || "",
        construction_type: data.construction_type || "",
        amp_type: data.amp_type || "",
        technology: data.technology || "",
        wattage: data.wattage || "",
        num_channels: data.num_channels || "",
        speakers_text: (data.speakers || []).join(", "),
        builtin_effects_text: (data.builtin_effects || []).join(", "),
        main_controls_text: (data.main_controls || []).join(", "),
        main_connectivity_text: (data.main_connectivity || []).join(", "),
        effect_type: data.effect_type || "",
        bypass_type: data.bypass_type || "",
        power: data.power || "",
        connectivity_text: (data.connectivity || []).join(", "),
        format: data.format || "",
      });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function set(field) {
    return (e) => {
      const value =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    const baseChanges = {
      name: toText(form.name),
      brand: toText(form.brand),
      model: toText(form.model),
      year: toNumber(form.year),
      country: toText(form.country),
      color: toText(form.color),
      weight_g: toNumber(form.weight_g),
      condition: toText(form.condition),
      purchase_date: form.purchase_date || null,
      purchase_price: toNumber(form.purchase_price),
      estimated_value: toNumber(form.estimated_value),
      description: toText(form.description),
      photo_urls: form.photo_url ? [form.photo_url] : [],
      is_public: form.is_public,
      is_favorite: form.is_favorite,
      is_wishlist: form.is_wishlist,
    };

    const { error: upErr } = await updateGearBase(item.id, baseChanges);
    if (upErr) {
      setSaving(false);
      setError(upErr.message);
      return;
    }

    const extChanges = buildTypeData(item.category, form);

    if (extChanges) {
      const { error: extErr } = await updateGearExtension(
        item.category,
        item.id,
        extChanges,
      );
      if (extErr) {
        setSaving(false);
        setError(extErr.message);
        return;
      }
    }

    setSaving(false);
    setEditing(false);
    load();
  }

  async function handleDelete() {
    if (!confirm("Supprimer cet article ? Cette action est irréversible.")) {
      return;
    }
    const { error: dErr } = await deleteGear(item.id);
    if (dErr) {
      setError(dErr.message);
      return;
    }
    navigate("/locker", { replace: true });
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Chargement…</p>
      </div>
    );
  }
  if (!item) {
    return (
      <div className="page">
        <button type="button" className="btn-back" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <p className="form-error">Article introuvable.</p>
      </div>
    );
  }

  const isMine = user && user.id === item.owner_id;
  const canEdit = isMine || isAdmin;
  const typeFields = TYPE_FIELDS[item.category] || [];

  if (editing) {
    return (
      <div className="page">
        <button
          type="button"
          className="btn-back"
          onClick={() => setEditing(false)}
        >
          ← Annuler
        </button>
        <h1>Modifier l'article</h1>

        <div className="form">
          <label>
            Photo
            <ImageUpload
              label="Changer la photo"
              currentUrl={form.photo_url}
              uploadFn={(file) => uploadGearPhoto(user.id, file)}
              onUploaded={(url) =>
                setForm((prev) => ({ ...prev, photo_url: url }))
              }
            />
          </label>

          <label>
            Nom
            <input type="text" value={form.name} onChange={set("name")} />
          </label>
          <label>
            Marque
            <input type="text" value={form.brand} onChange={set("brand")} />
          </label>
          <label>
            Modèle
            <input type="text" value={form.model} onChange={set("model")} />
          </label>
          <label>
            Année
            <input type="number" value={form.year} onChange={set("year")} />
          </label>
          <label>
            Pays
            <input type="text" value={form.country} onChange={set("country")} />
          </label>
          <label>
            Couleur
            <input type="text" value={form.color} onChange={set("color")} />
          </label>
          <label>
            Poids (g)
            <input
              type="number"
              value={form.weight_g}
              onChange={set("weight_g")}
            />
          </label>
          <label>
            Prix d'achat (€)
            <input
              type="number"
              step="0.01"
              value={form.purchase_price}
              onChange={set("purchase_price")}
            />
          </label>
          <label>
            Valeur estimée (€)
            <input
              type="number"
              step="0.01"
              value={form.estimated_value}
              onChange={set("estimated_value")}
            />
          </label>
          <label>
            État
            <select value={form.condition} onChange={set("condition")}>
              <option value="">—</option>
              {CONDITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date d'achat
            <input
              type="date"
              value={form.purchase_date}
              onChange={set("purchase_date")}
            />
          </label>
          <label>
            Description
            <textarea
              rows="3"
              value={form.description}
              onChange={set("description")}
            />
          </label>

          {item.category === "guitar" && (
            <>
              <h2>Détails guitare</h2>
              <label>
                Type de guitare
                <select
                  value={form.guitar_type}
                  onChange={set("guitar_type")}
                >
                  <option value="">—</option>
                  {GUITAR_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Forme (Strat, Les Paul, SG…)
                <input
                  type="text"
                  value={form.guitar_shape}
                  onChange={set("guitar_shape")}
                />
              </label>
              <label>
                Nombre de cordes
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.num_strings}
                  onChange={set("num_strings")}
                />
              </label>
              <label>
                Nombre de frettes
                <input
                  type="number"
                  min="0"
                  max="36"
                  value={form.num_frets}
                  onChange={set("num_frets")}
                />
              </label>
              <label>
                Bois du corps
                <input
                  type="text"
                  value={form.body_wood}
                  onChange={set("body_wood")}
                />
              </label>
              <label>
                Bois du manche
                <input
                  type="text"
                  value={form.neck_wood}
                  onChange={set("neck_wood")}
                />
              </label>
              <label>
                Bois de la touche
                <input
                  type="text"
                  value={form.fretboard_wood}
                  onChange={set("fretboard_wood")}
                />
              </label>
              <label>
                Configuration des micros
                <select
                  value={form.pickup_config}
                  onChange={set("pickup_config")}
                >
                  <option value="">—</option>
                  {PICKUP_CONFIG_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Modèles des micros (séparés par des virgules)
                <input
                  type="text"
                  value={form.pickup_models_text}
                  onChange={set("pickup_models_text")}
                />
              </label>
              <label className="form-row">
                <input
                  type="checkbox"
                  checked={form.pickup_active}
                  onChange={set("pickup_active")}
                />
                Micros actifs
              </label>
              <label>
                Chevalet
                <input
                  type="text"
                  value={form.bridge}
                  onChange={set("bridge")}
                />
              </label>
              <label>
                Diapason (mm)
                <input
                  type="number"
                  min="300"
                  max="1000"
                  value={form.scale_length_mm}
                  onChange={set("scale_length_mm")}
                />
              </label>
              <label>
                Type de construction
                <select
                  value={form.construction_type}
                  onChange={set("construction_type")}
                >
                  <option value="">—</option>
                  {CONSTRUCTION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {item.category === "amp" && (
            <>
              <h2>Détails ampli</h2>
              <label>
                Type d'ampli
                <select value={form.amp_type} onChange={set("amp_type")}>
                  <option value="">—</option>
                  {AMP_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Technologie
                <select
                  value={form.technology}
                  onChange={set("technology")}
                >
                  <option value="">—</option>
                  {AMP_TECH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Puissance (watts)
                <input
                  type="number"
                  min="1"
                  value={form.wattage}
                  onChange={set("wattage")}
                />
              </label>
              <label>
                Nombre de canaux
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={form.num_channels}
                  onChange={set("num_channels")}
                />
              </label>
              <label>
                Haut-parleurs (séparés par des virgules)
                <input
                  type="text"
                  value={form.speakers_text}
                  onChange={set("speakers_text")}
                />
              </label>
              <label>
                Effets intégrés (séparés par des virgules)
                <input
                  type="text"
                  value={form.builtin_effects_text}
                  onChange={set("builtin_effects_text")}
                />
              </label>
              <label>
                Contrôles principaux (séparés par des virgules)
                <input
                  type="text"
                  value={form.main_controls_text}
                  onChange={set("main_controls_text")}
                />
              </label>
              <label>
                Connectique principale (séparée par des virgules)
                <input
                  type="text"
                  value={form.main_connectivity_text}
                  onChange={set("main_connectivity_text")}
                />
              </label>
            </>
          )}

          {item.category === "pedal" && (
            <>
              <h2>Détails pédale</h2>
              <label>
                Type d'effet
                <select
                  value={form.effect_type}
                  onChange={set("effect_type")}
                >
                  <option value="">—</option>
                  {EFFECT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Technologie
                <select
                  value={form.technology}
                  onChange={set("technology")}
                >
                  <option value="">—</option>
                  {PEDAL_TECH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Contrôles principaux (séparés par des virgules)
                <input
                  type="text"
                  value={form.main_controls_text}
                  onChange={set("main_controls_text")}
                />
              </label>
              <label>
                Bypass
                <select
                  value={form.bypass_type}
                  onChange={set("bypass_type")}
                >
                  <option value="">—</option>
                  {BYPASS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Alimentation
                <input
                  type="text"
                  value={form.power}
                  onChange={set("power")}
                  placeholder="ex : 9V DC center-negative"
                />
              </label>
              <label>
                Connectique (séparée par des virgules)
                <input
                  type="text"
                  value={form.connectivity_text}
                  onChange={set("connectivity_text")}
                />
              </label>
              <label>
                Format
                <select value={form.format} onChange={set("format")}>
                  <option value="">—</option>
                  {PEDAL_FORMAT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label className="form-row">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={set("is_public")}
            />
            Rendre public (visible par mes amis)
          </label>
          <label className="form-row">
            <input
              type="checkbox"
              checked={form.is_favorite}
              onChange={set("is_favorite")}
            />
            Favori
          </label>
          <label className="form-row">
            <input
              type="checkbox"
              checked={form.is_wishlist}
              onChange={set("is_wishlist")}
            />
            Wishlist
          </label>

          {error && <p className="form-error">{error}</p>}

          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    );
  }

  // =============================================================
  //  Mode lecture
  // =============================================================

  return (
    <div className="page">
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      {item.photo_urls?.[0] && (
        <img
          className="detail-photo"
          src={item.photo_urls[0]}
          alt={item.name}
        />
      )}

      <h1>{item.name}</h1>
      <p className="muted">
        {CATEGORY_LABELS[item.category] || item.category}
        {item.brand ? ` · ${item.brand}` : ""}
        {item.model ? ` ${item.model}` : ""}
      </p>

      <div className="badge-row">
        {item.is_public && <span className="badge">Public</span>}
        {item.is_favorite && <span className="badge">★ Favori</span>}
        {item.is_wishlist && <span className="badge">🎁 Wishlist</span>}
      </div>

      {item.description && (
        <p className="detail-description">{item.description}</p>
      )}

      <h2>Caractéristiques</h2>
      <dl className="spec-list">
        {COMMON_VIEW_FIELDS.map((f) => (
          <div key={f.key} className="spec-row">
            <dt>{f.label}</dt>
            <dd>{renderValue(item, f)}</dd>
          </div>
        ))}
        {typeFields.map((f) => (
          <div key={f.key} className="spec-row">
            <dt>{f.label}</dt>
            <dd>{renderValue(item, f)}</dd>
          </div>
        ))}
      </dl>

      {canEdit && (
        <>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setEditing(true)}
          >
            ✏️ Modifier
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleDelete}
            style={{ borderColor: "#c0392b", color: "#c0392b" }}
          >
            🗑 Supprimer
          </button>
        </>
      )}
    </div>
  );
}
