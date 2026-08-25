"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { GAMES, gameById } from "@/lib/games";
import type { Profile } from "@/lib/types";
import { Avatar, DEFAULT_AVATAR } from "@/components/Avatar";
import { riddleForMatch } from "@/lib/riddles";
import { usePresence } from "@/lib/usePresence";
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

const PLAYABLE = new Set(["riddle", "ttt", "draw"]);
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
        flash(`🔒 „${g.name}" odblokujecie przy ${g.unlock} pkt.`);
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
    flash(`🎲 Wylosowano: ${pick.name}`);
    startGame(pick.id);
  }

  async function onFinish(gameId: string) {
    const res = await finishGame(matchId, gameId);
    setActive(null);
    if (res.awarded > 0) {
      setPoints(res.points);
      flash(
        `+${res.awarded} pkt połączenia` +
          (res.unlocked.length ? ` · Odblokowano: ${res.unlocked.join(", ")} 🔓` : ""),
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

  const randomRow = rowFor(RANDOM_ID);
  const randomBoth = !!randomRow?.a_wants && !!randomRow?.b_wants;

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* nagłówek */}
      <header className="flex flex-none items-center gap-3 border-b border-line pb-3">
        <Link href="/matches" className="text-xl text-inksoft" aria-label="Wróć">
          ‹
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
          ✨ {points}
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

      {/* pasek gier + pole wiadomości */}
      <div className="flex-none border-t border-line pt-2">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={drawRandom}
            className={`flex-none rounded-full px-3 py-1.5 text-xs font-bold transition ${
              randomBoth
                ? "bg-[#8FE3C2] text-[#06281A]"
                : "border border-line bg-surface text-ink"
            }`}
          >
            🎲 Losuj grę
          </button>
          <button
            onClick={() => setSheet(true)}
            className="flex-none rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-bold"
          >
            🎮 Wybierz grę
          </button>
          {GAMES.filter((g) => PLAYABLE.has(g.id) && points >= g.unlock)
            .slice(0, 3)
            .map((g) => {
              const row = rowFor(g.id);
              const iWant = isA ? !!row?.a_wants : !!row?.b_wants;
              const theyWant = isA ? !!row?.b_wants : !!row?.a_wants;
              const both = iWant && theyWant;
              return (
                <button
                  key={g.id}
                  onClick={() => (both ? startGame(g.id) : onToggle(g.id))}
                  className={`flex-none rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    both
                      ? "bg-[#8FE3C2] text-[#06281A]"
                      : iWant
                        ? "border border-coral bg-coral/15 text-coraldeep"
                        : theyWant
                          ? "border border-berry bg-berry/15 text-berry"
                          : "border border-line bg-surface text-inksoft"
                  }`}
                >
                  {g.icon} {both ? "Zagrajcie!" : g.name}
                </button>
              );
            })}
        </div>

        <Composer matchId={matchId} locked={!playedAny} onOpenGames={() => setSheet(true)} />
      </div>

      {sheet && (
        <GameSheet
          points={points}
          isA={isA}
          rows={rows}
          otherName={otherName}
          onClose={() => setSheet(false)}
          onToggle={onToggle}
          onStart={startGame}
          onRandom={drawRandom}
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
          🎮
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
            🎲 Wylosuj grę
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
        🔒 Rozmowa otworzy się po pierwszej wspólnej grze
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
    <form onSubmit={submit} className="mb-2 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Napisz coś…"
        className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm"
      />
      <button
        type="submit"
        disabled={sending}
        aria-label="Wyślij"
        className="h-11 w-11 flex-none rounded-full bg-coral text-[#06281A] disabled:opacity-50"
      >
        ➤
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
  onClose,
  onToggle,
  onStart,
  onRandom,
}: {
  points: number;
  isA: boolean;
  rows: MatchGame[];
  otherName: string;
  onClose: () => void;
  onToggle: (id: string) => void;
  onStart: (id: string) => void;
  onRandom: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border-t border-line bg-bg p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-extrabold">Wybierzcie grę</h2>
          <span className="font-mono text-xs text-gold">✨ {points} pkt</span>
        </div>
        <p className="mb-4 text-sm text-inksoft">
          Gra startuje, gdy oboje zaznaczycie to samo.
        </p>

        <button
          onClick={onRandom}
          className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-line bg-surface p-3 text-left"
        >
          <span className="text-2xl">🎲</span>
          <span className="flex-1">
            <span className="block font-bold">Wylosujcie grę</span>
            <span className="block text-xs text-inksoft">
              Apka wybierze coś z dostępnych
            </span>
          </span>
          <span className="rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-[#06281A]">
            Losuj
          </span>
        </button>

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
                <span className="text-2xl">{g.icon}</span>
                <button
                  onClick={() => onToggle(g.id)}
                  disabled={locked}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                    {g.tag} · ✨ +{g.pts}
                  </div>
                  <div className="font-bold leading-tight">{g.name}</div>
                  <div className="text-xs text-inksoft">{g.desc}</div>
                </button>
                <div className="flex w-24 flex-none flex-col items-end gap-1">
                  {locked ? (
                    <span className="rounded-full bg-line/40 px-2 py-1 text-[11px] text-inksoft">
                      🔒 {g.unlock} pkt
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
  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="flex flex-none items-center gap-3 border-b border-line pb-3">
        <button onClick={props.onExit} className="text-xl text-inksoft" aria-label="Wróć">
          ‹
        </button>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-berry">
            {g?.tag}
          </div>
          <h2 className="font-display text-lg font-extrabold leading-tight">{g?.name}</h2>
        </div>
      </header>

      {props.gameId === "riddle" && <RiddleGame {...props} />}
      {props.gameId === "ttt" && <TicTacToe {...props} />}
      {props.gameId === "draw" && <DrawTogether {...props} />}
    </div>
  );
}

function RiddleGame({
  matchId,
  isA,
  otherName,
  channel,
  onFinish,
}: {
  matchId: string;
  isA: boolean;
  otherName: string;
  channel: RealtimeChannel | null;
  onFinish: () => void;
}) {
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
        <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-[#8FE3C2] bg-[#8FE3C2]/12 p-6 text-center">
          <div className="text-3xl">🎉</div>
          <p className="font-display text-lg font-extrabold">Rozwiązane razem!</p>
          <p className="text-sm text-inksoft">
            Bez wskazówek drugiej osoby by się nie udało.
          </p>
          <button
            onClick={onFinish}
            className="mt-1 rounded-xl bg-coral px-6 py-3 font-bold text-[#06281A]"
          >
            Odbierzcie punkty
          </button>
        </div>
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

function TicTacToe({
  isA,
  otherName,
  channel,
  onFinish,
}: {
  isA: boolean;
  otherName: string;
  channel: RealtimeChannel | null;
  onFinish: () => void;
}) {
  const mySym = isA ? "♥" : "✕";
  const theirSym = isA ? "✕" : "♥";
  const [cells, setCells] = useState<(string | null)[]>(Array(9).fill(null));
  const [myTurn, setMyTurn] = useState(isA);

  const WINS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  const winner = WINS.map((w) =>
    cells[w[0]] && cells[w[0]] === cells[w[1]] && cells[w[1]] === cells[w[2]]
      ? cells[w[0]]
      : null,
  ).find(Boolean);
  const full = cells.every(Boolean);
  const over = Boolean(winner) || full;

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "ttt" }, ({ payload }) => {
      if (typeof payload?.i !== "number" || !payload.sym) return;
      setCells((prev) => {
        if (prev[payload.i]) return prev;
        const next = [...prev];
        next[payload.i] = payload.sym;
        return next;
      });
      setMyTurn(true);
    });
  }, [channel]);

  function play(i: number) {
    if (cells[i] || !myTurn || over) return;
    setCells((prev) => {
      const next = [...prev];
      next[i] = mySym;
      return next;
    });
    setMyTurn(false);
    channel?.send({ type: "broadcast", event: "ttt", payload: { i, sym: mySym } });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6">
      <p className="text-sm font-semibold text-inksoft">
        {over
          ? winner === mySym
            ? "Wygrałeś! 🎉"
            : winner
              ? `${otherName} wygrywa 😄`
              : "Remis 🤝"
          : myTurn
            ? `Twój ruch — grasz ${mySym}`
            : `Ruch: ${otherName} (${theirSym})`}
      </p>

      <div className="grid w-64 grid-cols-3 gap-2">
        {cells.map((c, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            disabled={Boolean(c) || !myTurn || over}
            className="grid aspect-square place-items-center rounded-2xl border border-line bg-surface text-3xl font-extrabold transition active:scale-95 disabled:cursor-default"
          >
            <span className={c === mySym ? "text-coral" : "text-berry"}>{c}</span>
          </button>
        ))}
      </div>

      {over && (
        <button
          onClick={onFinish}
          className="rounded-xl bg-coral px-6 py-3 font-bold text-[#06281A]"
        >
          Odbierzcie punkty
        </button>
      )}
    </div>
  );
}

function DrawTogether({
  isA,
  otherName,
  channel,
  onFinish,
}: {
  isA: boolean;
  otherName: string;
  channel: RealtimeChannel | null;
  onFinish: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const myColor = isA ? "#FF6B4A" : "#8FE3C2";

  const stroke = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }, color: string) => {
      const cv = canvasRef.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
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
    channel.on("broadcast", { event: "draw" }, ({ payload }) => {
      if (payload?.from && payload?.to) stroke(payload.from, payload.to, payload.color);
    });
  }, [channel, stroke]);

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  return (
    <div className="flex flex-1 flex-col gap-3 py-4">
      <p className="text-sm text-inksoft">
        Jedno płótno, dwie pary rąk — {otherName} rysuje razem z Tobą, na żywo.
      </p>
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          drawing.current = true;
          last.current = pos(e);
        }}
        onPointerMove={(e) => {
          if (!drawing.current || !last.current) return;
          const p = pos(e);
          stroke(last.current, p, myColor);
          channel?.send({
            type: "broadcast",
            event: "draw",
            payload: { from: last.current, to: p, color: myColor },
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
        className="min-h-[300px] flex-1 touch-none rounded-2xl border border-line bg-[#06281A]"
      />
      <button
        onClick={onFinish}
        className="rounded-xl bg-coral px-6 py-3 font-bold text-[#06281A]"
      >
        Gotowe — odbierzcie punkty
      </button>
    </div>
  );
}
