"use client";

import { GAMES, type Game } from "@/lib/games";
import { Icon } from "@/components/Icon";

type RowState = {
  mine: boolean;
  theirs: boolean;
  played: boolean;
  locked: boolean;
};

/**
 * Pasek gier tuż obok rozmowy.
 * Jedno spojrzenie i wiadomo: co jest zablokowane, w co już graliście,
 * co wybrałeś Ty, a w co druga osoba właśnie kliknęła.
 */
export function GameRail({
  dailyId,
  stateFor,
  onPick,
  onOpenAll,
  onRandom,
}: {
  /** Gra dnia — mały złoty znacznik, bonus punktowy dostajecie tylko dziś. */
  dailyId: string;
  stateFor: (id: string) => RowState;
  onPick: (id: string) => void;
  onOpenAll: () => void;
  onRandom: () => void;
}) {
  return (
    <aside className="flex w-[76px] flex-none flex-col border-l border-line pl-2">
      <p className="pb-1.5 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-inksoft">
        Gry
      </p>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pb-2">
        {GAMES.map((g) => (
          <RailItem
            key={g.id}
            game={g}
            state={stateFor(g.id)}
            daily={g.id === dailyId}
            onPick={onPick}
          />
        ))}

      <div className="mt-1.5 flex flex-none flex-col gap-1.5 border-t border-line pt-1.5">
        <button
          onClick={onRandom}
          aria-label="Wylosuj grę"
          className="grid h-11 w-full place-items-center rounded-xl border border-line bg-surface text-gold transition active:scale-95"
        >
          <Icon name="dice" className="h-5 w-5" />
        </button>
        <button
          onClick={onOpenAll}
          className="rounded-xl border border-line bg-surface px-1 py-1.5 text-[9px] font-bold text-inksoft transition active:scale-95"
        >
          Wszystkie
        </button>
        </div>
      </div>
    </aside>
  );
}

function RailItem({
  game,
  state,
  daily,
  onPick,
}: {
  game: Game;
  state: RowState;
  daily: boolean;
  onPick: (id: string) => void;
}) {
  const { mine, theirs, played, locked } = state;
  const both = mine && theirs;

  // Obwódka mówi, kto chce grać — bez czytania czegokolwiek.
  const ring = both
    ? "border-[#8FE3C2] bg-[#8FE3C2]/15"
    : theirs
      ? "border-[#8FE3C2] bg-[#8FE3C2]/20 shadow-[0_0_0_3px_rgba(143,227,194,0.18)]"
      : mine
        ? "border-coral bg-coral/15"
        : "border-line bg-surface";

  return (
    <button
      onClick={() => onPick(game.id)}
      aria-label={game.name}
      className={`relative grid w-full place-items-center gap-0.5 rounded-xl border px-1 py-2 transition active:scale-95 ${ring} ${
        locked ? "opacity-45" : ""
      }`}
    >
      {/* Każda gra ma swój kolor — łatwiej trafić wzrokiem w tę samą co wczoraj. */}
      <span style={{ color: locked ? undefined : game.accent }}>
        <Icon name={locked ? "lock" : game.icon} className="h-5 w-5" />
      </span>
      <span className="w-full truncate text-center text-[9px] font-bold leading-tight">
        {game.short}
      </span>

      {locked ? (
        <span className="font-mono text-[8px] text-inksoft">{game.unlock} pkt</span>
      ) : daily ? (
        <span className="font-mono text-[8px] font-bold text-gold">dziś +15</span>
      ) : null}

      {both && (
        <span className="mt-0.5 w-full rounded-md bg-[#8FE3C2] py-0.5 text-center text-[8px] font-extrabold text-[#06281A]">
          START
        </span>
      )}
      {!both && theirs && (
        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#8FE3C2] text-[9px] font-extrabold text-[#06281A]">
          !
        </span>
      )}
      {!both && mine && (
        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-coral text-[9px] font-extrabold text-[#06281A]">
          ✓
        </span>
      )}
      {played && !mine && !theirs && (
        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border border-line bg-bg text-[8px] text-inksoft">
          ✓
        </span>
      )}
    </button>
  );
}
