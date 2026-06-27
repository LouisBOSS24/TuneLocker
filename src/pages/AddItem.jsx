import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import ImageUpload from "../components/ImageUpload";
import {
  createGearItem,
  splitList,
  toNumber,
  toText,
  buildTypeData,
} from "../lib/gear";
import { uploadGearPhoto } from "../lib/storage";

// =============================================================
//  Listes d'options
// =============================================================

const CATEGORY_LABELS = {
  guitar: "🎸 Guitare",
  amp: "🔊 Ampli",
  pedal: "🎚 Pédale",
};

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
  "SSS",
  "HH",
  "HSS",
  "HSH",
  "SS",
  "H",
  "S",
  "P",
  "J",
  "PJ",
  "none",
  "custom",
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
  { value: "overdrive", label: "Overdrive" },
  { value: "distortion", label: "Distortion" },
  { value: "fuzz", label: "Fuzz" },
  { value: "boost", label: "Boost" },
  { value: "compressor", label: "Compresseur" },
  { value: "eq", label: "Égaliseur" },
  { value: "delay", label: "Delay" },
  { value: "reverb", label: "Reverb" },
  { value: "chorus", label: "Chorus" },
  { value: "flanger", label: "Flanger" },
  { value: "phaser", label: "Phaser" },
  { value: "tremolo", label: "Tremolo" },
  { value: "vibrato", label: "Vibrato" },
  { value: "octaver", label: "Octaver" },
  { value: "pitch", label: "Pitch" },
  { value: "harmonizer", label: "Harmonizer" },
  { value: "wah", label: "Wah" },
  { value: "filter", label: "Filtre" },
  { value: "noise_gate", label: "Noise gate" },
  { value: "looper", label: "Looper" },
  { value: "tuner", label: "Accordeur" },
  { value: "utility", label: "Utilitaire" },
  { value: "multi", label: "Multi-effets" },
  { value: "other", label: "Autre" },
];

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
  { value: "mini", label: "Mini" },
  { value: "standard", label: "Standard" },
  { value: "double", label: "Double" },
  { value: "triple", label: "Triple" },
  { value: "rack", label: "Rack" },
  { value: "desktop", label: "Desktop" },
  { value: "other", label: "Autre" },
];

const EMPTY_FORM = {
  name: "",
  brand: "",
  model: "",
  year: "",
  country: "",
  color: "",
  weight_g: "",
  condition: "",
  purchase_date: "",
  purchase_price: "",
  estimated_value: "",
  description: "",
  photo_urls_text: "",
  is_public: false,
  is_favorite: false,
  is_wishlist: false,
  guitar_type: "",
  guitar_shape: "",
  num_strings: "",
  num_frets: "",
  body_wood: "",
  neck_wood: "",
  fretboard_wood: "",
  pickup_config: "",
  pickup_models_text: "",
  pickup_active: false,
  bridge: "",
  scale_length_mm: "",
  construction_type: "",
  amp_type: "",
  technology: "",
  wattage: "",
  num_channels: "",
  speakers_text: "",
  builtin_effects_text: "",
  main_controls_text: "",
  main_connectivity_text: "",
  effect_type: "",
  bypass_type: "",
  power: "",
  connectivity_text: "",
  format: "",
};

// =============================================================
//  Page AddItem
// =============================================================

