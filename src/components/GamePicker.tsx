"use client";

import { useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  GAMES,
  DAILY_BONUS,
  gameOfTheDay,
  nextUnlock,
  type Game,
} from "@/lib/games";
import { Icon } from "@/components/Icon";
import { GameWheel } from "@/components/GameWheel";

export type MatchGame = {
  game_id: string;
  a_wants: boolean;
  b_wants: boolean;
  played: boolean;
};

/**
 * Wybór gry — ekran, na który ma się chcieć wracać.
 * Kolejność jest celowa: najpierw gotowa propozycja na dziś (nie trzeba myśleć),
 * potem własny wybór, na końcu postęp — czyli powód, żeby zagrać jeszcze raz.
 */
export function GamePicker({
  points,
  isA,
  rows,
  otherName,
  today,
  matchId,
  channel,
  onClose,
  onToggle,
  onStart,
}: {
  points: number;
  isA: boolean;
  rows: MatchGame[];
  otherName: string;
  today: string;
  matchId: string;
  channel: RealtimeChannel | null;
  onClose: () => void;
  onToggle: (id: string) => void;
  onStart: (id: string) => void;
}) {
  const [wheelOpen, setWheelOpen] = useState(false);

  const available = useMemo(
    () => GAMES.filter((g) => points >= g.unlock),
    [points],
  );
  const daily = useMemo(
    () => gameOfTheDay(matchId, today, points),
    [matchId, today, points],
  );
  const progress = nextUnlock(points);

  const stateOf = (g: Game) => {
    const r = rows.find((x) => x.game_id === g.id);
    const iWant = isA ? !!r?.a_wants : !!r?.b_wants;
    const theyWant = isA ? !!r?.b_wants : !!r?.a_wants;
    return { iWant, theyWant, both: iWant && theyWant, played: !!r?.played };
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[28px] border-t border-line bg-bg pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-bg px-4 pb-3 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold">Zagrajcie razem</h2>
            <span className="flex items-center gap-1 font-mono text-xs font-bold text-gold">
              <Icon name="spark" className="h-3.5 w-3.5" /> {points}
            </span>
          </div>
        </div>

        <div className="px-4">
          {/* ---------------------------------------------------- GRA DNIA */}
          <Section label="Gra dnia" note="zmienia się codziennie" />
          <button
            onClick={() => (stateOf(daily).both ? onStart(daily.id) : onToggle(daily.id))}
            className="relative w-full overflow-hidden rounded-3xl border p-5 text-left transition active:scale-[0.99]"
            style={{
              borderColor: daily.accent,
              background: `linear-gradient(140deg, ${daily.accent}22, ${daily.accent}0A)`,
            }}
          >
            <span
              className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20"
              style={{ background: daily.accent }}
            />
            <span className="relative flex items-start gap-4">
              <span
                className="grid h-14 w-14 flex-none place-items-center rounded-2xl"
                style={{ background: `${daily.accent}26`, color: daily.accent }}
              >
                <Icon name={daily.icon} className="h-7 w-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-xl font-extrabold leading-tight">
                    {daily.name}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-[#06281A]"
                    style={{ background: daily.accent }}
                  >
                    +{DAILY_BONUS} BONUS
                  </span>
                </span>
                <span className="mt-1 block text-sm text-inksoft">{daily.desc}</span>
                <span className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-inksoft">
                  <span>{daily.time}</span>
                  <span>·</span>
                  <span>+{daily.pts} pkt</span>
                </span>
              </span>
            </span>
            <span className="relative mt-4 flex items-center justify-between">
              <Readiness s={stateOf(daily)} otherName={otherName} />
              <span
                className="rounded-full px-4 py-2 text-sm font-extrabold text-[#06281A]"
                style={{ background: daily.accent }}
              >
                {stateOf(daily).both
                  ? "START"
                  : stateOf(daily).iWant
                    ? "Czekasz…"
                    : "Zapraszam"}
              </span>
            </span>
          </button>

          {/* ------------------------------------------------------- KOŁO */}
          <button
            onClick={() => setWheelOpen(true)}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-4 py-3 text-left transition active:scale-[0.99]"
          >
            <Icon name="dice" className="h-6 w-6 flex-none text-coral" />
            <span className="flex-1">
              <span className="block text-sm font-bold">Nie możecie się zdecydować?</span>
              <span className="block text-[11px] text-inksoft">
                Zakręćcie kołem — wybierze za was
              </span>
            </span>
            <span className="rounded-full bg-coral px-3.5 py-1.5 text-xs font-extrabold text-[#06281A]">
              Koło
            </span>
          </button>

          {/* ------------------------------------------------ WSZYSTKIE GRY */}
          <Section label="Wszystkie gry" note={`${available.length} dostępnych`} />
          <div className="grid grid-cols-2 gap-3">
            {GAMES.map((g) => {
              const locked = points < g.unlock;
              const s = stateOf(g);
              return (
                <button
                  key={g.id}
                  onClick={() => (s.both ? onStart(g.id) : onToggle(g.id))}
                  disabled={locked}
                  className={`relative flex flex-col gap-2 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                    locked ? "opacity-45" : ""
                  }`}
                  style={{
                    borderColor: s.both ? g.accent : "var(--line)",
                    background: s.both ? `${g.accent}1A` : "var(--surface)",
                  }}
                >
                  <span className="flex items-start justify-between">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-xl"
                      style={{ background: `${g.accent}22`, color: g.accent }}
                    >
                      <Icon name={g.icon} className="h-5 w-5" />
                    </span>
                    {locked ? (
                      <span className="flex items-center gap-1 rounded-full bg-line/40 px-2 py-1 text-[10px] font-bold text-inksoft">
                        <Icon name="lock" className="h-3 w-3" />
                        {g.unlock}
                      </span>
                    ) : (
                      <span
                        className="font-mono text-[10px] font-bold"
                        style={{ color: g.accent }}
                      >
                        +{g.pts}
                      </span>
                    )}
                  </span>

                  <span className="block text-sm font-bold leading-tight">{g.name}</span>
                  <span className="block text-[11px] text-inksoft">
                    {g.tag} · {g.time}
                  </span>

                  {!locked && (
                    <span className="mt-auto pt-1">
                      {s.both ? (
                        <span
                          className="block rounded-full py-1.5 text-center text-xs font-extrabold text-[#06281A]"
                          style={{ background: g.accent }}
                        >
                          START
                        </span>
                      ) : (
                        <Readiness s={s} otherName={otherName} compact />
                      )}
                    </span>
                  )}
                  {s.played && !s.both && (
                    <span className="absolute right-2 top-2 text-[10px] text-inksoft">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ------------------------------------------------------ POSTĘP */}
          {progress && (
            <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold">
                  Do „{progress.game.name}" brakuje{" "}
                  <b className="text-gold">{progress.missing} pkt</b>
                </span>
                <Icon name="lock" className="h-3.5 w-3.5 text-inksoft" />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(4, Math.round((points / progress.game.unlock) * 100))}%`,
                    background: progress.game.accent,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-inksoft">
                {gamesLeftLabel(Math.max(1, Math.ceil(progress.missing / 60)))}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------- KOŁO NA WIERZCHU */}
      {wheelOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg/95 px-6 backdrop-blur"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-display text-2xl font-extrabold">Zakręćcie kołem</p>
          <GameWheel
            games={available}
            channel={channel}
            onResult={(id) => {
              setWheelOpen(false);
              onStart(id);
            }}
          />
          <button
            onClick={() => setWheelOpen(false)}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-inksoft"
          >
            Wolimy wybrać sami
          </button>
        </div>
      )}
    </div>
  );
}

/** Polska odmiana: 1 gra, 2–4 gry, 5+ gier. */
function gamesLeftLabel(n: number) {
  const last = n % 10;
  const teen = n % 100 >= 12 && n % 100 <= 14;
  if (n === 1) return "To mniej więcej jedna wspólna gra.";
  if (!teen && last >= 2 && last <= 4) return `To mniej więcej ${n} wspólne gry.`;
  return `To mniej więcej ${n} wspólnych gier.`;
}

function Section({ label, note }: { label: string; note?: string }) {
  return (
    <div className="mb-2.5 mt-6 flex items-baseline gap-2 first:mt-1">
      <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-inksoft">
        {label}
      </h3>
      {note && <span className="text-[11px] text-inksoft/70">· {note}</span>}
    </div>
  );
}

function Readiness({
  s,
  otherName,
  compact,
}: {
  s: { iWant: boolean; theyWant: boolean };
  otherName: string;
  compact?: boolean;
}) {
  return (
    <span className={`flex items-center gap-2 ${compact ? "text-[10px]" : "text-[11px]"}`}>
      <Chip label="Ty" on={s.iWant} />
      <Chip label={compact ? otherName.slice(0, 6) : otherName} on={s.theyWant} />
    </span>
  );
}

function Chip({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={`flex items-center gap-1 font-bold ${
        on ? "text-berry" : "text-inksoft/60"
      }`}
    >
      <span
        className={`grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] ${
          on ? "bg-[#8FE3C2] text-[#06281A]" : "border border-line"
        }`}
      >
        {on ? "✓" : ""}
      </span>
      <span className="max-w-[60px] truncate">{label}</span>
    </span>
  );
}
