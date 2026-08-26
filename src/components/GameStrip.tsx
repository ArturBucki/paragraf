"use client";

import { GAMES, gameOfTheDay, DAILY_BONUS, type Game } from "@/lib/games";
import { Icon } from "@/components/Icon";

type RowState = {
  mine: boolean;
  theirs: boolean;
  played: boolean;
  locked: boolean;
};

/**
 * Wybór gry tuż nad polem wiadomości — poziomy pasek z NAZWAMI.
 * Ikona bez podpisu zmuszała do zgadywania, a pionowy pasek zabierał
 * szerokość rozmowie. Tutaj widać, co to za gra, ile trwa i co daje,
 * a zablokowane mówią wprost, ile brakuje.
 */
export function GameStrip({
  matchId,
  today,
  points,
  stateFor,
  onPick,
  onRandom,
  onOpenAll,
}: {
  matchId: string;
  today: string;
  points: number;
  stateFor: (id: string) => RowState;
  onPick: (id: string) => void;
  onRandom: () => void;
  onOpenAll: () => void;
}) {
  const proposed = gameOfTheDay(matchId, today, points);
  // Za zagraną grę punktów i tak nie ma, więc nie udajemy, że bonus czeka.
  const dailyId = stateFor(proposed.id).played ? null : proposed.id;

  /*
   * Kolejność mówi, co jest teraz ważne:
   * najpierw to, na co ktoś czeka, potem propozycja na dziś,
   * dalej gry jeszcze niegrane, na końcu zagrane i zamknięte.
   */
  const rank = (g: Game) => {
    const st = stateFor(g.id);
    if (st.mine && st.theirs) return 0;
    if (st.theirs) return 1;
    if (st.mine) return 2;
    if (st.locked) return 6;
    if (g.id === dailyId) return 3;
    return st.played ? 5 : 4;
  };
  const ordered = [...GAMES].sort((a, b) => rank(a) - rank(b));

  return (
    <div className="relative -mx-4 mb-2">
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ordered.map((g) => (
          <Chip
            key={g.id}
            game={g}
            state={stateFor(g.id)}
            daily={g.id === dailyId}
            onPick={onPick}
          />
        ))}

        <button
          onClick={onRandom}
          className="flex flex-none items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-[13px] font-semibold text-inksoft soft-1 transition active:scale-95"
        >
          <Icon name="dice" className="h-4 w-4 text-gold" />
          Losuj
        </button>
        <button
          onClick={onOpenAll}
          className="flex-none rounded-full bg-surface px-3.5 py-2 text-[13px] font-semibold text-inksoft soft-1 transition active:scale-95"
        >
          Wszystkie
        </button>
      </div>

      {/* Delikatne zanikanie na krawędzi — sygnał, że pasek się przewija. */}
      <span className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bg to-transparent" />
    </div>
  );
}

function Chip({
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

  const skin = both
    ? "bg-berry text-white"
    : theirs
      ? "bg-berry/18 text-berry ring-1 ring-berry"
      : mine
        ? "bg-coral/25 text-ink ring-1 ring-coral"
        : locked
          ? "bg-surface text-inksoft opacity-70"
          : "bg-surface text-ink soft-1";

  // Prawa część plakietki: stan gry albo to, co warto wiedzieć przed kliknięciem.
  const note = both
    ? "start"
    : theirs
      ? "czeka na Ciebie"
      : mine
        ? "czekasz"
        : locked
          ? `${game.unlock} pkt`
          : daily
            ? `+${game.pts + DAILY_BONUS}`
            : played
              ? "zagrane"
              : `${game.time}`;

  return (
    <button
      onClick={() => onPick(game.id)}
      className={`flex flex-none items-center gap-2 rounded-full py-2 pl-3 pr-3.5 text-[13px] font-semibold transition active:scale-95 ${skin}`}
    >
      <span style={{ color: both ? undefined : locked ? undefined : game.accent }}>
        <Icon name={locked ? "lock" : game.icon} className="h-4 w-4" />
      </span>

      <span>{game.short}</span>

      {daily && !locked && !mine && !theirs && (
        <Icon name="spark" className="h-3 w-3 text-gold" />
      )}

      <span
        className={`text-[11px] font-bold ${
          both || theirs ? "opacity-90" : "opacity-60"
        }`}
      >
        {note}
      </span>
    </button>
  );
}
