"use client";

import { useEffect, useMemo, useRef } from "react";
import type { GameProps } from "./types";
import { Won } from "./types";
import { Q36, ROUND_LABEL } from "@/lib/questions";

/** Ile pytań domyka rundę. Trzy, nie trzydzieści sześć — to ma być kilka minut. */
const ILE = 3;
const PREFIX = "__pytanie__";

/**
 * Pytanie za pytanie.
 *
 * Przebudowane po teście we dwoje. Wcześniej gra miała własne pole „Twoja
 * odpowiedź…", przechodziła przez wszystkie pytania po kolei i trzymała
 * odpowiedzi w pamięci przeglądarki — czyli po całej szczerości nie zostawał
 * ślad. Teraz:
 *
 *  - pytanie ląduje w rozmowie jako zwykła wiadomość,
 *  - odpowiada się normalnym czatem pod spodem,
 *  - kolejne pytanie odsłania się, gdy oboje coś napiszą,
 *  - każde z Was może w każdej chwili zmienić pytanie albo skończyć.
 *
 * Stan gry nie jest nigdzie trzymany — wynika z samych wiadomości, więc oboje
 * zawsze widzą to samo i nie ma czego synchronizować.
 */
export function Questions36({
  matchId,
  isA,
  otherName,
  channel,
  onFinish,
  messages = [],
  meId = "",
  ask,
}: GameProps) {
  // Ta sama kolejność u obojga — bez losowania po stronie klienta.
  const kolejka = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < matchId.length; i++) sum += matchId.charCodeAt(i);
    return Q36.map((_, i) => i).sort(
      (a, b) => ((a * 31 + sum) % Q36.length) - ((b * 31 + sum) % Q36.length),
    );
  }, [matchId]);

  // Od tego miejsca w rozmowie zaczyna się ta rozgrywka.
  const startRef = useRef(messages.length);
  const odcinek = messages.slice(startRef.current);

  const zadane = odcinek.filter((m) => m.body.startsWith(PREFIX));
  const indeksy = odcinek
    .map((m, i) => (m.body.startsWith(PREFIX) ? i : -1))
    .filter((i) => i >= 0);

  /** Czy przy pytaniu o danym numerze odezwali się oboje. */
  function odpowiedzieliOboje(nr: number) {
    const od = indeksy[nr];
    const do_ = indeksy[nr + 1] ?? odcinek.length;
    const czesc = odcinek.slice(od + 1, do_).filter((m) => !m.body.startsWith("__"));
    return (
      czesc.some((m) => m.sender === meId) && czesc.some((m) => m.sender !== meId)
    );
  }

  const zamkniete = indeksy.filter((_, nr) => odpowiedzieliOboje(nr)).length;
  const aktualne = zadane.length - 1;
  const czekamy = aktualne >= 0 && !odpowiedzieliOboje(aktualne);
  const skonczone = zamkniete >= ILE;

  const trescAktualnego = aktualne >= 0 ? zadane[aktualne].body.slice(PREFIX.length) : null;
  const pytanieQ36 = useMemo(() => {
    const idx = kolejka[zadane.length % kolejka.length];
    return Q36[idx];
  }, [kolejka, zadane.length]);

  // Pytania wrzuca tylko jedna strona — inaczej wpadłyby dwa naraz.
  const zadaj = useRef<() => void>(() => {});
  zadaj.current = () => {
    if (!isA || !ask || skonczone) return;
    ask(pytanieQ36.q);
  };

  // Pierwsze pytanie + każde kolejne, gdy poprzednie zamknięte.
  useEffect(() => {
    if (skonczone || czekamy) return;
    const t = setTimeout(() => zadaj.current(), zadane.length === 0 ? 150 : 1200);
    return () => clearTimeout(t);
  }, [skonczone, czekamy, zadane.length]);

  // „Inne pytanie" — klika jedno, zmienia się obojgu.
  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "q36skip" }, () => {
      if (isA && ask) ask(pytanieQ36.q);
    });
  }, [channel, isA, ask, pytanieQ36]);

  function zmien() {
    if (isA && ask) ask(pytanieQ36.q);
    else channel?.send({ type: "broadcast", event: "q36skip", payload: {} });
  }

  if (skonczone) {
    return (
      <div className="flex flex-1 flex-col justify-center px-1">
        <Won
          title="Wiecie o sobie więcej"
          sub="Pytania i odpowiedzi zostają w Waszej rozmowie — możecie do nich wrócić."
          onFinish={onFinish}
        />
      </div>
    );
  }

  const mojaOdp = aktualne >= 0 && (() => {
    const od = indeksy[aktualne];
    return odcinek
      .slice(od + 1)
      .some((m) => m.sender === meId && !m.body.startsWith("__"));
  })();

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-berry">
          {ROUND_LABEL[pytanieQ36.round]}
        </span>
        <span className="font-mono text-[10px] text-inksoft">
          {Math.min(zamkniete + 1, ILE)} / {ILE}
        </span>
      </div>

      <div className="rounded-2xl border border-line bg-gold/10 px-4 py-4 text-[17px] font-bold leading-snug">
        {trescAktualnego ?? "…"}
      </div>

      <p className="text-[13px] leading-relaxed text-inksoft">
        {mojaOdp
          ? `Twoja odpowiedź poszła. Teraz ${otherName}.`
          : "Odpowiedz normalnie, w rozmowie na dole. Kolejne pytanie pokaże się, gdy oboje coś napiszecie."}
      </p>

      <div className="mt-1 flex flex-wrap gap-2">
        <button
          onClick={zmien}
          className="rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-inksoft transition active:scale-95"
        >
          Inne pytanie
        </button>
        {zamkniete > 0 && (
          <button
            onClick={onFinish}
            className="rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-inksoft transition active:scale-95"
          >
            Wystarczy na teraz
          </button>
        )}
      </div>
    </div>
  );
}
