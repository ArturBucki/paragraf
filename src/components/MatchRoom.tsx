"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { GAMES, gameById } from "@/lib/games";
import type { Profile } from "@/lib/types";
import { Avatar, DEFAULT_AVATAR } from "@/components/Avatar";
import { riddleForMatch } from "@/lib/riddles";
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

// Gry z gotową rozgrywką. Reszta czeka na kolejną iterację.
const PLAYABLE = new Set(["riddle", "ttt", "draw"]);

// Pseudo-gra: zgoda na losowanie. Trzymana w tej samej tabeli co zwykłe gry.
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
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<"gry" | "rozmowa">("gry");
  const channelRef = useRef<RealtimeChannel | null>(null);

  const otherName = other?.name ?? "Twój match";
  const playedAny = rows.some((r) => r.played);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  // Jeden kanał na parę: zmiany w bazie + ruchy w grze na żywo.
  useEffect(() => {
    const ch = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_games", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as MatchGame;
          if (!row?.game_id) return;
          setRows((prev) => {
            const rest = prev.filter((r) => r.game_id !== row.game_id);
            return [...rest, row];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
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
        if (payload?.gameId) setActive(payload.gameId as string);
      })
      .subscribe();

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [supabase, matchId]);

  const rowFor = (id: string) => rows.find((r) => r.game_id === id);

  // Losuje spośród gier dostępnych dla tej pary i startuje ją u obojga.
  function drawRandom() {
    const pool = GAMES.filter(
      (g) => PLAYABLE.has(g.id) && points >= g.unlock && !rowFor(g.id)?.played,
    );
    const source = pool.length
      ? pool
      : GAMES.filter((g) => PLAYABLE.has(g.id) && points >= g.unlock);
    if (!source.length) {
      flash("Nie ma jeszcze z czego losować — zagrajcie w coś ręcznie.");
      return;
    }
    const pick = source[Math.floor(Math.random() * source.length)];
    flash(`🎲 Wylosowano: ${pick.name}`);
    startGame(pick.id);
  }

  async function onToggle(gameId: string) {
    if (gameId === RANDOM_ID) {
      const res = await toggleWantGame(matchId, gameId);
      if (!res.ok) flash(res.error);
      return;
    }
    const g = gameById(gameId);
    if (!g) return;
    if (points < g.unlock) {
      flash(`🔒 „${g.name}" odblokujecie przy ${g.unlock} pkt.`);
      return;
    }
    if (!PLAYABLE.has(gameId)) {
      flash(`„${g.name}" dodamy wkrótce — na razie zagrajcie w coś innego.`);
      return;
    }
    const res = await toggleWantGame(matchId, gameId);
    if (!res.ok) flash(res.error);
  }

  function startGame(gameId: string) {
    setActive(gameId);
    channelRef.current?.send({
      type: "broadcast",
      event: "start",
      payload: { gameId },
    });
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
    setTab("rozmowa");
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-line pb-3">
        <Link href="/matches" className="text-lg text-inksoft" aria-label="Wróć">
          ‹
        </Link>
        <div className="h-10 w-10 overflow-hidden rounded-full">
          <Avatar spec={other?.avatar ?? DEFAULT_AVATAR} className="h-full w-full" />
        </div>
        <div className="flex-1">
          <div className="font-bold leading-tight">{otherName}</div>
          <div className="text-xs text-inksoft">
            {playedAny ? "rozmowa otwarta" : "zagrajcie, żeby otworzyć rozmowę"}
          </div>
        </div>
        <span className="rounded-full bg-gold/15 px-3 py-1 font-mono text-xs font-bold text-gold">
          ✨ {points}
        </span>
      </header>

      <nav className="mt-3 flex gap-2">
        {(["gry", "rozmowa"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold capitalize transition ${
              tab === t
                ? "bg-coral text-[#06281A]"
                : "border border-line bg-surface text-inksoft"
            }`}
          >
            {t === "gry" ? "Gry" : "Rozmowa"}
          </button>
        ))}
      </nav>

      {tab === "gry" ? (
        <section className="mt-4 flex flex-col gap-2 pb-24">
          <div>
            <h1 className="font-display text-xl font-extrabold">Wybierzcie grę — razem</h1>
            <p className="text-sm text-inksoft">
              Gra startuje, gdy oboje zaznaczycie to samo. Punkty odblokowują głębsze gry.
            </p>
          </div>

          {/* Losowanie — dla par, którym nie chce się wybierać. Też wymaga zgody obojga. */}
          {(() => {
            const row = rowFor(RANDOM_ID);
            const iWant = isA ? !!row?.a_wants : !!row?.b_wants;
            const theyWant = isA ? !!row?.b_wants : !!row?.a_wants;
            const both = iWant && theyWant;
            return (
              <div
                className={`mb-1 flex items-center gap-3 rounded-2xl border p-3 transition ${
                  both
                    ? "border-[#8FE3C2] bg-[#8FE3C2]/12"
                    : "border-dashed border-line bg-surface"
                }`}
              >
                <span className="text-2xl">🎲</span>
                <button onClick={() => onToggle(RANDOM_ID)} className="flex-1 text-left">
                  <div className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                    Nie chce się wybierać?
                  </div>
                  <div className="font-bold leading-tight">Wylosujcie grę</div>
                  <div className="text-xs text-inksoft">
                    Apka wybierze coś z dostępnych — bez zastanawiania się.
                  </div>
                </button>
                <div className="flex w-28 flex-col items-end gap-1">
                  {both ? (
                    <button
                      onClick={drawRandom}
                      className="rounded-full bg-[#8FE3C2] px-3 py-1.5 text-xs font-bold text-[#06281A]"
                    >
                      🎲 Losujcie
                    </button>
                  ) : (
                    <>
                      {theyWant && (
                        <span className="rounded-full bg-berry/15 px-2 py-1 text-[11px] font-bold text-berry">
                          {otherName} chce
                        </span>
                      )}
                      {iWant && (
                        <span className="rounded-full bg-coral/15 px-2 py-1 text-[11px] font-bold text-coraldeep">
                          Ty ✓ czekasz
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {GAMES.map((g) => {
            const row = rowFor(g.id);
            const iWant = isA ? !!row?.a_wants : !!row?.b_wants;
            const theyWant = isA ? !!row?.b_wants : !!row?.a_wants;
            const both = iWant && theyWant;
            const locked = points < g.unlock;
            const soon = !PLAYABLE.has(g.id);

            return (
              <div
                key={g.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
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
                  className="flex-1 text-left"
                  disabled={locked}
                >
                  <div className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                    {g.tag} · ✨ +{g.pts}
                  </div>
                  <div className="font-bold leading-tight">{g.name}</div>
                  <div className="text-xs text-inksoft">{g.desc}</div>
                </button>

                <div className="flex w-28 flex-col items-end gap-1">
                  {locked ? (
                    <span className="rounded-full bg-line px-2 py-1 text-[11px] text-inksoft">
                      🔒 od {g.unlock} pkt
                    </span>
                  ) : both ? (
                    <button
                      onClick={() => startGame(g.id)}
                      className="rounded-full bg-[#8FE3C2] px-3 py-1.5 text-xs font-bold text-[#06281A]"
                    >
                      ▶ Zagrajcie
                    </button>
                  ) : (
                    <>
                      {theyWant && (
                        <span className="rounded-full bg-berry/15 px-2 py-1 text-[11px] font-bold text-berry">
                          {otherName} chce
                        </span>
                      )}
                      {iWant && (
                        <span className="rounded-full bg-coral/15 px-2 py-1 text-[11px] font-bold text-coraldeep">
                          Ty ✓ czekasz
                        </span>
                      )}
                      {soon && !iWant && !theyWant && (
                        <span className="text-[11px] text-inksoft">wkrótce</span>
                      )}
                    </>
                  )}
                  {row?.played && !both && (
                    <span className="text-[11px] text-inksoft">zagrane ✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <Chat
          matchId={matchId}
          meId={meId}
          messages={messages}
          otherName={otherName}
          locked={!playedAny}
          onGoToGames={() => setTab("gry")}
        />
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-6 mx-auto w-[92%] max-w-sm rounded-2xl bg-ink px-4 py-3 text-center text-sm font-semibold text-bg shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- CZAT --------------------------------- */

function Chat({
  matchId,
  meId,
  messages,
  otherName,
  locked,
  onGoToGames,
}: {
  matchId: string;
  meId: string;
  messages: Message[];
  otherName: string;
  locked: boolean;
  onGoToGames: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (locked) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-coral/5 p-8 text-center">
        <span className="text-2xl">🔒</span>
        <p className="font-bold">Rozmowa jeszcze zamknięta</p>
        <p className="max-w-xs text-sm text-inksoft">
          Zamiast pustego „hej” — zagrajcie razem jedną grę. Wtedy czat się otworzy.
        </p>
        <button
          onClick={onGoToGames}
          className="mt-1 rounded-xl bg-coral px-5 py-2.5 font-bold text-[#06281A]"
        >
          Wybierzcie grę
        </button>
      </div>
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
    <section className="mt-4 flex flex-1 flex-col pb-4">
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pb-4">
        {messages.map((m) => {
          const system = m.body.startsWith("__system__");
          if (system) {
            return (
              <div
                key={m.id}
                className="mx-auto rounded-full bg-line px-3 py-1 text-center text-xs text-inksoft"
              >
                {m.body.replace("__system__", "")}
              </div>
            );
          }
          const mine = m.sender === meId;
          return (
            <div
              key={m.id}
              className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                mine
                  ? "self-end bg-coral text-[#06281A]"
                  : "self-start border border-line bg-surface"
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

      <form onSubmit={submit} className="flex gap-2 border-t border-line pt-3">
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
          className="h-11 w-11 rounded-full bg-coral text-[#06281A] disabled:opacity-50"
        >
          ➤
        </button>
      </form>
    </section>
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
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-line pb-3">
        <button onClick={props.onExit} className="text-lg text-inksoft" aria-label="Wróć">
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
    const handler = ({ payload }: { payload: { answer?: string } }) => {
      if (payload?.answer === riddle.answer) setSolved(true);
    };
    channel.on("broadcast", { event: "riddle" }, handler);
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
    <div className="flex flex-1 flex-col gap-4 py-4">
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
              className={`rounded-2xl border border-line bg-surface p-4 font-semibold transition ${
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
    const handler = ({ payload }: { payload: { i?: number; sym?: string } }) => {
      if (typeof payload?.i !== "number" || !payload.sym) return;
      setCells((prev) => {
        if (prev[payload.i!]) return prev;
        const next = [...prev];
        next[payload.i!] = payload.sym!;
        return next;
      });
      setMyTurn(true);
    };
    channel.on("broadcast", { event: "ttt" }, handler);
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
            className="grid aspect-square place-items-center rounded-2xl border border-line bg-surface text-3xl font-extrabold disabled:cursor-default"
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
  const myColor = isA ? "#E2543F" : "#7A459C";

  const stroke = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }, color: string) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
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
    const handler = ({ payload }: { payload: any }) => {
      if (payload?.from && payload?.to) stroke(payload.from, payload.to, payload.color);
    };
    channel.on("broadcast", { event: "draw" }, handler);
  }, [channel, stroke]);

  const last = useRef<{ x: number; y: number } | null>(null);

  function pos(e: React.PointerEvent) {
    const cv = canvasRef.current!;
    const r = cv.getBoundingClientRect();
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
        className="min-h-[320px] flex-1 touch-none rounded-2xl border border-line bg-white"
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
