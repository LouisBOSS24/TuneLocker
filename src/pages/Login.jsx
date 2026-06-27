import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";

export default function Login() {
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetPopup, setResetPopup] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error } = await signIn({ email, password });

    setSubmitting(false);

    if (error) {
      if (error.message?.toLowerCase().includes("not confirmed")) {
        setError(
          "Ton compte n'est pas encore validé. Va vérifier tes mails pour confirmer ton inscription.",
        );
      } else {
        setError("Email ou mot de passe incorrect.");
      }
      return;
    }

    navigate("/home", { replace: true });
  }

  async function handleForgotPassword() {
    setError(null);

    if (!email) {
      setError("Saisis d'abord ton adresse email, puis reclique sur le lien.");
      return;
    }

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      return;
    }

    setResetPopup(
      `Un email de réinitialisation a été envoyé à ${email}. Suis le lien pour choisir un nouveau mot de passe.`,
    );
  }

  return (
    <div className="page">
      <button type="button" className="btn-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <h1>Connexion</h1>
      <p>
        Bienvenue sur TuneLocker 🎸 <br />
        Connecte-toi avec ton adresse e-mail.
      </p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
          />
        </label>

        <label>
          Mot de passe
          <div className="input-with-button">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="eye-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
              }
            >
              <span
                className={`eye-icon ${
                  showPassword ? "eye-icon--off" : "eye-icon--on"
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
          <button
            type="button"
            className="link-muted link-forgot"
            onClick={handleForgotPassword}
          >
            Mot de passe oublié ?
          </button>
        </label>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={submitting}
        >
          {submitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p>
        Pas encore de compte ?{" "}
        <button
          type="button"
          className="link-muted"
          onClick={() => navigate("/register")}
        >
          Créer un compte
        </button>
      </p>

      <Modal
        open={resetPopup !== null}
        title="Email envoyé 📬"
        actionLabel="OK"
        onClose={() => setResetPopup(null)}
      >
        {resetPopup}
      </Modal>
    </div>
  );
}
