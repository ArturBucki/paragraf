"use client";

import { useEffect, useState } from "react";
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
  const [wrong, setWrong] = useState<string | null>(null);
  const done = step >= LOCKS.length;
  const lock = LOCKS[Math.min(step, LOCKS.length - 1)];
  const myClue = isA ? lock.clueA : lock.clueB;

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "escape" }, ({ payload }) => {
      if (typeof payload?.step === "number") setStep(payload.step);
    });
  }, [channel]);

  function pick(opt: string) {
    if (opt !== lock.answer) {
      setWrong(opt);
      setTimeout(() => setWrong(null), 900);
      return;
    }
    const next = step + 1;
    setStep(next);
    channel?.send({ type: "broadcast", event: "escape", payload: { step: next } });
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
              i < step ? "bg-[#8FE3C2]" : "bg-line"
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
        {otherName} ma <b>drugą połowę</b>. Napiszcie do siebie i otwórzcie zamek.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {lock.options.map((o) => (
          <button
            key={o}
            onClick={() => pick(o)}
            className={`rounded-2xl border border-line bg-surface p-4 font-semibold transition active:scale-95 ${
              wrong === o ? "opacity-40" : ""
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
