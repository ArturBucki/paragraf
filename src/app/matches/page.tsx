import { redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { MatchesList, type MatchRow } from "@/components/MatchesList";
import { BottomNav } from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = createClient();

  const [{ data: matches }, { data: hidden }] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    supabase.rpc("hidden_users"),
  ]);

  // Zablokowana para znika z listy — z obu stron, bez śladu.
  const blocked = new Set(((hidden ?? []) as string[]) ?? []);
  const list = (matches ?? []).filter(
    (m) => !blocked.has(m.user_a === user.id ? m.user_b : m.user_a),
  );
  const ids = list.map((m) => m.id);
  const otherIds = list.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));

  const [{ data: others }, { data: games }, { data: msgs }] = await Promise.all([
    otherIds.length
      ? supabase.from("profiles").select("*").in("id", otherIds)
      : Promise.resolve({ data: [] as Profile[] }),
    ids.length
      ? supabase.from("match_games").select("*").in("match_id", ids).eq("played", false)
      : Promise.resolve({ data: [] as any[] }),
    ids.length
      ? supabase
          .from("messages")
          .select("match_id, body, created_at")
          .in("match_id", ids)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const profiles: Record<string, Profile> = {};
  for (const p of (others ?? []) as Profile[]) profiles[p.id] = p;

  // Ostatnia wiadomość na parę (lista jest już posortowana malejąco po dacie).
  const lastByMatch: Record<string, string> = {};
  for (const m of (msgs ?? []) as any[]) {
    if (lastByMatch[m.match_id]) continue;
    lastByMatch[m.match_id] = String(m.body).startsWith("__system__")
      ? String(m.body).replace("__system__", "")
      : String(m.body);
  }

  const rows: MatchRow[] = list.map((m) => {
    const isA = m.user_a === user.id;
    const waiting = (games ?? []).find(
      (g: any) =>
        g.match_id === m.id &&
        g.game_id !== "__random__" &&
        (isA ? g.b_wants && !g.a_wants : g.a_wants && !g.b_wants),
    );
    return {
      id: m.id,
      otherId: isA ? m.user_b : m.user_a,
      points: m.points ?? 0,
      waitingGame: waiting?.game_id ?? null,
      lastMessage: lastByMatch[m.id] ?? null,
      played: (m.points ?? 0) > 0,
    };
  });

  const waitingCount = rows.filter((r) => r.waitingGame).length;

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 pb-24 pt-6">
        <h1 className="font-display text-2xl font-extrabold">Pary</h1>
        <MatchesList meId={user.id} matches={rows} profiles={profiles} />
      </main>
      <BottomNav badge={waitingCount} />
    </>
  );
}
