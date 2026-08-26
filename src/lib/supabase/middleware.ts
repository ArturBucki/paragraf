import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "./config";

// Odświeża sesję użytkownika przy każdym żądaniu i chroni prywatne trasy.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Zanim podłączysz Supabase (brak zmiennych env) — nie blokuj i nie wywalaj stron.
  if (!supabaseConfigured) return response;

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    // Regulamin i polityka muszą być czytelne BEZ konta — inaczej nie da się
    // ich przeczytać przed rejestracją, a to jest cały sens ich pokazywania.
    path.startsWith("/regulamin") ||
    path.startsWith("/prywatnosc");

  // Niezalogowany na prywatnej trasie -> na logowanie.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
