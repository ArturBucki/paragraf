import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Wszystko poza plikami statycznymi i obrazami.
    // Service worker i manifest MUSZĄ być dostępne bez logowania — inaczej
    // przeglądarka dostaje przekierowanie na /login zamiast pliku i push nie działa.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt)$).*)",
  ],
};
