import supabase from "../supabase-client";

// =============================================================
//  Recherche et relations
// =============================================================

export async function searchProfiles(currentUserId, query) {
  const q = (query || "").trim();
  if (!q) return { data: [], error: null };

  const cleaned = q.replace(/[%_,()]/g, "").trim();
  if (!cleaned) return { data: [], error: null };

  const pattern = `%${cleaned}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username, last_seen_at, avatar_url")
    .or(
      `username.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`,
    )
    .limit(20);

  if (error) {
    return { data: null, error };
  }

  const tagged = (data || []).map((p) => ({
    ...p,
    isSelf: p.id === currentUserId,
  }));

  return { data: tagged, error: null };
}

export async function getProfileByUsername(username) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username, bio, avatar_url, last_seen_at")
    .eq("username", username)
    .maybeSingle();

  return { data, error };
}

async function attachProfiles(rows, getOtherId) {
  if (!rows || rows.length === 0) return [];
  const ids = rows.map(getOtherId);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username, last_seen_at, avatar_url")
    .in("id", ids);
  return rows
    .map((r) => ({
      friendshipId: r.id,
      profile: profiles?.find((p) => p.id === getOtherId(r)),
    }))
    .filter((r) => r.profile);
}

export async function getFriends(currentUserId) {
  const { data: rows, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

  if (error) return { data: null, error };
  const data = await attachProfiles(rows, (r) =>
    r.requester_id === currentUserId ? r.addressee_id : r.requester_id,
  );
  return { data, error: null };
}

export async function getIncomingRequests(currentUserId) {
  const { data: rows, error } = await supabase
    .from("friendships")
    .select("id, requester_id")
    .eq("status", "pending")
    .eq("addressee_id", currentUserId);

  if (error) return { data: null, error };
  const data = await attachProfiles(rows, (r) => r.requester_id);
  return { data, error: null };
}

export async function getRelationshipStatus(currentUserId, otherUserId) {
  const { data, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${currentUserId})`,
    )
    .maybeSingle();

  if (error) return { data: null, error };
  if (!data) return { data: { status: "none", friendshipId: null }, error: null };

  if (data.status === "accepted") {
    return { data: { status: "friends", friendshipId: data.id }, error: null };
  }
  const status =
    data.requester_id === currentUserId ? "pending_outgoing" : "pending_incoming";
  return { data: { status, friendshipId: data.id }, error: null };
}

export async function sendFriendRequest(currentUserId, addresseeId) {
  const { data, error } = await supabase
    .from("friendships")
    .insert({
      requester_id: currentUserId,
      addressee_id: addresseeId,
      status: "pending",
    })
    .select()
    .single();
  return { data, error };
}

export async function acceptFriendRequest(friendshipId) {
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)
    .select()
    .single();
  return { data, error };
}

export async function declineFriendRequest(friendshipId) {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);
  return { error };
}

export async function removeFriendship(friendshipId) {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);
  return { error };
}

// =============================================================
//  Présence (last_seen_at)
// =============================================================

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export function isOnline(lastSeenAt) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

export function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return "—";
  if (isOnline(lastSeenAt)) return "En ligne";

  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months >= 1) return `Il y a ${months}mo`;
  if (days >= 1) return `Il y a ${days}j`;
  if (hours >= 1) return `Il y a ${hours}h`;
  if (minutes >= 1) return `Il y a ${minutes}min`;
  return "À l'instant";
}
