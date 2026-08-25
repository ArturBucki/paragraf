import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

type Client = ReturnType<typeof createBrowserClient>;
let cached: Client | null = null;

/**
 * Jeden klient na całą przeglądarkę.
 * Każde wywołanie createBrowserClient otwiera własne połączenie realtime —
 * przy trzech komponentach naraz robiły się trzy websockety i trzy sesje auth.
 */
export function createClient(): Client {
  if (typeof window === "undefined") {
    // Na serwerze nie cache'ujemy — każde żądanie ma własny kontekst.
    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  if (!cached) cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}
