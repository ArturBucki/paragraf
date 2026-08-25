"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { Avatar, DEFAULT_AVATAR } from "@/components/Avatar";
import { gameById } from "@/lib/games";
import { likeProfile, passProfile } from "@/app/actions";

export function SwipeDeck({ candidates }: { candidates: Profile[] }) {
  const [i, setI] = useState(0);
  const [matched, setMatched] = useState<Profile | null>(null);
  const [, startTransition] = useTransition();

  const current = candidates[i];

  function next() {
    setI((n) => n + 1);
  }

  function onLike() {
    if (!current) return;
    const c = current;
    startTransition(async () => {
      const res = await likeProfile(c.id);
      if (res.matched) setMatched(c);
      else next();
    });
  }

  function onPass() {
    if (!current) return;
    const c = current;
    startTransition(async () => {
      await passProfile(c.id);
      next();
    });
  }

  if (matched) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-bg">
          <Avatar spec={matched.avatar ?? DEFAULT_AVATAR} className="h-full w-full" />
        </div>
        <h2 className="font-display text-3xl font-extrabold text-coral">To match!</h2>
        <p className="text-inksoft">
          Ty i {matched.name} polubiliście się nawzajem.
        </p>
        <Link
          href="/matches"
          className="rounded-xl bg-coral px-6 py-3 font-bold text-[#06281A]"
        >
          Wybierzcie grę →
        </Link>
        <button onClick={() => { setMatched(null); next(); }} className="text-sm text-inksoft underline">
          Swipe dalej
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-inksoft">
        <p className="text-lg">Na razie to wszyscy w okolicy 👀</p>
        <p className="text-sm">Wróć później albo zaproś znajomych.</p>
        <Link href="/matches" className="text-coraldeep underline">
          Zobacz dopasowania
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex-1 overflow-hidden rounded-3xl border border-line">
        <Avatar
          spec={current.avatar ?? DEFAULT_AVATAR}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 text-white">
          <h2 className="font-display text-2xl font-extrabold">
            {current.name}
            {current.age ? `, ${current.age}` : ""}
          </h2>
          {current.bio && <p className="text-sm opacity-95">{current.bio}</p>}
          {current.games?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="w-full font-mono text-[10px] uppercase tracking-wide opacity-90">
                chce zagrać w
              </span>
              {current.games.map((gid) => {
                const g = gameById(gid);
                if (!g) return null;
                return (
                  <span
                    key={gid}
                    className="rounded-full bg-[#F2EFE4] px-2 py-1 text-xs font-bold text-[#06281A]"
                  >
                    {g.icon} {g.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-6 py-4">
        <button
          onClick={onPass}
          aria-label="Pomiń"
          className="grid h-16 w-16 place-items-center rounded-full border border-line bg-surface text-2xl text-inksoft"
        >
          ✕
        </button>
        <button
          onClick={onLike}
          aria-label="Polub"
          className="grid h-16 w-16 place-items-center rounded-full bg-coral text-2xl text-[#06281A]"
        >
          ♥
        </button>
      </div>
    </div>
  );
}
