"use client";

import { useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { Icon, type IconName } from "@/components/Icon";
import { likeProfile, passProfile } from "@/app/actions";

export function SwipeDeck({ candidates }: { candidates: Profile[] }) {
  const [i, setI] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [matched, setMatched] = useState<Profile | null>(null);

  const current = candidates[i];

  function next() {
    setI((n) => n + 1);
    setPhoto(0); // nowa osoba zaczyna od głównego zdjęcia
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

  const shots = current.photos?.length ? current.photos : [null];
  const at = Math.min(photo, shots.length - 1);

  const meta: { icon: IconName; text: string }[] = [];
  if (current.city) meta.push({ icon: "pin", text: current.city });
  if (current.job) meta.push({ icon: "work", text: current.job });
  if (current.education) meta.push({ icon: "cap", text: current.education });
  if (current.height_cm) meta.push({ icon: "ruler", text: `${current.height_cm} cm` });

  // Drobiazgi ze stylu życia — jedna cicha linijka, żeby nie zagłuszyć reszty.
  const facts = [
    current.zodiac,
    current.pets,
    current.drinking,
    current.workout,
    current.kids,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex-1 overflow-hidden rounded-3xl border border-line bg-surface">
        <ProfilePhoto
          profile={current}
          index={at}
          className="absolute inset-0 h-full w-full"
        />

        {/* Kreski jak na Instagramie — od razu widać, ile jest zdjęć. */}
        {shots.length > 1 && (
          <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
            {shots.map((_, n) => (
              <span
                key={n}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  n === at ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        )}

        {/* Pełny profil — to samo miejsce co w Tinderze, prawy dolny róg. */}
        <Link
          href={`/profil/${current.id}?skad=swipe`}
          aria-label="Zobacz cały profil"
          className="absolute bottom-4 right-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-black/45 text-white backdrop-blur-sm transition active:scale-95"
        >
          <Icon name="info" className="h-5 w-5" />
        </Link>

        {/* Dotknięcie lewej/prawej połowy przewija zdjęcia — jak w Tinderze. */}
        {shots.length > 1 && (
          <>
            <button
              aria-label="Poprzednie zdjęcie"
              onClick={() => setPhoto((n) => Math.max(0, n - 1))}
              className="absolute inset-y-0 left-0 z-10 w-1/3"
            />
            <button
              aria-label="Następne zdjęcie"
              onClick={() => setPhoto((n) => Math.min(shots.length - 1, n + 1))}
              className="absolute inset-y-0 right-0 z-10 w-1/3"
            />
          </>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-5 pb-16 pt-16 text-white">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h2 className="font-display text-2xl font-extrabold">
              {current.name}
              {current.age ? `, ${current.age}` : ""}
            </h2>
            {current.looking_for && (
              <span className="rounded-full bg-coral px-2.5 py-0.5 text-[11px] font-bold text-[#06281A]">
                {current.looking_for}
              </span>
            )}
          </div>

          {meta.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] opacity-95">
              {meta.map((m) => (
                <span key={m.icon} className="flex items-center gap-1.5">
                  <Icon name={m.icon} className="h-3.5 w-3.5 opacity-80" />
                  {m.text}
                </span>
              ))}
            </div>
          )}

          {facts.length > 0 && (
            <p className="mt-1 text-[12px] opacity-80">{facts.slice(0, 4).join(" · ")}</p>
          )}

          {current.bio && (
            <p className="mt-2 line-clamp-3 text-sm opacity-95">{current.bio}</p>
          )}

          {current.interests?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {current.interests.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/35 bg-white/10 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-6 py-4">
        <button
          onClick={onPass}
          aria-label="Pomiń"
          className="grid h-16 w-16 place-items-center rounded-full border border-line bg-surface text-2xl text-inksoft transition active:scale-90"
        >
          <Icon name="close" className="h-6 w-6" />
        </button>
        <button
          onClick={onLike}
          aria-label="Polub"
          className="grid h-16 w-16 place-items-center rounded-full bg-coral text-2xl text-[#06281A] transition active:scale-90"
        >
          <Icon name="heart" className="h-7 w-7" filled />
        </button>
      </div>
    </div>
  );
}
