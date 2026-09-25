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
export function Truths({
  matchId,
  isA,
  otherName,
  channel,
  onFinish,
  seed = 0,
}: GameProps) {
  // Zestaw, który zgaduję = zestaw „drugiej osoby".
  const zrodlo = useMemo(
    () => truthSetFor(matchId, (isA ? 1 : 0) + seed * 2),
    [matchId, isA, seed],
  );

  /*
   * Kłamstwo BYŁO ZAWSZE NA ŚRODKU. Wystarczyło zagrać raz, żeby już nigdy
   * nie zgadywać — zawsze wybierasz drugie zdanie i masz rację. Teraz kolejność
   * jest mieszana ziarnem rozgrywki, więc kłamstwo ląduje gdzie indziej za
   * każdym razem, a oboje i tak widzą to samo.
   */
  const { theirSet, lieIndex } = useMemo(() => {
    const kolejnosc = [0, 1, 2].sort(
      (a, b) => ((a * 7 + seed) % 3) - ((b * 7 + seed) % 3),
    );
    return {
      theirSet: kolejnosc.map((i) => zrodlo[i]),
      lieIndex: kolejnosc.indexOf(1),
    };
  }, [zrodlo, seed]);

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
        zmyślone. Które kłamie? Potem dopytajcie o te prawdziwe — tam jest
        cała zabawa.
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
              ? `${otherName} też ma już swój typ.`
              : `Czekamy na ${otherName}…`}
          </p>
          <Won
            title={correct ? "Trafione!" : "Prawie!"}
            sub={
              correct
                ? `Nieźle. ${otherName} nie ma z Tobą łatwo.`
                : "Pudło — czyli masz o co dopytać w rozmowie."
            }
            onFinish={onFinish}
          />
        </>
      )}
    </div>
  );
}
