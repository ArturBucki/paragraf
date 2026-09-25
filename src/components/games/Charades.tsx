"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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

/**
 * Kalambury.
 *
 * Zgaduje się ZWYKŁYM czatem pod spodem — gra nie ma własnego pola „Co to
 * jest?". Wcześniej na jednym ekranie były dwa miejsca do pisania, a strzały
 * lądowały w ulotnych plakietkach zamiast w rozmowie. Teraz rysujący widzi
 * próby tam, gdzie i tak patrzy, a po grze zostaje po nich ślad.
 */
export function Charades({
  matchId,
  isA,
  otherName,
  channel,
  onFinish,
  messages = [],
  meId = "",
}: GameProps) {
  const word = useMemo(() => pickFor(WORDS, matchId), [matchId]);
  const iDraw = isA;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  // Rozgrywka zaczyna się tu — wcześniejsze wiadomości nie są strzałami.
  const startRef = useRef(messages.length);
  const strzaly = messages
    .slice(startRef.current)
    .filter((m) => !m.body.startsWith("__"))
    .filter((m) => (iDraw ? m.sender !== meId : m.sender === meId));

  // Oboje liczą to samo z tych samych wiadomości — nie ma czego synchronizować.
  const solved = strzaly.some((m) => norm(m.body) === norm(word));

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
    });
  }, [channel, stroke]);

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  if (solved) {
    return (
      <div className="flex flex-1 flex-col justify-center px-1 py-4">
        <Won
          title={`To było „${word}”!`}
          sub={
            iDraw
              ? "Twój rysunek wystarczył."
              : "Trafione — dwoje na jednej fali."
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
            <div className="text-xs text-inksoft">
              Bez liter i cyfr. Strzały {otherName} zobaczysz w rozmowie pod spodem.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <Icon name="puzzle" className="h-5 w-5 flex-none text-berry" />
          <div className="text-sm">
            {otherName} rysuje — <b>zgadnij, co to jest</b>.
            <div className="text-xs text-inksoft">
              Rysunek pojawia się na żywo. Strzelaj w rozmowie pod spodem.
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

      {iDraw && (
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
      )}
    </div>
  );
}
