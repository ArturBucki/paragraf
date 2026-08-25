"use client";

import Link from "next/link";
import type { Profile } from "@/lib/types";
import { Avatar, DEFAULT_AVATAR } from "@/components/Avatar";
import { usePresence } from "@/lib/usePresence";
import { gameById } from "@/lib/games";
import { Icon } from "@/components/Icon";

export type MatchRow = {
  id: string;
  otherId: string;
  points: number;
  /** Gra, którą druga osoba zaznaczyła i czeka na Twoją zgodę. */
  waitingGame: string | null;
  /** Ostatnia wiadomość w rozmowie (null = jeszcze nie rozmawialiście). */
  lastMessage: string | null;
  played: boolean;
};

export function MatchesList({
  meId,
  matches,
  profiles,
}: {
  meId: string;
  matches: MatchRow[];
  profiles: Record<string, Profile>;
}) {
  const online = usePresence(meId);

  if (matches.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-2 text-center text-inksoft">
        <span className="text-3xl">👀</span>
        <p className="font-bold text-ink">Jeszcze nikogo</p>
        <p className="text-sm">Swipe’uj dalej — pary pojawią się tutaj.</p>
        <Link href="/swipe" className="mt-2 text-coraldeep underline">
          Wróć do odkrywania
        </Link>
      </div>
    );
  }

  // Świeże pary (bez rozmowy) lądują na górze jako kółka — jak na Tinderze.
  const fresh = matches.filter((m) => !m.lastMessage);
  const talking = matches.filter((m) => m.lastMessage);

  const score = (m: MatchRow) =>
    (online.has(m.otherId) ? 2 : 0) + (m.waitingGame ? 1 : 0);
  const sortedTalking = [...talking].sort((a, b) => score(b) - score(a));

  return (
    <div className="flex flex-col gap-5">
      {fresh.length > 0 && (
        <section>
          <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-inksoft">
            Nowe pary · {fresh.length}
          </h2>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {fresh.map((m) => {
              const p = profiles[m.otherId];
              const isOnline = online.has(m.otherId);
              return (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  prefetch
                  className="flex w-[72px] flex-none flex-col items-center gap-1"
                >
                  <div
                    className={`relative h-[68px] w-[68px] rounded-full p-[2px] ${
                      isOnline ? "bg-[#8FE3C2]" : "bg-line"
                    }`}
                  >
                    <div className="h-full w-full overflow-hidden rounded-full border-2 border-bg">
                      <Avatar
                        spec={p?.avatar ?? DEFAULT_AVATAR}
                        className="h-full w-full"
                      />
                    </div>
                    {m.waitingGame && (
                      <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-bg bg-coral text-[11px]">
                        <Icon name="gamepad" className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <span className="w-full truncate text-center text-xs font-semibold">
                    {p?.name ?? "Ktoś"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {sortedTalking.length > 0 && (
        <section>
          <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-inksoft">
            Rozmowy
          </h2>
          <div className="flex flex-col gap-2">
            {sortedTalking.map((m) => {
              const p = profiles[m.otherId];
              const isOnline = online.has(m.otherId);
              const g = m.waitingGame ? gameById(m.waitingGame) : null;

              return (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  prefetch
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition active:scale-[0.99] ${
                    g ? "border-[#8FE3C2] bg-[#8FE3C2]/10" : "border-line bg-surface"
                  }`}
                >
                  <div className="relative h-14 w-14 shrink-0">
                    <div className="h-full w-full overflow-hidden rounded-full">
                      <Avatar
                        spec={p?.avatar ?? DEFAULT_AVATAR}
                        className="h-full w-full"
                      />
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-bg bg-[#8FE3C2]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate font-bold leading-tight">
                        {p?.name ?? "Ktoś"}
                      </span>
                      <span className="ml-auto flex-none font-mono text-[10px] text-gold">
                        <Icon name="spark" className="inline h-3 w-3 align-[-1px]" /> {m.points}
                      </span>
                    </div>
                    {g ? (
                      <div className="truncate text-xs font-semibold text-berry">
                        chce zagrać: <Icon name={g.icon} className="inline h-3.5 w-3.5 align-[-2px]" /> {g.name}
                      </div>
                    ) : (
                      <div className="truncate text-xs text-inksoft">
                        {m.lastMessage}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
