"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Game } from "@/lib/games";
import { Icon } from "@/components/Icon";

// Kolory segmentów — naprzemiennie, w ramach palety apki.
const SEG = ["#17614A", "#0B3B2C"];
const SPIN_MS = 3400;

// Etykieta w dolnej połowie koła byłaby do góry nogami — obracamy ją o 180°.
function labelAngle(i: number, seg: number) {
  const a = (i + 0.5) * seg;
  return a > 90 && a < 270 ? a + 180 : a;
}

/**
 * Koło losowania. Wynik jest ustalany PRZED animacją i rozsyłany drugiej osobie,
 * żeby u obojga koło zatrzymało się na tym samym polu — inaczej losowanie
 * przestaje być wspólne.
 */
export function GameWheel({
  games,
  channel,
  onResult,
}: {
  games: Game[];
  channel: RealtimeChannel | null;
  onResult: (gameId: string) => void;
}) {
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<Game | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = games.length;
  const seg = n > 0 ? 360 / n : 360;

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "wheel" }, ({ payload }) => {
      if (typeof payload?.idx === "number" && typeof payload?.turns === "number") {
        run(payload.idx, payload.turns, false);
      }
    });
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, n]);

  function run(idx: number, turns: number, iStarted: boolean) {
    if (spinning || !games[idx]) return;
    setSpinning(true);
    setLanded(null);
    // Wskaźnik jest na górze (12:00) — obracamy tak, by środek pola trafił pod niego.
    const target = turns * 360 + (360 - (idx * seg + seg / 2));
    setRot(target);
    timer.current = setTimeout(() => {
      setSpinning(false);
      setLanded(games[idx]);
      // Grę uruchamia tylko osoba, która zakręciła — inaczej start poleciałby dwa razy.
      if (iStarted) setTimeout(() => onResult(games[idx].id), 900);
    }, SPIN_MS);
  }

  function spin() {
    if (spinning || n === 0) return;
    const idx = Math.floor(Math.random() * n);
    const turns = 4 + Math.floor(Math.random() * 2);
    channel?.send({ type: "broadcast", event: "wheel", payload: { idx, turns } });
    run(idx, turns, true);
  }

  if (n === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-4 text-center text-sm text-inksoft">
        Brak gier do losowania — zdobądźcie punkty.
      </p>
    );
  }

  const R = 100;
  const C = 110;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* wskaźnik */}
        <div
          className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 -translate-y-[2px]"
          style={{
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            borderTop: "16px solid #FF7A5C",
          }}
        />
        <svg
          viewBox="0 0 220 220"
          className="h-[220px] w-[220px] drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
          style={{
            transform: `rotate(${rot}deg)`,
            transition: spinning
              ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 0.84, 0.28, 1)`
              : "none",
          }}
        >
          <circle cx={C} cy={C} r={R + 6} fill="#3A8A70" />
          {games.map((g, i) => {
            const a0 = (i * seg - 90) * (Math.PI / 180);
            const a1 = ((i + 1) * seg - 90) * (Math.PI / 180);
            const x0 = C + R * Math.cos(a0);
            const y0 = C + R * Math.sin(a0);
            const x1 = C + R * Math.cos(a1);
            const y1 = C + R * Math.sin(a1);
            const large = seg > 180 ? 1 : 0;
            // środek pola — tam trafia etykieta
            const am = ((i + 0.5) * seg - 90) * (Math.PI / 180);
            const lx = C + R * 0.62 * Math.cos(am);
            const ly = C + R * 0.62 * Math.sin(am);
            return (
              <g key={g.id}>
                <path
                  d={`M${C} ${C} L${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`}
                  fill={SEG[i % SEG.length]}
                  stroke="#3A8A70"
                  strokeWidth="1"
                />
                <text
                  x={lx}
                  y={ly}
                  fill="#F2EFE4"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${labelAngle(i, seg)} ${lx} ${ly})`}
                >
                  {g.short}
                </text>
              </g>
            );
          })}
          <circle cx={C} cy={C} r="19" fill="#FF7A5C" stroke="#0A3B2C" strokeWidth="3" />
        </svg>
      </div>

      {landed ? (
        <div className="flex items-center gap-2 rounded-full bg-[#6FD3A6] px-4 py-2 text-sm font-bold text-[#14211C]">
          <Icon name={landed.icon} className="h-4 w-4" />
          {landed.name}
        </div>
      ) : (
        <button
          onClick={spin}
          disabled={spinning}
          className="rounded-full bg-coral px-8 py-3 font-bold text-[#14211C] transition active:scale-95 disabled:opacity-60"
        >
          {spinning ? "Kręci się…" : "Zakręćcie kołem"}
        </button>
      )}
    </div>
  );
}
