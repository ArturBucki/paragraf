"use client";

import { useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { Icon, type IconName } from "@/components/Icon";
import { VerifiedBadge } from "@/components/VerifiedBadge";

/**
 * Karta osoby — dokładnie to, co ludzie widzą w swipe.
 * Ten sam komponent służy do podglądu własnego profilu, więc podgląd
 * nigdy się nie rozjedzie z tym, co widzą inni.
 */
export function ProfileCard({
  profile,
  infoHref,
}: {
  profile: Profile;
  /** Link pod „i" w rogu; bez niego kółka nie ma (np. we własnym podglądzie). */
  infoHref?: string;
}) {
  const [photo, setPhoto] = useState(0);

  const shots = profile.photos?.length ? profile.photos : [null];
  const at = Math.min(photo, shots.length - 1);

  const meta: { icon: IconName; text: string }[] = [];
  if (profile.city) meta.push({ icon: "pin", text: profile.city });
  if (profile.job) meta.push({ icon: "work", text: profile.job });
  if (profile.education) meta.push({ icon: "cap", text: profile.education });
  if (profile.height_cm) meta.push({ icon: "ruler", text: `${profile.height_cm} cm` });

  // Drobiazgi ze stylu życia — jedna cicha linijka, żeby nie zagłuszyć reszty.
  const facts = [
    profile.zodiac,
    profile.pets,
    profile.drinking,
    profile.workout,
    profile.kids,
  ].filter(Boolean) as string[];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-surface soft-2">
      <ProfilePhoto
        profile={profile}
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

      {infoHref && (
        <Link
          href={infoHref}
          aria-label="Zobacz cały profil"
          className="absolute bottom-4 right-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-black/45 text-white backdrop-blur-sm transition active:scale-95"
        >
          <Icon name="info" className="h-5 w-5" />
        </Link>
      )}

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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-5 pb-16 pt-24 text-white">
        <h2 className="font-display text-2xl font-extrabold">
          {profile.name}
          {profile.age ? `, ${profile.age}` : ""}
        </h2>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <VerifiedBadge verified={profile.verified} onPhoto />
          {profile.looking_for && (
            <span className="rounded-full bg-coral px-2.5 py-0.5 text-[11px] font-bold text-[rgb(var(--on-coral))]">
              {profile.looking_for}
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

        {profile.bio && (
          <p className="mt-2 line-clamp-3 text-sm opacity-95">{profile.bio}</p>
        )}

        {profile.interests?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 5).map((t) => (
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
  );
}
