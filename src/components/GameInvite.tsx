"use client";

import { sinceLabel, type Game } from "@/lib/games";
import { Icon } from "@/components/Icon";

/** Wspólna skorupa: cicha karta z cienkim paskiem w kolorze gry. */
function Shell({
  accent,
  waiting,
  children,
}: {
  accent: string;
  /** Powolny przejazd światła po pasku — „trwa", a nie „uwaga!". */
  waiting?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 overflow-hidden rounded-2xl bg-surface soft-2">
      <span
        className={`block w-full ${waiting ? "h-1 wait-bar" : "h-[3px]"}`}
        style={{ background: accent }}
      />
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
  since,
  live,
  onAccept,
  onDecline,
}: {
  game: Game;
  otherName: string;
  /** Kiedy kliknęła — świeże zaproszenie brzmi inaczej niż wczorajsze. */
  since?: string | null;
  /** Czy druga osoba jest teraz w rozmowie. */
  live?: boolean;
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
            {lead ?? (live ? "chce zagrać teraz" : "zaprasza do gry")}
          </p>
          <p className="line-clamp-2 text-[15px] font-bold leading-tight">
            {game.name}
          </p>
          <p className="mt-0.5 text-[11px] text-inksoft">
            {note ?? `${game.time} · +${game.pts} pkt`}
            {sinceLabel(since) ? ` · ${sinceLabel(since)}` : ""}
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
  otherInRoom,
  since,
  onCancel,
}: {
  game: Game;
  otherName: string;
  otherOnline: boolean;
  /** Od kiedy czekasz — po dobie zaproszenie i tak wygasa. */
  since?: string | null;
  /** Czy druga osoba siedzi w tej rozmowie — tylko wtedy gra ruszy od razu. */
  otherInRoom?: boolean;
  onCancel: () => void;
}) {
  return (
    <Shell accent={game.accent} waiting>
      <div className="flex items-center gap-3">
        <span
          className="breathe grid h-10 w-10 flex-none place-items-center rounded-xl"
          style={{ background: `${game.accent}18`, color: game.accent }}
        >
          <Icon name={game.icon} className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          {/* Bez odmiany imienia — „Czekasz na Ada" brzmiałoby jak automat. */}
          <p className="truncate text-[14px] font-semibold leading-tight">
            Zaproszenie wysłane
          </p>
          <p className="truncate text-[12px] text-inksoft">
            {game.name}
            {sinceLabel(since) ? ` · ${sinceLabel(since)}` : ""}
          </p>
          <p className="truncate text-[11px] text-inksoft">
            {otherName}{" "}
            {otherInRoom
              ? "jest tu z Tobą"
              : otherOnline
                ? "jest w apce, zaraz zobaczy"
                : "jest offline — zaproszenie poczeka"}
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
  ready = true,
  onStart,
}: {
  game: Game;
  otherName: string;
  /** Gra rusza dopiero, gdy oboje jesteście w rozmowie. */
  ready?: boolean;
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
            {ready ? (
              <>
                Oboje chcecie — Ty i{" "}
                <span className="font-semibold text-ink">{otherName}</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-ink">{otherName}</span>{" "}
                wróci do rozmowy i zaczynacie
              </>
            )}
          </p>
          <p className="line-clamp-2 text-[15px] font-bold leading-tight">
            {game.name}
          </p>
        </div>
        <button
          onClick={onStart}
          disabled={!ready}
          className="flex-none rounded-xl bg-berry px-5 py-2.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-45"
        >
          {ready ? "Start" : "Czeka"}
        </button>
      </div>
    </Shell>
  );
}
