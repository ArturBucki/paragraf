"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameProps } from "./types";
import { Won } from "./types";
import { truthSetFor } from "@/lib/questions";

/**
 * Dwie prawdy, jedno kłamstwo — obie osoby grają naraz:
 * każde wybiera swoje kłamstwo z zestawu drugiej osoby.
 * Zestawy są różne (salt), więc nie zgadujecie tego samego.
 */
export function Truths({ matchId, isA, otherName, channel, onFinish }: GameProps) {
  // Zestaw, który zgaduję = zestaw „drugiej osoby".
  const theirSet = useMemo(() => truthSetFor(matchId, isA ? 1 : 0), [matchId, isA]);
  // Kłamstwo jest zawsze na środku — proste i spójne u obojga.
  const lieIndex = 1;

  const [picked, setPicked] = useState<number | null>(null);
  const [theirDone, setTheirDone] = useState(false);

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "truths" }, ({ payload }) => {
      if (payload?.done) setTheirDone(true);
    });
  }, [channel]);

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    channel?.send({ type: "broadcast", event: "truths", payload: { done: true } });
  }

  const correct = picked === lieIndex;

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
      <p className="text-sm text-inksoft">
        Trzy zdania o <b className="text-ink">{otherName}</b>. Dwa są prawdziwe, jedno
        zmyślone. Które kłamie?
      </p>

      <div className="flex flex-col gap-2">
        {theirSet.map((t, i) => {
          const revealed = picked !== null;
          const isLie = i === lieIndex;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={revealed}
              className={`rounded-2xl border p-4 text-left text-sm transition ${
                !revealed
                  ? "border-line bg-surface active:scale-[0.99]"
                  : isLie
                    ? "border-coral bg-coral/12"
                    : "border-line bg-surface opacity-55"
              }`}
            >
              {t}
              {revealed && (
                <span
                  className={`mt-2 block font-mono text-[10px] uppercase tracking-wide ${
                    isLie ? "text-coraldeep" : "text-inksoft"
                  }`}
                >
                  {isLie ? "✗ kłamstwo" : "✓ prawda"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <>
          <p className="text-center text-sm text-inksoft">
            {theirDone
              ? `${otherName} też już zgadywała.`
              : `Czekamy, aż ${otherName} zgadnie Twój zestaw…`}
          </p>
          <Won
            title={correct ? "Zgadłeś!" : "Prawie!"}
            sub={
              correct
                ? `Nieźle rozgryzasz ${otherName}.`
                : "Nie trafiłeś — masz o co dopytać na czacie."
            }
            onFinish={onFinish}
          />
        </>
      )}
    </div>
  );
}
