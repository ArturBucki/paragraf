"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";
import { Won } from "./types";
import { LOCKS } from "@/lib/questions";
import { Icon } from "@/components/Icon";

/**
 * Escape room we dwoje — trzy zamki pod rząd.
 * Przy każdym każda osoba widzi INNĄ połowę wskazówek, więc bez rozmowy
 * nie da się otworzyć żadnego. To najczystsza forma współpracy w apce.
 */
export function EscapeRoom({ isA, otherName, channel, onFinish }: GameProps) {
  const [step, setStep] = useState(0);
  const [mine, setMine] = useState<string | null>(null);
  const [theirs, setTheirs] = useState<string | null>(null);
  const [miss, setMiss] = useState(false);
  const mineRef = useRef<string | null>(null);
  mineRef.current = mine;
  const done = step >= LOCKS.length;
  const lock = LOCKS[Math.min(step, LOCKS.length - 1)];
  const myClue = isA ? lock.clueA : lock.clueB;

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "escape" }, ({ payload }) => {
      if (!payload || payload.isA === isA) return;
      setTheirs(payload.answer ?? null);
      if (mineRef.current && !payload.echo) {
        channel.send({
          type: "broadcast",
          event: "escape",
          payload: { isA, answer: mineRef.current, echo: true },
        });
      }
    });
  }, [channel, isA]);

  // Zamek otwiera się dopiero, gdy OBOJE wskażą to samo i poprawnie.
  // Wcześniej wystarczyło jedno trafne kliknięcie — druga osoba mogła w ogóle
  // nie dotknąć ekranu, a i tak „uciekaliście razem".
  useEffect(() => {
    if (!mine || !theirs) return;
    if (mine === lock.answer && theirs === lock.answer) {
      const t = setTimeout(() => {
        setStep((s) => s + 1);
        setMine(null);
        setTheirs(null);
      }, 700);
      return () => clearTimeout(t);
    }
    setMiss(true);
    const t = setTimeout(() => {
      setMine(null);
      setTheirs(null);
      setMiss(false);
    }, 2600);
    return () => clearTimeout(t);
  }, [mine, theirs, lock.answer]);

  function pick(opt: string) {
    if (mine || miss) return;
    setMine(opt);
    channel?.send({
      type: "broadcast",
      event: "escape",
      payload: { isA, answer: opt },
    });
  }

  if (done) {
    return (
      <div className="flex flex-1 flex-col justify-center py-4">
        <Won
          title="Uciekliście razem!"
          sub="Trzy zamki, dwie połówki wskazówek. Bez siebie ani rusz."
          onFinish={onFinish}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
      {/* postęp */}
      <div className="flex flex-none gap-1.5">
        {LOCKS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < step ? "bg-berry" : "bg-line"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Icon name="lock" className="h-4 w-4 text-gold" />
        <span className="font-mono text-[11px] uppercase tracking-wide text-gold">
          {lock.label}
        </span>
      </div>

      <div className="rounded-2xl border border-line bg-gold/10 p-4 text-sm">
        <b>Twoja wskazówka:</b> {myClue}
      </div>

      <p className="text-sm text-inksoft">
        {otherName} ma <b>drugą połowę</b>. Napiszcie do siebie w rozmowie pod
        spodem — zamek puści dopiero, gdy oboje wskażecie to samo.
      </p>

      <div
        className={`rounded-xl px-3 py-2 text-[13px] font-semibold ${
          miss
            ? "bg-coral/15 text-coraldeep"
            : theirs
              ? "bg-berry/12 text-berry"
              : "bg-surface2 text-inksoft"
        }`}
      >
        {miss ? (
          <>Zamek ani drgnął — wskazaliście różne rzeczy. Pogadajcie jeszcze.</>
        ) : theirs ? (
          <>{otherName} ma już swój wybór{mine ? "" : " — teraz Ty"}.</>
        ) : mine ? (
          <>Twój wybór poszedł. Teraz {otherName}.</>
        ) : (
          <>Zamek otwieracie oboje naraz.</>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {lock.options.map((o) => (
          <button
            key={o}
            onClick={() => pick(o)}
            disabled={!!mine || miss}
            className={`rounded-2xl border-2 p-4 font-semibold transition active:scale-95 disabled:cursor-default ${
              mine === o
                ? "border-coral bg-coral/12"
                : "border-line bg-surface disabled:opacity-45"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
