// Shared theme + display names, kept live on both phones.
import { useCallback, useEffect, useState } from "react";
import { fetchSettings, saveSetting, subscribeSettings } from "@/site/lib/chat-settings.ts";
import { getNames, setNames, useNames, type NameMap } from "@/site/lib/names.ts";
import { cacheTheme, readCachedTheme, resolveTheme, toStored, type IgTheme, type StoredTheme } from "./themes.ts";

export function useSharedSettings() {
  const [theme, setTheme] = useState<IgTheme>(() => resolveTheme(readCachedTheme()));
  const names = useNames();

  useEffect(() => {
    let alive = true;
    void fetchSettings().then((s) => {
      if (!alive) return;
      if (s.theme) {
        setTheme(resolveTheme(s.theme as StoredTheme));
        cacheTheme(s.theme as StoredTheme);
      }
      if (s.names) setNames(s.names);
    });
    const unsub = subscribeSettings((key, value) => {
      if (key === "names") { setNames(value); return; }
      if (key !== "theme") return;
      setTheme(resolveTheme(value as StoredTheme));
      cacheTheme(value as StoredTheme);
    });
    return () => { alive = false; unsub(); };
  }, []);

  const applyTheme = useCallback(async (t: IgTheme) => {
    setTheme(t);
    const stored = toStored(t);
    cacheTheme(stored);
    return saveSetting("theme", stored);
  }, []);

  const applyNames = useCallback(async (next: Partial<NameMap>) => {
    const merged = setNames({ ...getNames(), ...next });
    return saveSetting("names", merged);
  }, []);

  return { theme, applyTheme, names, applyNames };
}
