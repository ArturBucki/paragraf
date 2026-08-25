import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { MatchesList, type MatchRow } from "@/components/MatchesList";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const list = matches ?? [];
  const otherIds = list.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));

  const [{ data: others }, { data: games }] = await Promise.all([
    otherIds.length
      ? supabase.from("profiles").select("*").in("id", otherIds)
      : Promise.resolve({ data: [] as Profile[] }),
    list.length
      ? supabase
          .from("match_games")
          .select("*")
          .in(
            "match_id",
            list.map((m) => m.id),
          )
          .eq("played", false)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const profiles: Record<string, Profile> = {};
  for (const p of (others ?? []) as Profile[]) profiles[p.id] = p;

  const rows: MatchRow[] = list.map((m) => {
    const isA = m.user_a === user.id;
    // Gra, którą druga osoba zaznaczyła, a Ty jeszcze nie — czeka na Ciebie.
    const waiting = (games ?? []).find(
      (g: any) =>
        g.match_id === m.id &&
        (isA ? g.b_wants && !g.a_wants : g.a_wants && !g.b_wants),
    );
    return {
      id: m.id,
      otherId: isA ? m.user_b : m.user_a,
      points: m.points ?? 0,
      waitingGame: waiting?.game_id ?? null,
    };
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Dopasowania</h1>
        <Link
          href="/swipe"
          prefetch
          className="font-mono text-xs uppercase tracking-wide text-inksoft"
        >
          ← Swipe
        </Link>
      </header>

      <MatchesList meId={user.id} matches={rows} profiles={profiles} />
    </main>
  );
}
