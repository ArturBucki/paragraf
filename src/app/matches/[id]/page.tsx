import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { Avatar, DEFAULT_AVATAR } from "@/components/Avatar";
import { GAMES } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function MatchLobby({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    notFound();
  }

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;
  const { data: other } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", otherId)
    .maybeSingle();

  const points = match.points ?? 0;
  const p = (other as Profile) ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 py-6">
      <header className="flex items-center gap-3">
        <Link href="/matches" className="text-inksoft">
          ‹
        </Link>
        <div className="h-10 w-10 overflow-hidden rounded-full">
          <Avatar spec={p?.avatar ?? DEFAULT_AVATAR} className="h-full w-full" />
        </div>
        <div className="flex-1">
          <div className="font-bold">{p?.name ?? "Match"}</div>
        </div>
        <span className="rounded-full bg-gold/15 px-3 py-1 font-mono text-xs font-bold text-gold">
          ✨ {points} pkt
        </span>
      </header>

      <div>
        <h1 className="font-display text-xl font-extrabold">Wybierzcie grę — razem</h1>
        <p className="text-sm text-inksoft">
          Gra startuje, gdy oboje wybierzecie to samo. Punkty odblokowują głębsze gry.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {GAMES.map((g) => {
          const locked = points < g.unlock;
          const wantsIt = p?.games?.includes(g.id);
          return (
            <div
              key={g.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                locked ? "border-dashed border-line opacity-60" : "border-line bg-surface"
              }`}
            >
              <span className="text-2xl">{g.icon}</span>
              <div className="flex-1">
                <div className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                  {g.tag} · ✨ +{g.pts}
                </div>
                <div className="font-bold">{g.name}</div>
                <div className="text-xs text-inksoft">{g.desc}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {locked ? (
                  <span className="rounded-full bg-line px-2 py-1 text-[11px] text-inksoft">
                    🔒 od {g.unlock} pkt
                  </span>
                ) : (
                  <button className="rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-white">
                    ▶ Zaproś
                  </button>
                )}
                {wantsIt && (
                  <span className="text-[11px] text-berry">{p?.name} chce</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-2 rounded-xl border border-line bg-surface p-3 text-sm text-inksoft">
        🚧 Następny krok: gry i czat w czasie rzeczywistym między dwiema osobami
        (przenosimy logikę z prototypu na Supabase Realtime).
      </p>
    </main>
  );
}
