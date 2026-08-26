"use client";

import type { Game } from "@/lib/games";
import { Icon } from "@/components/Icon";

/** Wspólna skorupa: cicha karta z cienkim paskiem w kolorze gry. */
function Shell({
  accent,
  children,
}: {
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 overflow-hidden rounded-2xl bg-surface">
      <span className="block h-[3px] w-full" style={{ background: accent }} />
      <div className="p-3">{children}</div>
    </div>
  );
}

/**
 * Zaproszenie do gry — widoczne w rozmowie, ale bez krzyku.
 * Druga osoba przyjmuje albo odrzuca; zapraszający widzi, że czeka.
 */
export function GameInvite({
  game,
  otherName,
  note,
  lead,
  onAccept,
  onDecline,
}: {
  game: Game;
  otherName: string;
  /** Zamiast czasu i punktów — używane przy losowaniu, gdzie zależą od wyniku. */
  note?: string;
  /** Nadpisuje pierwszą linijkę („Zosia chce zagrać"). */
  lead?: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Shell accent={game.accent}>
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 flex-none place-items-center rounded-xl"
          style={{ background: `${game.accent}22`, color: game.accent }}
        >
          <Icon name={game.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] leading-tight text-inksoft">
            <span className="font-semibold text-ink">{otherName}</span>{" "}
            {lead ?? "chce zagrać"}
          </p>
          <p className="line-clamp-2 text-[15px] font-bold leading-tight">
            {game.name}
          </p>
          <p className="mt-0.5 text-[11px] text-inksoft">
            {note ?? `${game.time} · +${game.pts} pkt`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 rounded-xl bg-coral py-2.5 text-sm font-bold text-[rgb(var(--on-coral))] transition active:scale-95"
        >
          Wchodzę
        </button>
        <button
          onClick={onDecline}
          className="flex-none rounded-xl bg-surface2 px-4 py-2.5 text-sm font-semibold text-inksoft transition active:scale-95"
        >
          Nie teraz
        </button>
      </div>
    </Shell>
  );
}

/** Druga strona tego samego: czekasz, aż ktoś odpowie. */
export function GameWaiting({
  game,
  otherName,
  otherOnline,
  onCancel,
}: {
  game: Game;
  otherName: string;
  otherOnline: boolean;
  onCancel: () => void;
}) {
  return (
    <Shell accent={game.accent}>
      <div className="flex items-center gap-3">
        <span
          className="relative grid h-10 w-10 flex-none place-items-center rounded-xl"
          style={{ background: `${game.accent}18`, color: game.accent }}
        >
          <Icon name={game.icon} className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-coral" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight">
            Czekasz na {otherName}
          </p>
          <p className="truncate text-[12px] text-inksoft">
            {game.name} ·{" "}
            {otherOnline ? "jest online" : "offline, zaproszenie poczeka"}
          </p>
        </div>

        <button
          onClick={onCancel}
          aria-label="Anuluj zaproszenie"
          className="grid h-8 w-8 flex-none place-items-center rounded-full bg-surface2 text-inksoft transition active:scale-95"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
    </Shell>
  );
}

/** Oboje kliknęli to samo — zostaje wejść. */
export function GameReady({
  game,
  otherName,
  onStart,
}: {
  game: Game;
  otherName: string;
  onStart: () => void;
}) {
  return (
    <Shell accent={game.accent}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-berry/15 text-berry">
          <Icon name={game.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] leading-tight text-inksoft">
            Oboje chcecie — Ty i{" "}
            <span className="font-semibold text-ink">{otherName}</span>
          </p>
          <p className="line-clamp-2 text-[15px] font-bold leading-tight">
            {game.name}
          </p>
        </div>
        <button
          onClick={onStart}
          className="flex-none rounded-xl bg-berry px-5 py-2.5 text-sm font-bold text-[rgb(var(--on-coral))] transition active:scale-95"
        >
          Start
        </button>
      </div>
    </Shell>
  );
}
