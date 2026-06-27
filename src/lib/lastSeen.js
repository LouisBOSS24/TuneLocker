import supabase from "../supabase-client";

export async function touchLastSeen(userId) {
  if (!userId) return;
  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}
