// Czy Supabase jest realnie skonfigurowany (a nie placeholder/brak).
// Dzięki temu apka nie wywala się, gdy nie ma jeszcze zmiennych środowiskowych
// (np. tuż po pierwszym wdrożeniu na Vercel, przed dodaniem kluczy).
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
