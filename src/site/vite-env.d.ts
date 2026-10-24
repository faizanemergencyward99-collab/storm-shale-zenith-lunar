/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_MUSIC_BUCKET?: string;
  readonly VITE_WAKE_UP_API_BASE?: string;
  readonly VITE_GIPHY_API_KEY?: string;
  readonly VITE_GIPHY_STICKERS_API_KEY?: string;
}
