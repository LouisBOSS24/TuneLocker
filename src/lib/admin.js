import supabase from "../supabase-client";

export async function isMeAdmin(userId) {
  if (!userId) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return !!data?.is_admin;
}

export async function getAllUsersForAdmin() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username, avatar_url, is_admin, created_at")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };

  const { data: gear } = await supabase
    .from("gear")
    .select("owner_id, estimated_value");

  const statsByOwner = {};
  for (const g of gear || []) {
    if (!statsByOwner[g.owner_id]) {
      statsByOwner[g.owner_id] = { count: 0, total: 0 };
    }
    statsByOwner[g.owner_id].count++;
    statsByOwner[g.owner_id].total += Number(g.estimated_value) || 0;
  }

  const enriched = (profiles || []).map((p) => ({
    ...p,
    gear_count: statsByOwner[p.id]?.count || 0,
    gear_total: statsByOwner[p.id]?.total || 0,
  }));

  return { data: enriched, error: null };
}

export async function getUserGearForAdmin(userId) {
  const { data, error } = await supabase
    .from("gear")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function adminDeleteUser(targetUserId) {
  const { error } = await supabase.rpc("admin_delete_user", {
    target_user_id: targetUserId,
  });
  return { error };
}
