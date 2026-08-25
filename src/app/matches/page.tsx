import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { Avatar, DEFAULT_AVATAR } from "@/components/Avatar";

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

  const otherIds = (matches ?? []).map((m) =>
    m.user_a === user.id ? m.user_b : m.user_a,
  );

  const { data: others } =
    otherIds.length > 0
      ? await supabase.from("profiles").select("*").in("id", otherIds)
      : { data: [] as Profile[] };

  const byId = new Map((others ?? []).map((p) => [p.id, p as Profile]));

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Dopasowania</h1>
        <Link href="/swipe" className="font-mono text-xs uppercase tracking-wide text-inksoft">
          ← Swipe
        </Link>
      </header>

      {(!matches || matches.length === 0) && (
        <p className="text-inksoft">
          Jeszcze nikogo — swipe’uj dalej, żeby kogoś dopasować.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {(matches ?? []).map((m) => {
          const otherId = m.user_a === user.id ? m.user_b : m.user_a;
          const p = byId.get(otherId);
          return (
            <Link
              key={m.id}
              href={`/matches/${m.id}`}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
            >
              <div className="h-14 w-14 overflow-hidden rounded-full">
                <Avatar spec={p?.avatar ?? DEFAULT_AVATAR} className="h-full w-full" />
              </div>
              <div className="flex-1">
                <div className="font-bold">{p?.name ?? "Ktoś"}</div>
                <div className="font-mono text-xs text-gold">
                  ✨ {m.points ?? 0} pkt połączenia
                </div>
              </div>
              <span className="text-inksoft">→</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
