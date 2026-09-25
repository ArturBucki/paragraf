"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "./types";
import { Won } from "./types";
import { riddleForMatch, answerOf } from "@/lib/riddles";

/**
 * Zagadka we dwoje.
 *
 * Dwie rzeczy, bez których to nie jest gra kooperacyjna:
 *  1. Żadna połowa wskazówek nie wystarcza — patrz src/lib/riddles.ts.
 *  2. Liczą się ODPOWIEDZI OBOJGA. Wcześniej jedno kliknięcie kończyło grę
 *     za dwie osoby: druga mogła w ogóle nie dotknąć ekranu i i tak dostawała
 *     punkty „za współpracę".
 */
export function Riddle({ isA, otherName, channel, onFinish, matchId }: GameProps) {
  const riddle = useMemo(() => riddleForMatch(matchId), [matchId]);
  const answer = useMemo(() => answerOf(riddle), [riddle]);
  const myClue = isA ? riddle.clueA : riddle.clueB;

  const [mine, setMine] = useState<string | null>(null);
  const [theirs, setTheirs] = useState<string | null>(null);
  const [miss, setMiss] = useState(false);
  const [solved, setSolved] = useState(false);

  const mineRef = useRef<string | null>(null);
  mineRef.current = mine;

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "riddle" }, ({ payload }) => {
      if (!payload || payload.isA === isA) return; // moje własne echo
      setTheirs(payload.answer ?? null);

      // Kolejność kliknięć jest przypadkowa, więc gdy druga osoba odzywa się
      // po mnie, odsyłam swój wybór — inaczej u niej zostałby pusty.
      if (mineRef.current && !payload.echo) {
        channel.send({
          type: "broadcast",
          event: "riddle",
          payload: { isA, answer: mineRef.current, echo: true },
        });
      }
    });
  }, [channel, isA]);

  useEffect(() => {
    if (!mine || !theirs) return;
    if (mine === answer && theirs === answer) {
      setSolved(true);
      return;
    }
    // Rozjazd: czyścimy oboje i wracamy do rozmowy, zamiast zdradzać odpowiedź.
    setMiss(true);
    const t = setTimeout(() => {
      setMine(null);
      setTheirs(null);
      setMiss(false);
    }, 2600);
    return () => clearTimeout(t);
  }, [mine, theirs, answer]);

  function pick(opt: string) {
    if (solved || miss) return;
    setMine(opt);
    channel?.send({
      type: "broadcast",
      event: "riddle",
      payload: { isA, answer: opt },
    });
  }

  function cofnij() {
    setMine(null);
    channel?.send({
      type: "broadcast",
      event: "riddle",
      payload: { isA, answer: null },
    });
  }

  if (solved) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
        <Won
          title="Rozwiązane razem!"
          sub={`Twoja połowa wskazywała trzy rzeczy, połowa ${otherName} — trzy inne. Wspólna była jedna.`}
          onFinish={onFinish}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-4">
      <div className="rounded-2xl border border-line bg-gold/10 p-4 text-sm">
        <b>Twoje wskazówki:</b> {myClue}
      </div>

      <p className="text-sm text-inksoft">
        Do Twojej wskazówki pasują <b>trzy</b> rzeczy. {otherName} widzi inną
        wskazówkę i też trzy — ale wspólna jest tylko jedna. Sami nie zgadniecie:
        napiszcie do siebie na dole.
      </p>

      {/* Co robi druga osoba — bez tego czeka się w ciemno. */}
      <div
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold ${
          miss
            ? "bg-coral/15 text-coraldeep"
            : theirs
              ? "bg-berry/12 text-berry"
              : "bg-surface2 text-inksoft"
        }`}
      >
        {miss ? (
          <>Nie zgadza się — wybraliście różne rzeczy. Pogadajcie i spróbujcie jeszcze raz.</>
        ) : theirs ? (
          <>{otherName} ma już swoją odpowiedź{mine ? "" : " — teraz Ty"}.</>
        ) : mine ? (
          // Bez „czekasz na {imię}" — polska odmiana zrobiłaby z tego
          // „czekasz na Artur". Imię zostaje w mianowniku.
          <>Masz swoją odpowiedź. Teraz {otherName}.</>
        ) : (
          <>Liczą się odpowiedzi obojga — gra policzy je razem.</>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {riddle.options.map((o) => {
          const wybrane = mine === o;
          return (
            <button
              key={o}
              onClick={() => pick(o)}
              disabled={!!mine || miss}
              className={`rounded-2xl border-2 p-4 font-semibold transition active:scale-95 disabled:cursor-default ${
                wybrane
                  ? "border-coral bg-coral/12 text-ink"
                  : "border-line bg-surface text-ink disabled:opacity-45"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>

      {mine && !miss && (
        <button
          onClick={cofnij}
          className="self-center rounded-xl px-4 py-2 text-sm font-semibold text-inksoft underline underline-offset-4"
        >
          Zmień odpowiedź
        </button>
      )}
    </div>
  );
}
