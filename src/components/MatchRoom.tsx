"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { GAMES, gameById } from "@/lib/games";
import type { Profile } from "@/lib/types";
import { Avatar, DEFAULT_AVATAR } from "@/components/Avatar";
import { usePresence } from "@/lib/usePresence";
import { Icon } from "@/components/Icon";
import { GameWheel } from "@/components/GameWheel";
import { Riddle } from "@/components/games/Riddle";
import { TicTacToe } from "@/components/games/TicTacToe";
import { Charades } from "@/components/games/Charades";
import { Truths } from "@/components/games/Truths";
import { Questions36 } from "@/components/games/Questions36";
import { EscapeRoom } from "@/components/games/EscapeRoom";
import { toggleWantGame, finishGame, sendMessage } from "@/app/matches/[id]/actions";

type MatchGame = {
  game_id: string;
  a_wants: boolean;
  b_wants: boolean;
  played: boolean;
};

type Message = {
  id: number;
  sender: string;
  body: string;
  created_at: string;
};

const PLAYABLE = new Set(["riddle", "ttt", "draw", "truths", "q36", "escape"]);
const RANDOM_ID = "__random__";

export function MatchRoom({
  matchId,
  meId,
  isA,
  other,
  initialPoints,
  initialGames,
  initialMessages,
}: {
  matchId: string;
  meId: string;
  isA: boolean;
  other: Profile | null;
  initialPoints: number;
  initialGames: MatchGame[];
  initialMessages: Message[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [points, setPoints] = useState(initialPoints);
  const [rows, setRows] = useState<MatchGame[]>(initialGames);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [active, setActive] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const otherName = other?.name ?? "Twój match";
  const playedAny = rows.some((r) => r.played);
  const online = usePresence(meId);
  const otherOnline = other ? online.has(other.id) : false;

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const rowFor = useCallback(
    (id: string) => rows.find((r) => r.game_id === id),
    [rows],
  );

  useEffect(() => {
    const ch = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_games", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as MatchGame;
          if (!row?.game_id) return;
          setRows((prev) => [...prev.filter((r) => r.game_id !== row.game_id), row]);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        (payload) => {
          const m = payload.new as { points: number };
          if (typeof m.points === "number") setPoints(m.points);
        },
      )
      .on("broadcast", { event: "start" }, ({ payload }) => {
        if (payload?.gameId) {
          setSheet(false);
          setActive(payload.gameId as string);
        }
      })
      .subscribe();

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [supabase, matchId]);

  function optimisticToggle(gameId: string) {
    setRows((prev) => {
      const row = prev.find((r) => r.game_id === gameId) ?? {
        game_id: gameId,
        a_wants: false,
        b_wants: false,
        played: false,
      };
      const nextRow = isA
        ? { ...row, a_wants: !row.a_wants }
        : { ...row, b_wants: !row.b_wants };
      return [...prev.filter((r) => r.game_id !== gameId), nextRow];
    });
  }

  async function onToggle(gameId: string) {
    if (gameId !== RANDOM_ID) {
      const g = gameById(gameId);
      if (!g) return;
      if (points < g.unlock) {
        flash(`Zablokowane — „${g.name}" odblokujecie przy ${g.unlock} pkt.`);
        return;
      }
      if (!PLAYABLE.has(gameId)) {
        flash(`„${g.name}" dodamy wkrótce — wybierzcie coś innego.`);
        return;
      }
    }
    optimisticToggle(gameId);
    const res = await toggleWantGame(matchId, gameId);
    if (!res.ok) {
      optimisticToggle(gameId);
      flash(res.error);
    }
  }

  function startGame(gameId: string) {
    setSheet(false);
    setActive(gameId);
    channelRef.current?.send({ type: "broadcast", event: "start", payload: { gameId } });
  }

  function drawRandom() {
    const pool = GAMES.filter(
      (g) => PLAYABLE.has(g.id) && points >= g.unlock && !rowFor(g.id)?.played,
    );
    const source = pool.length
      ? pool
      : GAMES.filter((g) => PLAYABLE.has(g.id) && points >= g.unlock);
    if (!source.length) {
      flash("Nie ma jeszcze z czego losować.");
      return;
    }
    const pick = source[Math.floor(Math.random() * source.length)];
    flash(`Wylosowano: ${pick.name}`);
    startGame(pick.id);
  }

  async function onFinish(gameId: string) {
    const res = await finishGame(matchId, gameId);
    setActive(null);
    if (res.awarded > 0) {
      setPoints(res.points);
      flash(
        `+${res.awarded} pkt połączenia` +
          (res.unlocked.length ? ` · Odblokowano: ${res.unlocked.join(", ")}` : ""),
      );
    }
  }

  if (active) {
    return (
      <GameScreen
        gameId={active}
        matchId={matchId}
        isA={isA}
        otherName={otherName}
        channel={channelRef.current}
        onExit={() => setActive(null)}
        onFinish={() => onFinish(active)}
      />
    );
  }

  const ready = GAMES.find((g) => {
    const r = rowFor(g.id);
    return !!r?.a_wants && !!r?.b_wants;
  });
  const invited = GAMES.find((g) => {
    const r = rowFor(g.id);
    return isA ? r?.b_wants && !r?.a_wants : r?.a_wants && !r?.b_wants;
  });

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* nagłówek */}
      <header className="flex flex-none items-center gap-3 border-b border-line pb-3">
        <Link href="/matches" className="text-inksoft" aria-label="Wróć">
          <Icon name="back" className="h-6 w-6" />
        </Link>
        <div className="relative h-11 w-11 shrink-0">
          <div className="h-full w-full overflow-hidden rounded-full">
            <Avatar spec={other?.avatar ?? DEFAULT_AVATAR} className="h-full w-full" />
          </div>
          {otherOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bg bg-[#8FE3C2]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold leading-tight">{otherName}</div>
          <div className="text-xs text-inksoft">
            {otherOnline ? (
              <span className="font-semibold text-berry">jest teraz online</span>
            ) : (
              "offline — zaproszenie poczeka"
            )}
          </div>
        </div>
        <span className="rounded-full bg-gold/15 px-3 py-1 font-mono text-xs font-bold text-gold">
          <Icon name="spark" className="inline h-3 w-3 align-[-1px]" /> {points}
        </span>
      </header>

      {/* rozmowa */}
      <Stream
        messages={messages}
        meId={meId}
        otherName={otherName}
        locked={!playedAny}
        onOpenGames={() => setSheet(true)}
        onRandom={drawRandom}
      />

      {/* gotowa gra + pole wiadomości */}
      <div className="flex-none pt-1">
        {ready && (
          <button
            onClick={() => startGame(ready.id)}
            className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-[#8FE3C2] bg-[#8FE3C2]/12 px-3 py-2.5 text-left transition active:scale-[0.99]"
          >
            <Icon name={ready.icon} className="h-5 w-5 flex-none text-berry" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-tight">{ready.name}</span>
              <span className="block text-[11px] text-inksoft">
                oboje chcecie — możecie zaczynać
              </span>
            </span>
            <span className="flex-none rounded-full bg-[#8FE3C2] px-3 py-1.5 text-xs font-bold text-[#06281A]">
              Start
            </span>
          </button>
        )}

        {!ready && invited && (
          <button
            onClick={() => onToggle(invited.id)}
            className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-berry/50 bg-berry/10 px-3 py-2.5 text-left transition active:scale-[0.99]"
          >
            <Icon name={invited.icon} className="h-5 w-5 flex-none text-berry" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-tight">{invited.name}</span>
              <span className="block text-[11px] text-inksoft">
                {otherName} czeka na Twoją zgodę
              </span>
            </span>
            <span className="flex-none rounded-full border border-berry px-3 py-1.5 text-xs font-bold text-berry">
              Wchodzę
            </span>
          </button>
        )}

        <Composer
          matchId={matchId}
          locked={!playedAny}
          onOpenGames={() => setSheet(true)}
        />
      </div>

      {sheet && (
        <GameSheet
          points={points}
          isA={isA}
          rows={rows}
          otherName={otherName}
          channel={channelRef.current}
          onClose={() => setSheet(false)}
          onToggle={onToggle}
          onStart={startGame}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto w-[92%] max-w-sm rounded-2xl bg-[#06281A] px-4 py-3 text-center text-sm font-semibold text-[#F2EFE4] shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- ROZMOWA -------------------------------- */

function Stream({
  messages,
  meId,
  otherName,
  locked,
  onOpenGames,
  onRandom,
}: {
  messages: Message[];
  meId: string;
  otherName: string;
  locked: boolean;
  onOpenGames: () => void;
  onRandom: () => void;
}) {
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (locked) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface text-3xl">
          <Icon name="gamepad" className="h-8 w-8 text-coral" />
        </div>
        <div>
          <p className="font-display text-xl font-extrabold">Zacznijcie od gry</p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-inksoft">
            Rozmowa otworzy się, gdy zagracie razem — zamiast pustego „hej” będziecie
            mieć o czym gadać.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRandom}
            className="rounded-xl bg-coral px-5 py-3 font-bold text-[#06281A]"
          >
            <span className="flex items-center gap-2"><Icon name="dice" className="h-5 w-5" /> Wylosuj grę</span>
          </button>
          <button
            onClick={onOpenGames}
            className="rounded-xl border border-line bg-surface px-5 py-3 font-bold"
          >
            Wybierz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-4">
      {messages.map((m) => {
        if (m.body.startsWith("__system__")) {
          return (
            <div
              key={m.id}
              className="mx-auto rounded-full border border-line bg-surface px-3 py-1 text-center text-[11px] font-semibold text-gold"
            >
              {m.body.replace("__system__", "")}
            </div>
          );
        }
        const mine = m.sender === meId;
        return (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug ${
              mine
                ? "self-end rounded-br-md bg-coral text-[#06281A]"
                : "self-start rounded-bl-md border border-line bg-surface"
            }`}
          >
            {!mine && (
              <div className="mb-0.5 font-mono text-[10px] font-bold text-berry">
                {otherName}
              </div>
            )}
            {m.body}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

function Composer({
  matchId,
  locked,
  onOpenGames,
}: {
  matchId: string;
  locked: boolean;
  onOpenGames: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  if (locked) {
    return (
      <button
        onClick={onOpenGames}
        className="mb-2 flex w-full items-center gap-2 rounded-full border border-dashed border-line bg-surface px-4 py-3 text-sm text-inksoft"
      >
        <Icon name="lock" className="h-4 w-4" /> Rozmowa otworzy się po pierwszej wspólnej grze
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    const res = await sendMessage(matchId, body);
    if (!res.ok) setText(body);
    setSending(false);
  }

  return (
    <form onSubmit={submit} className="mb-2 flex items-center gap-2">
      <button
        type="button"
        onClick={onOpenGames}
        aria-label="Gry"
        className="grid h-11 w-11 flex-none place-items-center rounded-full border border-line bg-surface text-inksoft transition active:scale-95"
      >
        <Icon name="gamepad" className="h-5 w-5" />
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Napisz coś…"
        className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm"
      />
      <button
        type="submit"
        disabled={sending}
        aria-label="Wyślij"
        className="grid h-11 w-11 flex-none place-items-center rounded-full bg-coral text-[#06281A] disabled:opacity-50"
      >
        <Icon name="send" className="h-5 w-5" filled />
      </button>
    </form>
  );
}

/* ------------------------------ WYBÓR GIER ------------------------------- */

function GameSheet({
  points,
  isA,
  rows,
  otherName,
  channel,
  onClose,
  onToggle,
  onStart,
}: {
  points: number;
  isA: boolean;
  rows: MatchGame[];
  otherName: string;
  channel: RealtimeChannel | null;
  onClose: () => void;
  onToggle: (id: string) => void;
  onStart: (id: string) => void;
}) {
  const available = GAMES.filter((g) => PLAYABLE.has(g.id) && points >= g.unlock);
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border-t border-line bg-bg p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-extrabold">Wybierzcie grę</h2>
          <span className="flex items-center gap-1 font-mono text-xs text-gold"><Icon name="spark" className="h-3.5 w-3.5" /> {points} pkt</span>
        </div>
        <p className="mb-4 text-sm text-inksoft">
          Gra startuje, gdy oboje zaznaczycie to samo.
        </p>

        <div className="mb-5 rounded-3xl border border-line bg-surface/60 px-4 py-5">
          <GameWheel games={available} channel={channel} onResult={onStart} />
        </div>

        <div className="mb-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-inksoft">
            albo wybierzcie sami
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="flex flex-col gap-2">
          {GAMES.map((g) => {
            const row = rows.find((r) => r.game_id === g.id);
            const iWant = isA ? !!row?.a_wants : !!row?.b_wants;
            const theyWant = isA ? !!row?.b_wants : !!row?.a_wants;
            const both = iWant && theyWant;
            const locked = points < g.unlock;
            const soon = !PLAYABLE.has(g.id);

            return (
              <div
                key={g.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${
                  both
                    ? "border-[#8FE3C2] bg-[#8FE3C2]/12"
                    : locked
                      ? "border-dashed border-line opacity-60"
                      : "border-line bg-surface"
                }`}
              >
                <Icon name={g.icon} className="h-7 w-7 flex-none text-inksoft" />
                <button
                  onClick={() => onToggle(g.id)}
                  disabled={locked}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                    {g.tag} · +{g.pts} pkt
                  </div>
                  <div className="font-bold leading-tight">{g.name}</div>
                  <div className="text-xs text-inksoft">{g.desc}</div>
                </button>
                <div className="flex w-24 flex-none flex-col items-end gap-1">
                  {locked ? (
                    <span className="rounded-full bg-line/40 px-2 py-1 text-[11px] text-inksoft">
                      <Icon name="lock" className="inline h-3 w-3 align-[-1px]" /> {g.unlock} pkt
                    </span>
                  ) : both ? (
                    <button
                      onClick={() => onStart(g.id)}
                      className="rounded-full bg-[#8FE3C2] px-3 py-1.5 text-xs font-bold text-[#06281A]"
                    >
                      ▶ Start
                    </button>
                  ) : (
                    <>
                      {theyWant && (
                        <span className="rounded-full bg-berry/15 px-2 py-1 text-center text-[10px] font-bold leading-tight text-berry">
                          {otherName} chce
                        </span>
                      )}
                      {iWant && (
                        <span className="rounded-full bg-coral/15 px-2 py-1 text-[10px] font-bold text-coraldeep">
                          Ty ✓
                        </span>
                      )}
                      {soon && !iWant && !theyWant && (
                        <span className="text-[10px] text-inksoft">wkrótce</span>
                      )}
                    </>
                  )}
                  {row?.played && !both && (
                    <span className="text-[10px] text-inksoft">zagrane ✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- GRY ---------------------------------- */

function GameScreen(props: {
  gameId: string;
  matchId: string;
  isA: boolean;
  otherName: string;
  channel: RealtimeChannel | null;
  onExit: () => void;
  onFinish: () => void;
}) {
  const g = gameById(props.gameId);
  const shared = {
    matchId: props.matchId,
    isA: props.isA,
    otherName: props.otherName,
    channel: props.channel,
    onFinish: props.onFinish,
  };

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="flex flex-none items-center gap-3 border-b border-line pb-3">
        <button onClick={props.onExit} className="text-inksoft" aria-label="Wróć">
          <Icon name="back" className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2.5">
          {g && <Icon name={g.icon} className="h-6 w-6 text-coral" />}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wide text-berry">
              {g?.tag}
            </div>
            <h2 className="font-display text-lg font-extrabold leading-tight">
              {g?.name}
            </h2>
          </div>
        </div>
      </header>

      {props.gameId === "riddle" && <Riddle {...shared} />}
      {props.gameId === "ttt" && <TicTacToe {...shared} />}
      {props.gameId === "draw" && <Charades {...shared} />}
      {props.gameId === "truths" && <Truths {...shared} />}
      {props.gameId === "q36" && <Questions36 {...shared} />}
      {props.gameId === "escape" && <EscapeRoom {...shared} />}
    </div>
  );
}
