import supabase from "../supabase-client";

// =============================================================
//  Configuration
// =============================================================

const EXTENSION_TABLE = {
  guitar: "gear_guitar",
  amp: "gear_amp",
  pedal: "gear_pedal",
};

export const CATEGORY_LABELS = {
  guitar: "Guitare",
  amp: "Ampli",
  pedal: "Pédale",
  synth: "Synthé",
  drum: "Batterie",
  microphone: "Micro",
  accessory: "Accessoire",
};

// =============================================================
//  Helpers
// =============================================================

export function splitList(text) {
  if (!text) return [];
  return text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toText(value) {
  if (value === "" || value === null || value === undefined) return null;
  return value;
}

export function formatPrice(amount) {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  const mo = Math.floor(d / 30);
  if (mo >= 1) return `Il y a ${mo}mo`;
  if (d >= 1) return `Il y a ${d}j`;
  if (h >= 1) return `Il y a ${h}h`;
  if (min >= 1) return `Il y a ${min}min`;
  return "À l'instant";
}

export function buildTypeData(category, form) {
  if (category === "guitar") {
    return {
      guitar_type: toText(form.guitar_type),
      guitar_shape: toText(form.guitar_shape),
      num_strings: toNumber(form.num_strings),
      num_frets: toNumber(form.num_frets),
      body_wood: toText(form.body_wood),
      neck_wood: toText(form.neck_wood),
      fretboard_wood: toText(form.fretboard_wood),
      pickup_config: toText(form.pickup_config),
      pickup_models: splitList(form.pickup_models_text),
      pickup_active: form.pickup_active,
      bridge: toText(form.bridge),
      scale_length_mm: toNumber(form.scale_length_mm),
      construction_type: toText(form.construction_type),
    };
  }
  if (category === "amp") {
    return {
      amp_type: toText(form.amp_type),
      technology: toText(form.technology),
      wattage: toNumber(form.wattage),
      num_channels: toNumber(form.num_channels),
      speakers: splitList(form.speakers_text),
      builtin_effects: splitList(form.builtin_effects_text),
      main_controls: splitList(form.main_controls_text),
      main_connectivity: splitList(form.main_connectivity_text),
    };
  }
  if (category === "pedal") {
    return {
      effect_type: toText(form.effect_type),
      technology: toText(form.technology),
      main_controls: splitList(form.main_controls_text),
      bypass_type: toText(form.bypass_type),
      power: toText(form.power),
      connectivity: splitList(form.connectivity_text),
      format: toText(form.format),
    };
  }
  return null;
}

export async function createGearItem({ baseData, category, typeData }) {
  const tableName = EXTENSION_TABLE[category];
  if (!tableName) {
    return { data: null, error: new Error(`Catégorie inconnue : ${category}`) };
  }

  const { data: gearRow, error: gearError } = await supabase
    .from("gear")
    .insert({ ...baseData, category })
    .select("id")
    .single();

  if (gearError) return { data: null, error: gearError };

  const { error: extError } = await supabase
    .from(tableName)
    .insert({ ...typeData, gear_id: gearRow.id });

  if (extError) {
    await supabase.from("gear").delete().eq("id", gearRow.id);
    return { data: null, error: extError };
  }

  return { data: { gearId: gearRow.id }, error: null };
}

export async function getMyGearSummary(userId) {
  const { data, error, count } = await supabase
    .from("gear")
    .select("estimated_value", { count: "exact" })
    .eq("owner_id", userId);

  if (error) return { data: null, error };

  const total = (data || []).reduce(
    (sum, row) => sum + (Number(row.estimated_value) || 0),
    0,
  );

  return { data: { total, count: count ?? 0 }, error: null };
}

export async function getMyGear(userId, options = {}) {
  let query = supabase
    .from("gear")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (options.category) {
    query = query.eq("category", options.category);
  }
  if (options.search) {
    const pattern = `%${options.search.replace(/[%_,()]/g, "")}%`;
    query = query.or(
      `name.ilike.${pattern},brand.ilike.${pattern},model.ilike.${pattern}`,
    );
  }
  const { data, error } = await query;
  return { data, error };
}

export async function getActivityFeed(currentUserId) {
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

  const friendIds = (friendships || []).map((f) =>
    f.requester_id === currentUserId ? f.addressee_id : f.requester_id,
  );

  const visibleOwners = [currentUserId, ...friendIds];

  const { data: items, error } = await supabase
    .from("gear")
    .select(
      "id, owner_id, category, name, brand, model, photo_urls, created_at, is_public",
    )
    .in("owner_id", visibleOwners)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return { data: null, error };

  const filtered = (items || []).filter(
    (it) => it.owner_id === currentUserId || it.is_public,
  );

  if (filtered.length === 0) return { data: [], error: null };

  const ownerIds = [...new Set(filtered.map((i) => i.owner_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username, avatar_url")
    .in("id", ownerIds);

  const profileMap = Object.fromEntries(
    (profiles || []).map((p) => [p.id, p]),
  );

  return {
    data: filtered.map((it) => ({
      ...it,
      author: profileMap[it.owner_id] || null,
    })),
    error: null,
  };
}

export async function getGearDetail(gearId) {
  const { data: gear, error } = await supabase
    .from("gear")
    .select("*")
    .eq("id", gearId)
    .maybeSingle();

  if (error || !gear) return { data: gear, error };

  const tableName = EXTENSION_TABLE[gear.category];
  if (!tableName) return { data: gear, error: null };

  const { data: ext } = await supabase
    .from(tableName)
    .select("*")
    .eq("gear_id", gearId)
    .maybeSingle();

  return { data: { ...gear, ...(ext || {}) }, error: null };
}

export async function updateGearBase(gearId, changes) {
  const { data, error } = await supabase
    .from("gear")
    .update(changes)
    .eq("id", gearId)
    .select()
    .single();
  return { data, error };
}

export async function updateGearExtension(category, gearId, changes) {
  const tableName = EXTENSION_TABLE[category];
  if (!tableName) return { data: null, error: null };
  const { data, error } = await supabase
    .from(tableName)
    .update(changes)
    .eq("gear_id", gearId)
    .select()
    .single();
  return { data, error };
}

export async function deleteGear(gearId) {
  const { error } = await supabase.from("gear").delete().eq("id", gearId);
  return { error };
}
