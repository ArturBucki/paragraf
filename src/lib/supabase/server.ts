import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "./config";

// Klient Supabase używany po stronie serwera (Server Components, Server Actions, Route Handlers).
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Wywołane z Server Component — odświeżanie sesji obsługuje middleware.
        }
      },
    },
  });
}

// Bezpieczne pobranie zalogowanego użytkownika.
// Zwraca null, gdy Supabase nie jest jeszcze skonfigurowany albo wystąpił błąd —
// dzięki temu strony nie wywalają się przed podłączeniem bazy.
export async function currentUser() {
  if (!supabaseConfigured) return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
