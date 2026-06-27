import supabase from "./../supabase-client";

async function uploadToBucket(bucket, userId, file) {
  if (!file) return { data: null, error: new Error("Aucun fichier sélectionné.") };
  if (!userId) return { data: null, error: new Error("Utilisateur non identifié.") };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) return { data: null, error: uploadError };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { data: { url: data.publicUrl, path }, error: null };
}

export function uploadAvatar(userId, file) {
  return uploadToBucket("avatars", userId, file);
}

export function uploadGearPhoto(userId, file) {
  return uploadToBucket("gear-photos", userId, file);
}
