import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import supabase from "../supabase-client";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!USERNAME_REGEX.test(form.username)) {
      setError(
        "Le pseudo doit faire 3 à 20 caractères (lettres, chiffres, underscore).",
      );
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setSubmitting(true);

    const { data: existing, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", form.username)
      .maybeSingle();

    if (lookupError) {
      setSubmitting(false);
      setError("Impossible de vérifier le pseudo. Réessaie.");
      return;
    }
    if (existing) {
      setSubmitting(false);
      setError("Ce pseudo est déjà pris, choisis-en un autre.");
      return;
    }

    const { error } = await signUp({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      username: form.username,
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setShowConfirmPopup(true);
  }

  return (
    <div className="page">
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <h1>Création de compte</h1>
      <p>
        Bienvenue sur TuneLocker 🎸 <br />
        Crée ton compte.
      </p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Prénom
          <input
            type="text"
            value={form.firstName}
            onChange={update("firstName")}
            placeholder="ex : Jean"
            required
          />
        </label>

        <label>
          Nom
          <input
            type="text"
            value={form.lastName}
            onChange={update("lastName")}
            placeholder="ex : Dupont"
            required
          />
        </label>

        <label>
          Pseudo
          <input
            type="text"
            value={form.username}
            onChange={update("username")}
            placeholder="ex : jeanDupont42"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="example@email.com"
            required
          />
        </label>

        <label>
          Mot de passe
          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            required
          />
        </label>

        <label>
          Confirmation du mot de passe
          <input
            type="password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            required
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={submitting}
        >
          {submitting ? "Création…" : "Créer un compte"}
        </button>
      </form>

      <Modal
        open={showConfirmPopup}
        title="Compte créé ! 🎉"
        actionLabel="Aller à la connexion"
        onClose={() => navigate("/login", { replace: true })}
      >
        Va vérifier ta boîte mail ({form.email}) et clique sur le lien pour
        valider ton compte avant de te connecter.
      </Modal>
    </div>
  );
}
