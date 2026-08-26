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
 * Pasek gier tuż obok rozmowy — celowo cichy.
 * Kolor pojawia się tylko tam, gdzie coś się dzieje: Twój wybór, jej wybór,
 * gotowy start. Reszta jest szara, żeby nie konkurowała z rozmową.
 */
export function GameRail({
  dailyId,
  stateFor,
  onPick,
  onOpenAll,
  onRandom,
}: {
  /** Gra dnia — kropka przy ikonie; bonus punktowy tylko dziś. */
  dailyId: string;
  stateFor: (id: string) => RowState;
  onPick: (id: string) => void;
  onOpenAll: () => void;
  onRandom: () => void;
}) {
  return (
    <aside className="flex w-16 flex-none flex-col items-center justify-center gap-1.5 overflow-y-auto py-2 pl-1">
      {GAMES.map((g) => (
        <RailItem
          key={g.id}
          game={g}
          state={stateFor(g.id)}
          daily={g.id === dailyId}
          onPick={onPick}
        />
      ))}

      <span className="my-1 h-px w-8 bg-line" />

      <button
        onClick={onRandom}
        aria-label="Zaproponuj losowanie"
        className="grid h-11 w-11 place-items-center rounded-2xl text-inksoft transition hover:text-ink active:scale-95"
      >
        <Icon name="dice" className="h-5 w-5" />
      </button>
      <button
        onClick={onOpenAll}
        aria-label="Wszystkie gry"
        className="grid h-11 w-11 place-items-center rounded-2xl text-inksoft transition hover:text-ink active:scale-95"
      >
        <Icon name="gamepad" className="h-5 w-5" />
      </button>
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

  // Tło mówi, kto chce grać — bez czytania czegokolwiek.
  const tile = both
    ? "bg-berry text-white"
    : theirs
      ? "bg-berry/20 text-berry ring-1 ring-berry"
      : mine
        ? "bg-coral/20 text-coraldeep ring-1 ring-coral"
        : "bg-surface text-inksoft soft-1";

  return (
    <button
      onClick={() => onPick(game.id)}
      aria-label={game.name}
      className={`relative grid h-11 w-11 place-items-center rounded-2xl transition active:scale-95 ${tile} ${
        locked ? "opacity-40" : ""
      } ${played && !mine && !theirs ? "opacity-55" : ""}`}
    >
      <Icon name={locked ? "lock" : game.icon} className="h-5 w-5" />

      {daily && !locked && !mine && !theirs && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
      )}
      {theirs && !both && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-bg bg-berry" />
      )}
    </button>
  );
}
