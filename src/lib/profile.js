import supabase from "../supabase-client";

export async function getMyProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, username, bio, avatar_url, last_seen_at, is_admin",
    )
    .eq("id", userId)
    .maybeSingle();
  return { data, error };
}

export async function updateMyProfile(userId, changes) {
  if (changes.username) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", changes.username)
      .neq("id", userId)
      .maybeSingle();
    if (existing) {
      return {
        data: null,
        error: new Error("Ce pseudo est déjà pris."),
      };
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...changes }, { onConflict: "id" })
    .select()
    .maybeSingle();

  if (error) return { data: null, error };

  const metaKeys = ["first_name", "last_name", "username", "bio", "avatar_url"];
  const metaChanges = {};
  for (const k of metaKeys) {
    if (k in changes) metaChanges[k] = changes[k];
  }
  if (Object.keys(metaChanges).length > 0) {
    await supabase.auth.updateUser({ data: metaChanges });
  }

  return { data, error: null };
}

export async function deleteMyAccount() {
  const { error } = await supabase.rpc("delete_my_account");
  return { error };
}
