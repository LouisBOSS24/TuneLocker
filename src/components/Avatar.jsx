const PALETTE = [
  "#d47838",
  "#7938d4",
  "#3aa17e",
  "#3c7fbf",
  "#c4456b",
  "#a17a2a",
  "#5a6acf",
  "#2f9eaf",
];

function pickColor(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ profile, size = 48 }) {
  const key = profile?.username || profile?.id || "?";
  const letter =
    profile?.first_name?.[0]?.toUpperCase() ||
    profile?.username?.[0]?.toUpperCase() ||
    "?";

  if (profile?.avatar_url) {
    return (
      <img
        className="avatar avatar--photo"
        src={profile.avatar_url}
        alt=""
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        backgroundColor: pickColor(key),
      }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
