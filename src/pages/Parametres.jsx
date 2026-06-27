import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ImageUpload from "../components/ImageUpload";
import Modal from "../components/Modal";
import { getMyProfile, updateMyProfile, deleteMyAccount } from "../lib/profile";
import { uploadAvatar } from "../lib/storage";
import supabase from "../supabase-client";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function Parametres() {
  const { user, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    bio: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(
    typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-theme") || "light"
      : "light",
  );

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getMyProfile(user.id);
    if (data) {
      setProfile(data);
      setForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        username: data.username || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const usernameChanged =
      (form.username || "") !== (profile?.username || "");
    if (usernameChanged && form.username && !USERNAME_REGEX.test(form.username)) {
      setError(
        "Pseudo invalide (3 à 20 caractères, lettres / chiffres / underscore).",
      );
      return;
    }

    const fields = ["first_name", "last_name", "username", "bio", "avatar_url"];
    const changes = {};
    for (const f of fields) {
      const current = form[f] || "";
      const original = profile?.[f] || "";
      if (current !== original) {
        changes[f] = form[f] || null;
      }
    }

    if (Object.keys(changes).length === 0) {
      setMessage("Rien à enregistrer — aucun champ modifié.");
      return;
    }

    setSaving(true);
    const { error: upErr } = await updateMyProfile(user.id, changes);
    setSaving(false);

    if (upErr) {
      setError(upErr.message);
      return;
    }
    setMessage("Profil mis à jour ✓");
    load();
  }

  async function handlePasswordReset() {
    const { error: rErr } = await resetPassword(user.email);
    if (rErr) {
      setError(rErr.message);
    } else {
      setMessage(`Email de changement de mot de passe envoyé à ${user.email}.`);
    }
  }

  function applyTheme(next) {
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("tunelocker_theme", next);
    setTheme(next);
  }

  async function handleDeleteAccount() {
    const yes1 = confirm(
      "⚠️ Supprimer définitivement ton compte TuneLocker ?\n\n" +
        "Toutes tes données (matériel, photos, amis) seront perdues. " +
        "Cette action est irréversible.",
    );
    if (!yes1) return;
    const yes2 = prompt("Pour confirmer, tape SUPPRIMER en majuscules :");
    if (yes2 !== "SUPPRIMER") {
      setError("Suppression annulée (texte de confirmation incorrect).");
      return;
    }

    const { error: dErr } = await deleteMyAccount();
    if (dErr) {
      setError("Impossible de supprimer le compte : " + dErr.message);
      return;
    }

    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>
      <h1>Paramètres</h1>

      <section className="settings-section">
        <h2>Profil</h2>

        <form onSubmit={handleSave} className="form">
          <label>
            Photo de profil
            <ImageUpload
              label="Changer ma photo"
              currentUrl={form.avatar_url}
              uploadFn={(file) => uploadAvatar(user.id, file)}
              onUploaded={(url) =>
                setForm((prev) => ({ ...prev, avatar_url: url }))
              }
            />
          </label>

          <label>
            Prénom
            <input
              type="text"
              value={form.first_name}
              onChange={set("first_name")}
            />
          </label>

          <label>
            Nom
            <input
              type="text"
              value={form.last_name}
              onChange={set("last_name")}
            />
          </label>

          <label>
            Pseudo
            <input
              type="text"
              value={form.username}
              onChange={set("username")}
              placeholder="3-20 caractères : lettres, chiffres, _"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>

          <label>
            Biographie
            <textarea
              value={form.bio}
              onChange={set("bio")}
              rows="3"
              placeholder="Quelques mots sur toi…"
            />
          </label>

          <label>
            Email
            <input type="email" value={user?.email || ""} disabled />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>

        <button
          type="button"
          className="btn"
          onClick={handlePasswordReset}
          style={{ marginTop: 12 }}
        >
          Modifier mon mot de passe
        </button>
      </section>

      <section className="settings-section">
        <h2>Préférences</h2>

        <label>Thème</label>
        <div className="chip-row">
          <button
            type="button"
            className={theme === "light" ? "chip chip--active" : "chip"}
            onClick={() => applyTheme("light")}
          >
            ☀️ Clair
          </button>
          <button
            type="button"
            className={theme === "dark" ? "chip chip--active" : "chip"}
            onClick={() => applyTheme("dark")}
          >
            🌙 Sombre
          </button>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          Raccourci clavier : appuie sur <kbd>T</kbd> pour basculer rapidement.
        </p>
      </section>

      <section className="settings-section">
        <h2>Zone dangereuse</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          La suppression de compte est définitive : matériel, photos, amis,
          tout sera effacé sans possibilité de récupération.
        </p>
        <button
          type="button"
          className="btn"
          onClick={handleDeleteAccount}
          style={{
            borderColor: "#c0392b",
            color: "#c0392b",
          }}
        >
          🗑 Supprimer mon compte
        </button>
      </section>

      <Modal
        open={message !== null}
        title="✓"
        actionLabel="OK"
        onClose={() => setMessage(null)}
      >
        {message}
      </Modal>
    </div>
  );
}