export default function AddItem() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formType, setFormType] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);

  function pickType(type) {
    setFormType(type);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function update(field) {
    return (e) => {
      const value =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Tu dois être connecté.");
      return;
    }

    const baseData = {
      owner_id: user.id,
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
      photo_urls: splitList(form.photo_urls_text),
      is_public: form.is_public,
      is_favorite: form.is_favorite,
      is_wishlist: form.is_wishlist,
    };

    setSubmitting(true);
    const { error: insertError } = await createGearItem({
      baseData,
      category: formType,
      typeData: buildTypeData(formType, form),
    });
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccessOpen(true);
  }

  return (
    <div className="page">
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>
      <h1>Ajouter du matériel</h1>

      <div className="tabs">
        <button
          type="button"
          className={formType === "guitar" ? "tab tab--active" : "tab"}
          onClick={() => pickType("guitar")}
        >
          🎸 Guitare
        </button>
        <button
          type="button"
          className={formType === "amp" ? "tab tab--active" : "tab"}
          onClick={() => pickType("amp")}
        >
          🔊 Ampli
        </button>
        <button
          type="button"
          className={formType === "pedal" ? "tab tab--active" : "tab"}
          onClick={() => pickType("pedal")}
        >
          🎚 Pédale
        </button>
      </div>

      {!formType && (
        <p className="muted">Choisis une catégorie pour démarrer.</p>
      )}

      {formType && (
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Catégorie
            <select value={formType} disabled>
              <option value={formType}>{CATEGORY_LABELS[formType]}</option>
            </select>
          </label>

          <label>
            Nom *
            <input
              type="text"
              value={form.name}
              onChange={update("name")}
              placeholder="ex : Gibson Les Paul Standard 60s"
              required
            />
          </label>
          <label>
            Marque
            <input
              type="text"
              value={form.brand}
              onChange={update("brand")}
              placeholder="ex : Gibson"
            />
          </label>
          <label>
            Modèle
            <input
              type="text"
              value={form.model}
              onChange={update("model")}
              placeholder="ex : Les Paul Standard"
            />
          </label>
          <label>
            Année
            <input
              type="number"
              min="1900"
              max="2100"
              value={form.year}
              onChange={update("year")}
              placeholder="ex : 2020"
            />
          </label>
          <label>
            Pays de fabrication
            <input
              type="text"
              value={form.country}
              onChange={update("country")}
              placeholder="ex : USA"
            />
          </label>
          <label>
            Couleur
            <input
              type="text"
              value={form.color}
              onChange={update("color")}
              placeholder="ex : Sunburst"
            />
          </label>
          <label>
            Poids (g)
            <input
              type="number"
              min="0"
              value={form.weight_g}
              onChange={update("weight_g")}
              placeholder="ex : 4000"
            />
          </label>
          <label>
            État
            <select value={form.condition} onChange={update("condition")}>
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
              onChange={update("purchase_date")}
            />
          </label>
          <label>
            Prix d'achat (€)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.purchase_price}
              onChange={update("purchase_price")}
              placeholder="ex : 2500"
            />
          </label>
          <label>
            Valeur estimée (€)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.estimated_value}
              onChange={update("estimated_value")}
              placeholder="ex : 2899"
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={update("description")}
              rows="3"
              placeholder="Décris ton matériel..."
            />
          </label>
          <label>
            Photo
            <ImageUpload
              label="Importer une photo"
              currentUrl={form.photo_urls_text}
              uploadFn={(file) => uploadGearPhoto(user.id, file)}
              onUploaded={(url) =>
                setForm((prev) => ({ ...prev, photo_urls_text: url }))
              }
            />
          </label>

          <label className="form-row">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={update("is_public")}
            />
            Rendre public (visible par mes amis)
          </label>
          <label className="form-row">
            <input
              type="checkbox"
              checked={form.is_favorite}
              onChange={update("is_favorite")}
            />
            Favori
          </label>

          {formType === "guitar" && (
            <>
              <h1>Détails guitare</h1>
              <label>
                Type de guitare
                <select
                  value={form.guitar_type}
                  onChange={update("guitar_type")}
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
                  onChange={update("guitar_shape")}
                  placeholder="ex : Les Paul"
                />
              </label>
              <label>
                Nombre de cordes
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.num_strings}
                  onChange={update("num_strings")}
                  placeholder="ex : 6"
                />
              </label>
              <label>
                Nombre de frettes
                <input
                  type="number"
                  min="0"
                  max="36"
                  value={form.num_frets}
                  onChange={update("num_frets")}
                  placeholder="ex : 22"
                />
              </label>
              <label>
                Bois du corps
                <input
                  type="text"
                  value={form.body_wood}
                  onChange={update("body_wood")}
                  placeholder="ex : Acajou"
                />
              </label>
              <label>
                Bois du manche
                <input
                  type="text"
                  value={form.neck_wood}
                  onChange={update("neck_wood")}
                  placeholder="ex : Acajou"
                />
              </label>
              <label>
                Bois de la touche
                <input
                  type="text"
                  value={form.fretboard_wood}
                  onChange={update("fretboard_wood")}
                  placeholder="ex : Palissandre"
                />
              </label>
              <label>
                Configuration des micros
                <select
                  value={form.pickup_config}
                  onChange={update("pickup_config")}
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
                  onChange={update("pickup_models_text")}
                  placeholder="Burstbucker Pro, ’57 Classic…"
                />
              </label>
              <label className="form-row">
                <input
                  type="checkbox"
                  checked={form.pickup_active}
                  onChange={update("pickup_active")}
                />
                Micros actifs
              </label>
              <label>
                Chevalet
                <input
                  type="text"
                  value={form.bridge}
                  onChange={update("bridge")}
                  placeholder="ex : Tune-O-Matic"
                />
              </label>
              <label>
                Diapason (mm)
                <input
                  type="number"
                  min="300"
                  max="1000"
                  value={form.scale_length_mm}
                  onChange={update("scale_length_mm")}
                  placeholder="ex : 628"
                />
              </label>
              <label>
                Type de construction
                <select
                  value={form.construction_type}
                  onChange={update("construction_type")}
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

          {formType === "amp" && (
            <>
              <h1>Détails ampli</h1>
              <label>
                Type d'ampli
                <select value={form.amp_type} onChange={update("amp_type")}>
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
                <select value={form.technology} onChange={update("technology")}>
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
                  onChange={update("wattage")}
                  placeholder="ex : 50"
                />
              </label>
              <label>
                Nombre de canaux
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={form.num_channels}
                  onChange={update("num_channels")}
                  placeholder="ex : 2"
                />
              </label>
              <label>
                Haut-parleurs (séparés par des virgules)
                <input
                  type="text"
                  value={form.speakers_text}
                  onChange={update("speakers_text")}
                  placeholder='1x12" Celestion V30…'
                />
              </label>
              <label>
                Effets intégrés (séparés par des virgules)
                <input
                  type="text"
                  value={form.builtin_effects_text}
                  onChange={update("builtin_effects_text")}
                  placeholder="reverb, delay, chorus…"
                />
              </label>
              <label>
                Contrôles principaux (séparés par des virgules)
                <input
                  type="text"
                  value={form.main_controls_text}
                  onChange={update("main_controls_text")}
                  placeholder="gain, volume, bass, mid, treble…"
                />
              </label>
              <label>
                Connectique principale (séparée par des virgules)
                <input
                  type="text"
                  value={form.main_connectivity_text}
                  onChange={update("main_connectivity_text")}
                  placeholder="input, fx loop, headphones…"
                />
              </label>
            </>
          )}

          {formType === "pedal" && (
            <>
              <h1>Détails pédale</h1>
              <label>
                Type d'effet
                <select
                  value={form.effect_type}
                  onChange={update("effect_type")}
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
                <select value={form.technology} onChange={update("technology")}>
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
                  onChange={update("main_controls_text")}
                  placeholder="drive, tone, level…"
                />
              </label>
              <label>
                Bypass
                <select
                  value={form.bypass_type}
                  onChange={update("bypass_type")}
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
                  onChange={update("power")}
                  placeholder="ex : 9V DC center-negative"
                />
              </label>
              <label>
                Connectique (séparée par des virgules)
                <input
                  type="text"
                  value={form.connectivity_text}
                  onChange={update("connectivity_text")}
                  placeholder="input, output, expression in…"
                />
              </label>
              <label>
                Format
                <select value={form.format} onChange={update("format")}>
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

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? "Ajout…" : "Ajouter"}
          </button>
        </form>
      )}

      <Modal
        open={successOpen}
        title="Ajouté ! 🎉"
        actionLabel="Voir mon Locker"
        onClose={() => navigate("/locker")}
      >
        Ton matériel a bien été ajouté à ton casier.
      </Modal>
    </div>
  );
}
