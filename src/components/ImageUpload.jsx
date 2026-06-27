import { useRef, useState } from "react";

export default function ImageUpload({
  uploadFn,
  onUploaded,
  label = "Choisir une photo",
  currentUrl,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(currentUrl || null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const { data, error: upErr } = await uploadFn(file);
    setUploading(false);

    if (upErr) {
      setError(upErr.message || "Erreur d'upload.");
      return;
    }

    setPreview(data.url);
    onUploaded?.(data.url);
  }

  return (
    <div className="image-upload">
      {preview && (
        <img className="image-upload__preview" src={preview} alt="aperçu" />
      )}
      <button
        type="button"
        className="btn"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Upload…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
