import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { isOnline, formatLastSeen } from "../lib/friends";

export default function FriendRow({ profile, right, onClick }) {
  const navigate = useNavigate();

  const handleClick =
    onClick ?? (() => navigate(`/profil/${profile.username}`));

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username;

  return (
    <div className="friend-row">
      <button type="button" className="friend-row__main" onClick={handleClick}>
        <Avatar profile={profile} />
        <span className="friend-row__text">
          <span className="friend-row__name">{fullName}</span>
          <span className="friend-row__pseudo">@{profile.username}</span>
        </span>
      </button>

      <div className="friend-row__right">
        {right ?? (
          <span
            className={
              isOnline(profile.last_seen_at)
                ? "friend-row__status friend-row__status--online"
                : "friend-row__status"
            }
          >
            {formatLastSeen(profile.last_seen_at)}
          </span>
        )}
      </div>
    </div>
  );
}
