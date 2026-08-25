"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameProps } from "./types";
import { Won } from "./types";
import { riddleForMatch } from "@/lib/riddles";

export function Riddle({ matchId, isA, otherName, channel, onFinish }: GameProps) {
  const riddle = useMemo(() => riddleForMatch(matchId), [matchId]);
  const myClue = isA ? riddle.clueA : riddle.clueB;
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "riddle" }, ({ payload }) => {
      if (payload?.answer === riddle.answer) setSolved(true);
    });
  }, [channel, riddle.answer]);

  function pick(opt: string) {
    if (opt === riddle.answer) {
      setSolved(true);
      channel?.send({ type: "broadcast", event: "riddle", payload: { answer: opt } });
    } else {
      setWrong(opt);
      setTimeout(() => setWrong(null), 900);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
      <div className="rounded-2xl border border-line bg-gold/10 p-4 text-sm">
        <b>Twoje wskazówki:</b> {myClue}
      </div>
      <p className="text-sm text-inksoft">
        {otherName} widzi <b>inne</b> wskazówki. Napiszcie do siebie i złóżcie je w całość.
      </p>

      {solved ? (
        <Won
          title="Rozwiązane razem!"
          sub="Bez wskazówek drugiej osoby by się nie udało."
          onFinish={onFinish}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {riddle.options.map((o) => (
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
      )}
    </div>
  );
}
