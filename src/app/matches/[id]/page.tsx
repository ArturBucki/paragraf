import { notFound, redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { MatchRoom } from "@/components/MatchRoom";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    notFound();
  }

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;

  // Blokada zamyka rozmowę także przy wejściu z linku.
  const { data: hidden } = await supabase.rpc("hidden_users");
  if (((hidden ?? []) as string[]).includes(otherId)) redirect("/matches");

  const [{ data: other }, { data: games }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", otherId).maybeSingle(),
    supabase.from("match_games").select("*").eq("match_id", params.id),
    supabase
      .from("messages")
      .select("*")
      .eq("match_id", params.id)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-4">
      <MatchRoom
        matchId={params.id}
        meId={user.id}
        isA={match.user_a === user.id}
        other={(other as Profile) ?? null}
        initialPoints={match.points ?? 0}
        initialGames={games ?? []}
        initialMessages={messages ?? []}
        today={new Date().toISOString().slice(0, 10)}
      />
    </main>
  );
}
