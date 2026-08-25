"use client";

import Link from "next/link";
import type { Profile } from "@/lib/types";
import { Avatar, DEFAULT_AVATAR } from "@/components/Avatar";
import { usePresence } from "@/lib/usePresence";
import { gameById } from "@/lib/games";

export type MatchRow = {
  id: string;
  otherId: string;
  points: number;
  /** Gra, którą druga osoba już zaznaczyła i czeka na Twoją zgodę. */
  waitingGame: string | null;
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
      <p className="text-inksoft">
        Jeszcze nikogo — swipe’uj dalej, żeby kogoś dopasować.
      </p>
    );
  }

  // Najpierw ci, z którymi można zagrać teraz.
  const sorted = [...matches].sort((a, b) => {
    const score = (m: MatchRow) =>
      (online.has(m.otherId) ? 2 : 0) + (m.waitingGame ? 1 : 0);
    return score(b) - score(a);
  });

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((m) => {
        const p = profiles[m.otherId];
        const isOnline = online.has(m.otherId);
        const g = m.waitingGame ? gameById(m.waitingGame) : null;

        return (
          <Link
            key={m.id}
            href={`/matches/${m.id}`}
            prefetch
            className={`flex items-center gap-3 rounded-2xl border p-3 transition active:scale-[0.99] ${
              isOnline || g ? "border-[#8FE3C2] bg-[#8FE3C2]/10" : "border-line bg-surface"
            }`}
          >
            <div className="relative h-14 w-14 shrink-0">
              <div className="h-full w-full overflow-hidden rounded-full">
                <Avatar spec={p?.avatar ?? DEFAULT_AVATAR} className="h-full w-full" />
              </div>
              {isOnline && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-bg bg-[#8FE3C2]"
                  aria-label="online"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-bold leading-tight">{p?.name ?? "Ktoś"}</div>
              {g ? (
                <div className="truncate text-xs font-semibold text-berry">
                  chce zagrać: {g.icon} {g.name}
                </div>
              ) : isOnline ? (
                <div className="text-xs font-semibold text-berry">jest teraz online</div>
              ) : (
                <div className="font-mono text-xs text-gold">
                  ✨ {m.points} pkt połączenia
                </div>
              )}
            </div>

            {(isOnline || g) && (
              <span className="rounded-full bg-[#8FE3C2] px-3 py-1.5 text-xs font-bold text-[#06281A]">
                {g ? "Dołącz" : "Zagraj"}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
