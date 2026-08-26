"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { ProfilePhoto } from "@/components/ProfilePhoto";

/**
 * Galeria zdjęć na profilu — dotknięcie lewej/prawej połowy przewija,
 * kreski u góry mówią, ile jest zdjęć. Ten sam gest co na karcie w swipe.
 */
export function PhotoViewer({
  profile,
  overlay,
}: {
  profile: Profile;
  /** Podpis na dole zdjęcia — jak na Bumble: imię, wiek, weryfikacja. */
  overlay?: React.ReactNode;
}) {
  const [at, setAt] = useState(0);
  const count = Math.max(1, profile.photos?.length ?? 0);
  const index = Math.min(at, count - 1);

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-surface soft-2">
      <ProfilePhoto
        profile={profile}
        index={index}
        className="absolute inset-0 h-full w-full"
      />

      {count > 1 && (
        <>
          <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
            {Array.from({ length: count }).map((_, n) => (
              <span
                key={n}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  n === index ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>

          <button
            aria-label="Poprzednie zdjęcie"
            onClick={() => setAt((n) => Math.max(0, n - 1))}
            className="absolute inset-y-0 left-0 z-10 w-1/3"
          />
          <button
            aria-label="Następne zdjęcie"
            onClick={() => setAt((n) => Math.min(count - 1, n + 1))}
            className="absolute inset-y-0 right-0 z-10 w-1/3"
          />
        </>
      )}

      {overlay && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-5 pb-4 pt-16 text-white">
          {overlay}
        </div>
      )}
    </div>
  );
}
