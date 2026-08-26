"use client";

import type { Game } from "@/lib/games";
import { Icon } from "@/components/Icon";

/**
 * Zaproszenie do gry — widoczne w rozmowie, nie do przeoczenia.
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
    <div
      className="mb-2 rounded-2xl border-2 p-3"
      style={{ borderColor: game.accent, background: `${game.accent}1A` }}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid h-11 w-11 flex-none place-items-center rounded-xl"
          style={{ background: `${game.accent}2E`, color: game.accent }}
        >
          <Icon name={game.icon} className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] leading-tight">
            <span className="font-bold text-berry">{otherName}</span>{" "}
            {lead ?? "chce zagrać"}
          </p>
          <p className="line-clamp-2 font-display text-[15px] font-extrabold leading-tight">
            {game.name}
          </p>
          <p className="font-mono text-[10px] text-inksoft">
            {note ?? `${game.time} · +${game.pts} pkt`}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 rounded-xl bg-coral py-2.5 text-sm font-extrabold text-[#06281A] transition active:scale-95"
        >
          Wchodzę
        </button>
        <button
          onClick={onDecline}
          className="flex-none rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-inksoft transition active:scale-95"
        >
          Nie teraz
        </button>
      </div>
    </div>
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
    <div className="mb-2 flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface p-3">
      <span className="relative grid h-9 w-9 flex-none place-items-center rounded-xl bg-bg" style={{ color: game.accent }}>
        <Icon name={game.icon} className="h-5 w-5" />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-coral" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight">
          Czekasz na {otherName} — {game.name}
        </p>
        <p className="text-[11px] text-inksoft">
          {otherOnline
            ? "jest online, zaraz zobaczy zaproszenie"
            : "offline — zaproszenie poczeka do powrotu"}
        </p>
      </div>

      <button
        onClick={onCancel}
        aria-label="Anuluj zaproszenie"
        className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line text-inksoft transition active:scale-95"
      >
        <Icon name="close" className="h-4 w-4" />
      </button>
    </div>
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
    <div className="mb-2 rounded-2xl border-2 border-[#8FE3C2] bg-[#8FE3C2]/12 p-3">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[#8FE3C2]/20 text-berry">
          <Icon name={game.icon} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] leading-tight">
            Oboje chcecie — Ty i{" "}
            <span className="font-bold text-berry">{otherName}</span>
          </p>
          <p className="line-clamp-2 font-display text-[15px] font-extrabold leading-tight">
            {game.name}
          </p>
        </div>
      </div>

      <button
        onClick={onStart}
        className="mt-2.5 w-full rounded-xl bg-[#8FE3C2] py-2.5 text-sm font-extrabold text-[#06281A] transition active:scale-95"
      >
        Zaczynamy
      </button>
    </div>
  );
}
