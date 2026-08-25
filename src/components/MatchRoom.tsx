"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { GAMES, gameById, gameOfTheDay, DAILY_BONUS } from "@/lib/games";
import type { Profile } from "@/lib/types";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { usePresence } from "@/lib/usePresence";
import { Icon } from "@/components/Icon";
import { GamePicker } from "@/components/GamePicker";
import { GameRail } from "@/components/GameRail";
import { GameInvite, GameWaiting, GameReady } from "@/components/GameInvite";
import { Riddle } from "@/components/games/Riddle";
import { TicTacToe } from "@/components/games/TicTacToe";
import { Charades } from "@/components/games/Charades";
import { Truths } from "@/components/games/Truths";
import { Questions36 } from "@/components/games/Questions36";
import { EscapeRoom } from "@/components/games/EscapeRoom";
import {
  toggleWantGame,
  declineGame,
  finishGame,
  sendMessage,
} from "@/app/matches/[id]/actions";

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
  today,
}: {
  matchId: string;
  meId: string;
  isA: boolean;
  other: Profile | null;
  initialPoints: number;
  initialGames: MatchGame[];
  initialMessages: Message[];
  /** Data z serwera — żeby „gra dnia" była identyczna u obojga. */
  today: string;
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

  // Kanał realtime zakładamy raz — te referencje pozwalają mu sięgać
  // po aktualne dane bez ponownej subskrypcji przy każdym renderze.
  const flashRef = useRef(flash);
  flashRef.current = flash;
  const otherNameRef = useRef(otherName);
  otherNameRef.current = otherName;

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
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            // Usuń wersję optymistyczną (ujemne id), gdy dotrze prawdziwa.
            const withoutTemp = prev.filter(
              (x) => !(x.id < 0 && x.sender === m.sender && x.body === m.body),
            );
            return [...withoutTemp, m];
          });
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
      .on("broadcast", { event: "decline" }, ({ payload }) => {
        const g = payload?.gameId ? gameById(payload.gameId as string) : null;
        if (g) flashRef.current(`${otherNameRef.current} woli teraz nie grać w „${g.name}".`);
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

  /** Przyjmuję zaproszenie: zaznaczam chęć i od razu wchodzimy oboje. */
  function acceptInvite(gameId: string) {
    optimisticToggle(gameId);
    toggleWantGame(matchId, gameId).catch(() => {});
    startGame(gameId);
  }

  /** Odrzucam: kasujemy chęć obojga i mówimy o tym drugiej osobie. */
  function declineInvite(gameId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.game_id === gameId ? { ...r, a_wants: false, b_wants: false } : r,
      ),
    );
    channelRef.current?.send({
      type: "broadcast",
      event: "decline",
      payload: { gameId },
    });
    declineGame(matchId, gameId).catch(() => {});
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

  // Zamykamy grę i pokazujemy punkty OD RAZU — zapis leci w tle.
  // Serwer i tak jest źródłem prawdy: realtime dośle właściwy stan,
  // a przy podwójnym zakończeniu punkty i tak naliczą się raz.
  function onFinish(gameId: string) {
    const g = gameById(gameId);
    const alreadyPlayed = !!rowFor(gameId)?.played;

    setActive(null);

    if (g && !alreadyPlayed) {
      const before = points;
      const isDaily = gameOfTheDay(matchId, today, before).id === gameId;
      const gain = g.pts + (isDaily ? DAILY_BONUS : 0);
      const after = before + gain;
      setPoints(after);
      setRows((prev) => [
        ...prev.filter((r) => r.game_id !== gameId),
        { game_id: gameId, a_wants: false, b_wants: false, played: true },
      ]);
      const unlocked = GAMES.filter(
        (x) => x.unlock > before && x.unlock <= after,
      ).map((x) => x.name);
      flash(
        `+${gain} pkt${isDaily ? " (gra dnia!)" : ""}` +
          (unlocked.length ? ` · Odblokowano: ${unlocked.join(", ")}` : ""),
      );
    }

    finishGame(matchId, gameId)
      .then((res) => {
        // Wyrównanie z serwerem, gdyby druga osoba zdążyła pierwsza.
        if (typeof res.points === "number") setPoints(res.points);
      })
      .catch(() => {});
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

  const stateFor = (id: string) => {
    const r = rowFor(id);
    const g = gameById(id);
    return {
      mine: !!(isA ? r?.a_wants : r?.b_wants),
      theirs: !!(isA ? r?.b_wants : r?.a_wants),
      played: !!r?.played,
      locked: !!g && points < g.unlock,
    };
  };

  const ready = GAMES.find((g) => {
    const r = rowFor(g.id);
    return !!r?.a_wants && !!r?.b_wants;
  });
  const invited = GAMES.find((g) => {
    const r = rowFor(g.id);
    return isA ? r?.b_wants && !r?.a_wants : r?.a_wants && !r?.b_wants;
  });
  const waiting = GAMES.find((g) => {
    const r = rowFor(g.id);
    return isA ? r?.a_wants && !r?.b_wants : r?.b_wants && !r?.a_wants;
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
            <ProfilePhoto profile={other ?? null} />
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

      {/* rozmowa + pasek gier tuż obok */}
      <div className="flex min-h-0 flex-1 gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <Stream
            messages={messages}
            meId={meId}
            otherName={otherName}
            locked={!playedAny}
            onOpenGames={() => setSheet(true)}
            onRandom={drawRandom}
          />

          {/* kto chce grać — zaproszenie, oczekiwanie albo gotowy start */}
          <div className="flex-none pt-1">
            {ready ? (
              <GameReady
                game={ready}
                otherName={otherName}
                onStart={() => startGame(ready.id)}
              />
            ) : invited ? (
              <GameInvite
                game={invited}
                otherName={otherName}
                onAccept={() => acceptInvite(invited.id)}
                onDecline={() => declineInvite(invited.id)}
              />
            ) : waiting ? (
              <GameWaiting
                game={waiting}
                otherName={otherName}
                otherOnline={otherOnline}
                onCancel={() => onToggle(waiting.id)}
              />
            ) : null}

            <Composer
              matchId={matchId}
              locked={!playedAny}
              onOpenGames={() => setSheet(true)}
              onOptimistic={(body) =>
                setMessages((prev) => [
                  ...prev,
                  { id: -Date.now(), sender: meId, body, created_at: "" },
                ])
              }
              onFailed={(body) =>
                setMessages((prev) =>
                  prev.filter((m) => !(m.id < 0 && m.body === body)),
                )
              }
            />
          </div>
        </div>

        <GameRail
          dailyId={gameOfTheDay(matchId, today, points).id}
          stateFor={stateFor}
          onPick={onToggle}
          onOpenAll={() => setSheet(true)}
          onRandom={drawRandom}
        />
      </div>

      {sheet && (
        <GamePicker
          points={points}
          isA={isA}
          rows={rows}
          otherName={otherName}
          today={today}
          matchId={matchId}
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
  onOptimistic,
  onFailed,
}: {
  matchId: string;
  locked: boolean;
  onOpenGames: () => void;
  onOptimistic: (body: string) => void;
  onFailed: (body: string) => void;
}) {
  const [text, setText] = useState("");

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

  // Wiadomość ląduje w rozmowie od razu; wysyłka leci w tle.
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    onOptimistic(body);
    sendMessage(matchId, body)
      .then((res) => {
        if (!res.ok) {
          onFailed(body);
          setText(body);
        }
      })
      .catch(() => {
        onFailed(body);
        setText(body);
      });
  }

  return (
    <form onSubmit={submit} className="mb-2 flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Napisz coś…"
        className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm"
      />
      <button
        type="submit"
        aria-label="Wyślij"
        className="grid h-11 w-11 flex-none place-items-center rounded-full bg-coral text-[#06281A] transition active:scale-95"
      >
        <Icon name="send" className="h-5 w-5" filled />
      </button>
    </form>
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

/** Kto już chce zagrać — czytelne bez czytania opisu. */
function Dot({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={`flex items-center gap-1 text-[10px] font-bold ${
        on ? "text-berry" : "text-inksoft/60"
      }`}
    >
      <span
        className={`grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] ${
          on ? "bg-[#8FE3C2] text-[#06281A]" : "border border-line"
        }`}
      >
        {on ? "✓" : ""}
      </span>
      <span className="max-w-[52px] truncate">{label}</span>
    </span>
  );
}
