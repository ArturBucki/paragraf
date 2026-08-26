"use client";

import { GAMES, gameOfTheDay, DAILY_BONUS, type Game } from "@/lib/games";
import { Icon, type IconName } from "@/components/Icon";

type RowState = {
  mine: boolean;
  theirs: boolean;
  played: boolean;
  locked: boolean;
};

/**
 * Wybór gry tuż nad polem wiadomości — poziomy pasek z NAZWAMI.
 *
 * WAŻNE: kolejność nie zależy od tego, kto co kliknął. Gdyby zależała,
 * plakietka po kliknięciu uciekałaby w inne miejsce i trzeba by jej szukać.
 * Stan pokazujemy kolorem i obwódką — pozycja zostaje ta sama.
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

  // Kolejność zależy tylko od rzeczy, które nie zmieniają się przy kliknięciu.
  const rank = (g: Game) => {
    const st = stateFor(g.id);
    if (st.locked) return 3;
    if (g.id === dailyId) return 0;
    return st.played ? 2 : 1;
  };
  const ordered = [...GAMES].sort(
    (a, b) => rank(a) - rank(b) || GAMES.indexOf(a) - GAMES.indexOf(b),
  );

  return (
    <div className="relative -mx-4 mb-2">
      <div className="flex gap-2 overflow-x-auto px-4 pb-1.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ordered.map((g) => (
          <Chip
            key={g.id}
            game={g}
            state={stateFor(g.id)}
            daily={g.id === dailyId}
            onPick={onPick}
          />
        ))}

        <Plain icon="dice" label="Losuj" tint="#B9770B" onClick={onRandom} />
        <Plain icon="gamepad" label="Wszystkie" tint="#4657C4" onClick={onOpenAll} />
      </div>

      {/* Delikatne zanikanie na krawędzi — sygnał, że pasek się przewija. */}
      <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-bg to-transparent" />
    </div>
  );
}

/** Ikona w kolorowej płytce — ten sam rytm w każdej plakietce. */
function Badge({
  name,
  tint,
  solid,
}: {
  name: IconName;
  tint: string;
  solid?: boolean;
}) {
  return (
    <span
      className="grid h-7 w-7 flex-none place-items-center rounded-[10px]"
      style={
        solid
          ? { background: "rgb(255 255 255 / 0.22)", color: "#fff" }
          : { background: `${tint}1F`, color: tint }
      }
    >
      <Icon name={name} className="h-4 w-4" />
    </span>
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

  // Ramka, nie ring — ring w Tailwindzie to cień, a cień mamy już w .soft-1.
  const skin = both
    ? "border-berry bg-berry text-white shadow-[0_6px_16px_rgb(21_122_89_/_0.30)]"
    : theirs
      ? "border-berry bg-berry/10 text-ink soft-1"
      : mine
        ? "border-coral bg-coral/12 text-ink soft-1"
        : locked
          ? "border-[rgb(var(--ink)/0.07)] bg-surface/70 text-inksoft"
          : "border-[rgb(var(--ink)/0.07)] bg-surface text-ink soft-1";

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
              : game.time;

  return (
    <button
      onClick={() => onPick(game.id)}
      className={`flex flex-none items-center gap-2 rounded-2xl border-2 py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold transition active:scale-95 ${skin}`}
    >
      <Badge name={locked ? "lock" : game.icon} tint={game.accent} solid={both} />

      <span className="flex items-center gap-1.5">
        {game.short}
        {daily && !mine && !theirs && (
          <Icon name="spark" className="h-3 w-3 text-gold" />
        )}
      </span>

      <span
        className={`text-[11px] font-bold ${
          both
            ? "opacity-90"
            : theirs
              ? "text-berry"
              : mine
                ? "text-coraldeep"
                : "opacity-55"
        }`}
      >
        {note}
      </span>
    </button>
  );
}

/** Plakietka bez stanu — losowanie i pełna półka gier. */
function Plain({
  icon,
  label,
  tint,
  onClick,
}: {
  icon: IconName;
  label: string;
  tint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-none items-center gap-2 rounded-2xl border-2 border-[rgb(var(--ink)/0.07)] bg-surface py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold text-inksoft soft-1 transition active:scale-95"
    >
      <Badge name={icon} tint={tint} />
      {label}
    </button>
  );
}
