"use client";

import { useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { ProfileCard } from "@/components/ProfileCard";
import { Icon } from "@/components/Icon";
import { likeProfile, passProfile } from "@/app/actions";

export function SwipeDeck({ candidates }: { candidates: Profile[] }) {
  const [i, setI] = useState(0);
  const [matched, setMatched] = useState<Profile | null>(null);

  const current = candidates[i];

  function next() {
    setI((n) => n + 1);
  }

  // Karta znika od razu — zapis leci w tle. Bez tego każdy swipe czekałby na serwer.
  function onLike() {
    if (!current) return;
    const c = current;
    next();
    likeProfile(c.id)
      .then((res) => {
        if (res.matched) setMatched(c);
      })
      .catch(() => {});
  }

  function onPass() {
    if (!current) return;
    const c = current;
    next();
    passProfile(c.id).catch(() => {});
  }

  if (matched) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-bg">
          <ProfilePhoto profile={matched} />
        </div>
        <h2 className="font-display text-3xl font-extrabold text-coraldeep">To match!</h2>
        <p className="text-inksoft">
          Ty i {matched.name} polubiliście się nawzajem.
        </p>
        <Link
          href="/matches"
          className="rounded-xl bg-coral px-6 py-3 font-bold text-[rgb(var(--on-coral))]"
        >
          Wybierzcie grę →
        </Link>
        <button
          onClick={() => {
            setMatched(null);
            next();
          }}
          className="text-sm text-inksoft underline"
        >
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
      <div className="min-h-0 flex-1">
        <ProfileCard profile={current} infoHref={`/profil/${current.id}?skad=swipe`} />
      </div>

      <div className="flex justify-center gap-6 py-4">
        <button
          onClick={onPass}
          aria-label="Pomiń"
          className="grid h-16 w-16 place-items-center rounded-full bg-surface text-2xl text-inksoft soft-1 transition active:scale-90"
        >
          <Icon name="close" className="h-6 w-6" />
        </button>
        <button
          onClick={onLike}
          aria-label="Polub"
          className="grid h-16 w-16 place-items-center rounded-full bg-coral text-2xl text-[rgb(var(--on-coral))] soft-2 transition active:scale-90"
        >
          <Icon name="heart" className="h-7 w-7" filled />
        </button>
      </div>
    </div>
  );
}
