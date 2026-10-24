// Shared chat settings (theme) in the `chat_settings` table,
// synced live to both phones via Supabase Realtime.
import { supabase, isSupabaseConfigured } from "./supabase";

export type SettingKey = "theme" | "names";
export type SettingsMap = Partial<Record<SettingKey, unknown>>;

export async function fetchSettings(): Promise<SettingsMap> {
  if (!isSupabaseConfigured) return {};
  try {
    const { data, error } = await supabase.from("chat_settings").select("key, value");
    if (error || !data) return {};
    const out: SettingsMap = {};
    for (const row of data as { key: SettingKey; value: unknown }[]) out[row.key] = row.value;
    return out;
  } catch {
    return {};
  }
}

export async function saveSetting(key: SettingKey, value: unknown): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from("chat_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    return !error;
  } catch {
    return false;
  }
}

export function subscribeSettings(onChange: (key: SettingKey, value: unknown) => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  const ch = supabase
    .channel("chat_settings_stream")
    .on("postgres_changes", { event: "*", schema: "public", table: "chat_settings" }, (payload) => {
      const row = (payload.new ?? {}) as { key?: SettingKey; value?: unknown };
      if (row.key) onChange(row.key, row.value);
    })
    .subscribe();
  return () => {
    try {
      void supabase.removeChannel(ch);
    } catch {
      /* ignore */
    }
  };
}
