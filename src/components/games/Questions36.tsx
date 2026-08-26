"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";
import { Won } from "./types";
import { Q36, ROUND_LABEL } from "@/lib/questions";

type Entry = { q: string; mine?: string; theirs?: string };

/**
 * 36 pytań — sedno metody Arona: odpowiadacie OBOJE na to samo pytanie,
 * a kolejne pytanie odblokowuje się dopiero, gdy oboje odpowiedzieli.
 * Bez wzajemności nie ma zbliżenia — dlatego nie da się tu „przewinąć".
 */
export function Questions36({ otherName, channel, onFinish }: GameProps) {
  const [i, setI] = useState(0);
  const [log, setLog] = useState<Entry[]>([{ q: Q36[0].q }]);
  const [text, setText] = useState("");
  const [mineSent, setMineSent] = useState(false);
  const [theirsIn, setTheirsIn] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const current = Q36[i];
  const done = i >= Q36.length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log, theirsIn]);

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "q36" }, ({ payload }) => {
      if (typeof payload?.idx !== "number" || typeof payload?.text !== "string") return;
      if (payload.idx !== i) return;
      setTheirsIn(payload.text);
    });
  }, [channel, i]);

  // Gdy oboje odpowiedzieli — zapisz parę i przejdź dalej.
  useEffect(() => {
    if (!mineSent || theirsIn === null) return;
    setLog((prev) => {
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], theirs: theirsIn };
      return next;
    });
    const t = setTimeout(() => {
      const nextIdx = i + 1;
      setI(nextIdx);
      setMineSent(false);
      setTheirsIn(null);
      if (nextIdx < Q36.length) {
        setLog((prev) => [...prev, { q: Q36[nextIdx].q }]);
      }
    }, 1400);
    return () => clearTimeout(t);
  }, [mineSent, theirsIn, i]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || mineSent || done) return;
    setText("");
    setMineSent(true);
    setLog((prev) => {
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], mine: t };
      return next;
    });
    channel?.send({ type: "broadcast", event: "q36", payload: { idx: i, text: t } });
  }

  return (
    <div className="flex flex-1 flex-col py-3">
      {!done && (
        <div className="mb-2 flex flex-none items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-berry">
            {ROUND_LABEL[current.round]}
          </span>
          <span className="font-mono text-[10px] text-inksoft">
            {i + 1} / {Q36.length}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-2">
        {log.map((e, idx) => (
          <div key={idx} className="flex flex-col gap-2">
            <div className="rounded-2xl border border-line bg-gold/10 px-4 py-3 text-sm font-semibold">
              {e.q}
            </div>
            {e.mine && (
              <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-coral px-3.5 py-2.5 text-sm text-[rgb(var(--on-coral))]">
                {e.mine}
              </div>
            )}
            {e.theirs && (
              <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2.5 text-sm">
                <div className="mb-0.5 font-mono text-[10px] font-bold text-berry">
                  {otherName}
                </div>
                {e.theirs}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {done ? (
        <Won
          title="Poznaliście się głębiej"
          sub="Takie rozmowy zbliżają najmocniej — i zostają."
          onFinish={onFinish}
        />
      ) : mineSent ? (
        <p className="flex-none py-3 text-center text-sm text-inksoft">
          Odpowiedziałeś — czekamy na {otherName}…
        </p>
      ) : (
        <form onSubmit={send} className="flex flex-none gap-2 pt-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Twoja odpowiedź…"
            className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-[rgb(var(--on-coral))]"
          >
            Wyślij
          </button>
        </form>
      )}
    </div>
  );
}
