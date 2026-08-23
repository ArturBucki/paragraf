import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/swipe");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="font-mono text-xs uppercase tracking-[0.16em] text-inksoft">
        randki inaczej
      </span>
      <h1 className="font-display text-4xl font-extrabold leading-tight">
        para<span className="text-coral">graf</span>
      </h1>
      <p className="max-w-sm text-lg text-inksoft">
        Match to dopiero początek. Zamiast pustego „hej” wybieracie razem grę —
        i dopiero ona otwiera rozmowę.
      </p>
      <Link
        href="/login"
        className="rounded-2xl bg-coral px-8 py-4 font-bold text-white shadow-lg"
      >
        Zaczynamy
      </Link>
    </main>
  );
}
