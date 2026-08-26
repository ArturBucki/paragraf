"use client";

import type { Profile } from "@/lib/types";
import { ProfilePhoto } from "@/components/ProfilePhoto";

/**
 * „Jest tu z Tobą" — pasek obecności tuż nad polem wiadomości.
 *
 * Cała mechanika paragrafu stoi na tym, żeby oboje byli w tym samym momencie
 * w tej samej rozmowie. To jedyne miejsce, gdzie widać to bez czytania:
 * zdjęcie pojawia się, gdy ktoś wejdzie, i znika, gdy wyjdzie.
 */
export function PeerStatus({
  other,
  inRoom,
  typing,
}: {
  other: Profile | null;
  inRoom: boolean;
  typing: boolean;
}) {
  if (!other || !inRoom) return null;

  return (
    <div className="mb-1.5 flex items-center gap-2 px-1">
      <span className="relative h-7 w-7 flex-none overflow-hidden rounded-full">
        <ProfilePhoto profile={other} />
      </span>
      <span className="h-2 w-2 flex-none rounded-full bg-berry" />

      {typing ? (
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-berry">
          {other.name} pisze
          <span className="flex gap-0.5">
            <Dot delay="0ms" />
            <Dot delay="160ms" />
            <Dot delay="320ms" />
          </span>
        </span>
      ) : (
        <span className="text-[12px] font-semibold text-berry">
          {other.name} jest tu z Tobą
        </span>
      )}
    </div>
  );
}

/** Kropka „pisze" — trzy takie, jedna po drugiej, jak w komunikatorach. */
function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="breathe h-1 w-1 rounded-full bg-berry"
      style={{ animationDelay: delay, animationDuration: "1.1s" }}
    />
  );
}
