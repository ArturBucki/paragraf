"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "./types";
import { Won, pickFor } from "./types";
import { Icon } from "@/components/Icon";

const WORDS = [
  "parasol", "rower", "pingwin", "gitara", "latarnia morska", "arbuz",
  "budzik", "żyrafa", "kanapka", "rakieta", "choinka", "okulary",
  "hamak", "balon", "termos", "sowa", "karuzela", "kaktus",
];

// Porównanie odporne na literówki w formie ogonków i wielkości liter.
const norm = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[ąàáâ]/g, "a")
    .replace(/[ćç]/g, "c")
    .replace(/[ę]/g, "e")
    .replace(/[ł]/g, "l")
    .replace(/[ń]/g, "n")
    .replace(/[óô]/g, "o")
    .replace(/[ś]/g, "s")
    .replace(/[żź]/g, "z")
    .replace(/\s+/g, " ");

export function Charades({ matchId, isA, otherName, channel, onFinish }: GameProps) {
  const word = useMemo(() => pickFor(WORDS, matchId), [matchId]);
  const iDraw = isA;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);

  const stroke = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const cv = canvasRef.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) return;
      ctx.strokeStyle = "#F2EFE4";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(from.x * cv.width, from.y * cv.height);
      ctx.lineTo(to.x * cv.width, to.y * cv.height);
      ctx.stroke();
    },
    [],
  );

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = cv.clientWidth;
    cv.height = cv.clientHeight;
  }, []);

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "chr" }, ({ payload }) => {
      if (payload?.from && payload?.to) stroke(payload.from, payload.to);
      if (payload?.clear) {
        const cv = canvasRef.current;
        cv?.getContext("2d")?.clearRect(0, 0, cv.width, cv.height);
      }
      if (payload?.guess) setAttempts((p) => [...p.slice(-4), payload.guess]);
      if (payload?.solved) setSolved(true);
    });
  }, [channel, stroke]);

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function submitGuess(e: React.FormEvent) {
    e.preventDefault();
    const g = guess.trim();
    if (!g) return;
    setGuess("");
    setAttempts((p) => [...p.slice(-4), g]);
    channel?.send({ type: "broadcast", event: "chr", payload: { guess: g } });
    if (norm(g) === norm(word)) {
      setSolved(true);
      channel?.send({ type: "broadcast", event: "chr", payload: { solved: true } });
    }
  }

  if (solved) {
    return (
      <div className="flex flex-1 flex-col justify-center px-1 py-4">
        <Won
          title={`To było „${word}”!`}
          sub={
            iDraw
              ? `${otherName} zgadła. Nieźle rysujesz.`
              : "Zgadłeś — dobra robota, dwoje na jednej fali."
          }
          onFinish={onFinish}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 py-4">
      {iDraw ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-gold/10 p-3">
          <Icon name="brush" className="h-5 w-5 flex-none text-gold" />
          <div className="text-sm">
            Rysujesz: <b className="text-base">{word}</b>
            <div className="text-xs text-inksoft">Bez liter i cyfr — tylko rysunek.</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <Icon name="puzzle" className="h-5 w-5 flex-none text-berry" />
          <div className="text-sm">
            {otherName} rysuje — <b>zgadnij, co to jest</b>.
            <div className="text-xs text-inksoft">
              Rysunek pojawia się na żywo. Strzelaj śmiało.
            </div>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          if (!iDraw) return;
          drawing.current = true;
          last.current = pos(e);
        }}
        onPointerMove={(e) => {
          if (!iDraw || !drawing.current || !last.current) return;
          const p = pos(e);
          stroke(last.current, p);
          channel?.send({
            type: "broadcast",
            event: "chr",
            payload: { from: last.current, to: p },
          });
          last.current = p;
        }}
        onPointerUp={() => {
          drawing.current = false;
          last.current = null;
        }}
        onPointerLeave={() => {
          drawing.current = false;
          last.current = null;
        }}
        className={`min-h-[240px] flex-1 rounded-2xl border border-line bg-[#14211C] ${
          iDraw ? "touch-none" : ""
        }`}
      />

      {attempts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attempts.map((a, i) => (
            <span
              key={i}
              className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-inksoft"
            >
              {a}
            </span>
          ))}
        </div>
      )}

      {iDraw ? (
        <button
          onClick={() => {
            const cv = canvasRef.current;
            cv?.getContext("2d")?.clearRect(0, 0, cv.width, cv.height);
            channel?.send({ type: "broadcast", event: "chr", payload: { clear: true } });
          }}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-inksoft"
        >
          Wyczyść i rysuj od nowa
        </button>
      ) : (
        <form onSubmit={submitGuess} className="flex gap-2">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Co to jest?"
            className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-[#14211C]"
          >
            Zgaduj
          </button>
        </form>
      )}
    </div>
  );
}
