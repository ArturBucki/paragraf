"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  GAMES,
  gameById,
  gameOfTheDay,
  DAILY_BONUS,
  INVITE_TTL_H,
  type Game,
} from "@/lib/games";
import type { Profile } from "@/lib/types";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { usePresence } from "@/lib/usePresence";
import { Icon } from "@/components/Icon";
import { GamePicker } from "@/components/GamePicker";
import { GameStrip } from "@/components/GameStrip";
import { SafetyMenu } from "@/components/SafetyMenu";
import { PeerStatus } from "@/components/PeerStatus";
import { GameWheel } from "@/components/GameWheel";
import { GameInvite, GameWaiting, GameReady } from "@/components/GameInvite";
import { Riddle } from "@/components/games/Riddle";
import { TicTacToe } from "@/components/games/TicTacToe";
import { Charades } from "@/components/games/Charades";
import { Truths } from "@/components/games/Truths";
import { Questions36 } from "@/components/games/Questions36";
import { EscapeRoom } from "@/components/games/EscapeRoom";
import { finishGame } from "@/app/matches/[id]/actions";

type MatchGame = {
  game_id: string;
  a_wants: boolean;
  b_wants: boolean;
  played: boolean;
  /** Kiedy ktoś ostatnio kliknął — stąd wiadomo, czy zaproszenie jest świeże. */
  updated_at?: string | null;
};

type Message = {
  id: number;
  sender: string;
  body: string;
  created_at: string;
};

const PLAYABLE = new Set(["riddle", "ttt", "draw", "truths", "q36", "escape"]);
const RANDOM_ID = "__random__";

/** Losowanie udaje grę, bo przechodzi przez tę samą zgodę obojga. */
const RANDOM_GAME: Game = {
  id: RANDOM_ID,
  icon: "dice",
  short: "Losuj",
  name: "Losowanie gry",
  desc: "Koło wybierze za Was.",
  tag: "Losowanie",
  time: "chwila",
  accent: "#C8A96A",
  pts: 0,
  unlock: 0,
  kind: "coop",
};

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
  /*
   * Zaproszenia nie kasują się przy wyjściu z rozmowy — w apce, w której obie
   * osoby rzadko są online naraz, to jedyny most przez czas. Za to STARZEJĄ się:
   * po dobie przestają udawać aktualne i znikają.
   */
  const [rows, setRows] = useState<MatchGame[]>(() =>
    initialGames.map((r) => (isStale(r) ? { ...r, a_wants: false, b_wants: false } : r)),
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [active, setActive] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /*
   * Kto jest teraz W TEJ rozmowie. Globalna obecność mówi tylko „jest w apce",
   * a gra wymaga, żeby druga osoba siedziała w tym samym pokoju — inaczej
   * sygnał startu do niej nie dociera i wchodzisz do gry we dwoje sam.
   */
  const [inRoom, setInRoom] = useState<Set<string>>(new Set());
  /* „pisze…" — sygnał ulotny, więc leci broadcastem i sam gaśnie po chwili. */
  const [otherTyping, setOtherTyping] = useState(false);
  const typingOff = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSent = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  /*
   * PŁYNNOŚĆ — trzy rzeczy naraz:
   * 1. zapisy idą prosto do bazy z przeglądarki (jedno zapytanie zamiast
   *    kilku przez serwer Next), więc klik nie czeka na rundę po serwerze,
   * 2. lecą w kolejce, żeby dwa szybkie kliknięcia nie wyprzedziły się nawzajem,
   * 3. dopóki mam własne zmiany w locie, ignoruję echo z Realtime —
   *    to ono powodowało „przeskakiwanie" wyboru po chwili.
   */
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const inFlight = useRef(0);

  const enqueue = useCallback(
    (job: () => PromiseLike<unknown>, onError?: () => void) => {
      inFlight.current += 1;
      queue.current = Promise.resolve(queue.current)
        .then(() => job())
        .catch((e) => {
          onError?.();
          console.error(e);
        })
        .finally(() => {
          inFlight.current -= 1;
          // Ostatni zapis z serii dociąga prawdę z bazy — bez migotania po drodze.
          if (inFlight.current === 0) {
            supabase
              .from("match_games")
              .select("game_id,a_wants,b_wants,played")
              .eq("match_id", matchId)
              .then(({ data }) => {
                if (data) setRows(data as MatchGame[]);
              });
          }
        });
    },
    [supabase, matchId],
  );

  const otherName = other?.name ?? "Twój match";
  const playedAny = rows.some((r) => r.played);
  const online = usePresence(meId);
  const otherOnline = other ? online.has(other.id) : false;
  const otherInRoom = other ? inRoom.has(other.id) : false;

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

  // Sprzątanie starych zaproszeń — raz, przy wejściu, po cichu.
  useEffect(() => {
    const stale = initialGames.filter(isStale);
    if (!stale.length) return;
    supabase
      .from("match_games")
      .update({ a_wants: false, b_wants: false })
      .eq("match_id", matchId)
      .in("game_id", stale.map((r) => r.game_id))
      .then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rowFor = useCallback(
    (id: string) => rows.find((r) => r.game_id === id),
    [rows],
  );

  useEffect(() => {
    const ch = supabase
      .channel(`match:${matchId}`, { config: { presence: { key: meId } } })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_games", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as MatchGame;
          if (!row?.game_id) return;
          if (inFlight.current > 0) return; // moje własne echo — mam nowszy stan
          setRows((prev) => [...prev.filter((r) => r.game_id !== row.game_id), row]);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const m = payload.new as Message;
          if (m.sender !== meId) setOtherTyping(false);
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
      .on("broadcast", { event: "typing" }, () => {
        setOtherTyping(true);
        if (typingOff.current) clearTimeout(typingOff.current);
        typingOff.current = setTimeout(() => setOtherTyping(false), 3200);
      })
      .on("presence", { event: "sync" }, () => {
        setInRoom(new Set(Object.keys(ch.presenceState())));
      })
      .on("broadcast", { event: "decline" }, ({ payload }) => {
        const id = payload?.gameId as string | undefined;
        const g = id === RANDOM_ID ? RANDOM_GAME : id ? gameById(id) : null;
        if (g) flashRef.current(`${otherNameRef.current} woli teraz nie grać w „${g.name}".`);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          ch.track({ at: new Date().toISOString() });
        }
      });

    channelRef.current = ch;
    return () => {
      if (typingOff.current) clearTimeout(typingOff.current);
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [supabase, matchId, meId]);

  /**
   * Zaznacza moją chęć na jedną grę — i kasuje poprzednią.
   * Jedna gra na raz: druga osoba dostaje jedno jasne pytanie,
   * a nie kolejkę zaproszeń.
   */
  function optimisticToggle(gameId: string) {
    setRows((prev) => {
      const row = prev.find((r) => r.game_id === gameId) ?? {
        game_id: gameId,
        a_wants: false,
        b_wants: false,
        played: false,
      };
      const on = !(isA ? row.a_wants : row.b_wants);

      const others = prev
        .filter((r) => r.game_id !== gameId)
        .map((r) =>
          on ? { ...r, ...(isA ? { a_wants: false } : { b_wants: false }) } : r,
        );

      const nextRow = isA ? { ...row, a_wants: on } : { ...row, b_wants: on };
      return [...others, nextRow];
    });
  }

  function onToggle(gameId: string) {
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
    const snapshot = rows;
    optimisticToggle(gameId);
    enqueue(
      () =>
        supabase
          .rpc("pick_game", { p_match: matchId, p_game: gameId })
          .then(({ error }) => {
            if (error) throw error;
          }),
      () => {
        setRows(snapshot); // cofamy cały stan, nie tylko klikniętą grę
        flash("Nie udało się zapisać wyboru.");
      },
    );
  }

  /** Przyjmuję zaproszenie: zaznaczam chęć i od razu wchodzimy oboje. */
  function acceptInvite(gameId: string) {
    optimisticToggle(gameId);
    enqueue(() => supabase.rpc("pick_game", { p_match: matchId, p_game: gameId }));
    // Jeśli zapraszający zdążył wyjść, zostaje sama zgoda — wejdzie, gdy wróci.
    if (otherInRoom) startGame(gameId);
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
    enqueue(() => clearWants(gameId));
  }

  function startGame(gameId: string) {
    if (!otherInRoom) {
      flash(`${otherName} nie jest teraz w rozmowie — gra poczeka.`);
      return;
    }
    setSheet(false);
    setActive(gameId);
    channelRef.current?.send({ type: "broadcast", event: "start", payload: { gameId } });
  }

  /**
   * Losowanie też wymaga zgody obojga — inaczej jedna osoba wrzucałaby drugą
   * do gry, której ta nie widziała na oczy.
   */
  function proposeRandom() {
    onToggle(RANDOM_ID);
  }

  /** Przyjmuję propozycję losowania — koło otworzy się obojgu. */
  function acceptRandom() {
    optimisticToggle(RANDOM_ID);
    enqueue(() => supabase.rpc("pick_game", { p_match: matchId, p_game: RANDOM_ID }));
  }

  /** Mówi drugiej stronie „piszę" — rzadziej niż co znak, żeby nie zalać kanału. */
  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - typingSent.current < 1800) return;
    typingSent.current = now;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: {} });
  }, []);

  /** Kasuje chęć obojga dla jednej gry (odmowa, rezygnacja z losowania). */
  const clearWants = useCallback(
    (gameId: string) =>
      supabase
        .from("match_games")
        .update({ a_wants: false, b_wants: false, updated_at: new Date().toISOString() })
        .eq("match_id", matchId)
        .eq("game_id", gameId),
    [supabase, matchId],
  );

  /** Sprząta zgodę na losowanie (po wyniku albo po rezygnacji). */
  function clearRandom() {
    setRows((prev) =>
      prev.map((r) =>
        r.game_id === RANDOM_ID ? { ...r, a_wants: false, b_wants: false } : r,
      ),
    );
    enqueue(() => clearWants(RANDOM_ID));
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

  // Stan losowania trzymamy w tym samym wierszu co gry — pseudo-gra „__random__".
  const randomRow = rowFor(RANDOM_ID);
  const randomMine = !!(isA ? randomRow?.a_wants : randomRow?.b_wants);
  const randomTheirs = !!(isA ? randomRow?.b_wants : randomRow?.a_wants);
  const randomBoth = randomMine && randomTheirs;

  const wheelGames = GAMES.filter(
    (g) => PLAYABLE.has(g.id) && points >= g.unlock,
  );

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
      <header className="flex flex-none items-center gap-3 border-b border-line/70 pb-3">
        <Link href="/matches" className="text-inksoft" aria-label="Wróć">
          <Icon name="back" className="h-6 w-6" />
        </Link>
        <Link
          href={other ? `/profil/${other.id}` : "#"}
          className="relative h-11 w-11 shrink-0"
          aria-label={`Profil: ${otherName}`}
        >
          <div className="h-full w-full overflow-hidden rounded-full">
            <ProfilePhoto profile={other ?? null} />
          </div>
          {/* Kropka jak w komunikatorach: zielona = tu jest, złota = w apce. */}
          {(otherInRoom || otherOnline) && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bg ${
                otherInRoom ? "bg-berry" : "bg-gold"
              }`}
            />
          )}
        </Link>
        <Link href={other ? `/profil/${other.id}` : "#"} className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-bold leading-tight">{otherName}</span>
            <Icon name="info" className="h-3.5 w-3.5 flex-none text-inksoft" />
          </div>
          <div className="text-xs text-inksoft">
            {otherInRoom ? (
              <span className="font-semibold text-berry">jest tu z Tobą</span>
            ) : otherOnline ? (
              "jest w apce, ale nie w tej rozmowie"
            ) : (
              "offline — zaproszenie poczeka"
            )}
          </div>
        </Link>
        <span className="flex flex-none items-center gap-1 font-mono text-xs font-bold text-gold">
          <Icon name="spark" className="h-3.5 w-3.5" /> {points}
        </span>
        {other && (
          <SafetyMenu otherId={other.id} otherName={otherName} matchId={matchId} />
        )}
      </header>

      {/* rozmowa na pełną szerokość, wybór gry tuż nad polem wiadomości */}
      <Stream
        messages={messages}
        meId={meId}
        otherName={otherName}
        locked={!playedAny}
        onOpenGames={() => setSheet(true)}
        onRandom={proposeRandom}
      />

      <div className="flex-none pt-1">
        {/* kto chce grać — zaproszenie, oczekiwanie albo gotowy start */}
        {randomBoth ? null : ready ? (
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
        ) : randomTheirs ? (
          <GameInvite
            game={RANDOM_GAME}
            otherName={otherName}
            lead="proponuje losowanie"
            note="Koło wybierze grę za Was oboje"
            onAccept={() => acceptRandom()}
            onDecline={() => declineInvite(RANDOM_ID)}
          />
        ) : waiting ? (
          <GameWaiting
            game={waiting}
            otherName={otherName}
            otherOnline={otherOnline}
            onCancel={() => onToggle(waiting.id)}
          />
        ) : randomMine ? (
          <GameWaiting
            game={RANDOM_GAME}
            otherName={otherName}
            otherOnline={otherOnline}
            onCancel={() => onToggle(RANDOM_ID)}
          />
        ) : null}

        <PeerStatus other={other} inRoom={otherInRoom} typing={otherTyping} />

        <GameStrip
          matchId={matchId}
          today={today}
          points={points}
          stateFor={stateFor}
          onPick={onToggle}
          onRandom={proposeRandom}
          onOpenAll={() => setSheet(true)}
        />

        <Composer
          matchId={matchId}
          meId={meId}
          locked={!playedAny}
          onTyping={sendTyping}
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

      {sheet && (
        <GamePicker
          points={points}
          isA={isA}
          rows={rows}
          otherName={otherName}
          today={today}
          matchId={matchId}
          onClose={() => setSheet(false)}
          onToggle={onToggle}
          onStart={startGame}
          onRandom={proposeRandom}
        />
      )}

      {randomBoth && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg/95 px-6 backdrop-blur">
          <div className="text-center">
            <p className="font-display text-2xl font-extrabold">Zakręćcie kołem</p>
            <p className="mt-1 text-sm text-inksoft">
              Wystarczy, że zakręci jedno z Was — u drugiego koło zatrzyma się
              w tym samym miejscu.
            </p>
          </div>
          <GameWheel
            games={wheelGames}
            channel={channelRef.current}
            onResult={(id) => {
              clearRandom();
              startGame(id);
            }}
          />
          <button
            onClick={clearRandom}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-inksoft"
          >
            Wolimy wybrać sami
          </button>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto w-[92%] max-w-sm rounded-2xl bg-surface2 px-4 py-3 text-center text-sm font-semibold text-ink shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

/** Zaproszenie starsze niż doba nie jest już zaproszeniem. */
function isStale(r: MatchGame) {
  if (!r.updated_at || (!r.a_wants && !r.b_wants)) return false;
  const ms = Date.now() - new Date(r.updated_at).getTime();
  return ms > INVITE_TTL_H * 3600 * 1000;
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
          <Icon name="gamepad" className="h-8 w-8 text-coraldeep" />
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
            className="rounded-xl bg-coral px-5 py-3 font-bold text-[rgb(var(--on-coral))]"
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

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-semibold">Rozmowa otwarta</p>
        <p className="max-w-[16rem] text-sm text-inksoft">
          Po wspólnej grze zawsze jest o czym zacząć — napisz pierwsze zdanie.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-end overflow-y-auto py-3">
      {messages.map((m, i) => {
        if (m.body.startsWith("__system__")) {
          return (
            <div key={m.id} className="my-3 flex justify-center px-2">
              <span className="flex max-w-[88%] items-center gap-1.5 rounded-full bg-surface2 px-3 py-1 text-center text-[11px] font-semibold text-inksoft">
                <Icon name="spark" className="h-3 w-3 flex-none text-gold" />
                {m.body.replace("__system__", "")}
              </span>
            </div>
          );
        }

        const mine = m.sender === meId;
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const startsGroup = !prev || prev.sender !== m.sender || prev.body.startsWith("__system__");
        const endsGroup = !next || next.sender !== m.sender || next.body.startsWith("__system__");

        return (
          <div key={m.id} className={endsGroup ? "mb-2.5" : "mb-0.5"}>
            {startsGroup && !mine && (
              <p className="mb-1 pl-1 text-[11px] font-semibold text-inksoft">
                {otherName}
              </p>
            )}
            <div
              className={`w-fit max-w-[80%] px-3.5 py-2 text-[15px] leading-snug ${
                mine
                  ? "ml-auto bg-coral/25 text-ink"
                  : "mr-auto bg-surface text-ink soft-1"
              } ${
                mine
                  ? `rounded-l-2xl ${startsGroup ? "rounded-tr-2xl" : "rounded-tr-md"} ${endsGroup ? "rounded-br-md" : "rounded-br-md"}`
                  : `rounded-r-2xl ${startsGroup ? "rounded-tl-2xl" : "rounded-tl-md"} rounded-bl-md`
              }`}
            >
              {m.body}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

function Composer({
  matchId,
  meId,
  locked,
  onOpenGames,
  onTyping,
  onOptimistic,
  onFailed,
}: {
  matchId: string;
  meId: string;
  locked: boolean;
  onOpenGames: () => void;
  onTyping: () => void;
  onOptimistic: (body: string) => void;
  onFailed: (body: string) => void;
}) {
  const [text, setText] = useState("");

  if (locked) {
    return (
      <button
        onClick={onOpenGames}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-full bg-surface px-4 py-3 text-sm text-inksoft"
      >
        <Icon name="lock" className="h-4 w-4" /> Rozmowa otworzy się po pierwszej wspólnej grze
      </button>
    );
  }

  // Wiadomość ląduje w rozmowie od razu; wysyłka leci prosto do bazy
  // (RLS pilnuje, że sender to ja i że należę do tej pary).
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || body.length > 2000) return;
    setText("");
    onOptimistic(body);
    createClient()
      .from("messages")
      .insert({ match_id: matchId, sender: meId, body })
      .then(({ error }) => {
        if (error) {
          onFailed(body);
          setText(body);
        }
      });
  }

  return (
    <form onSubmit={submit} className="mb-2 flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value.trim()) onTyping();
        }}
        placeholder="Napisz coś…"
        className="min-w-0 flex-1 rounded-full bg-surface px-4 py-3 text-[15px] outline-none soft-1 placeholder:text-inksoft"
      />
      <button
        type="submit"
        aria-label="Wyślij"
        className="grid h-11 w-11 flex-none place-items-center rounded-full bg-coral text-[rgb(var(--on-coral))] soft-2 transition active:scale-95"
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
      <header className="flex flex-none items-center gap-3 border-b border-line/70 pb-3">
        <button onClick={props.onExit} className="text-inksoft" aria-label="Wróć">
          <Icon name="back" className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2.5">
          {g && <Icon name={g.icon} className="h-6 w-6 text-coraldeep" />}
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
          on ? "bg-berry text-white" : "border border-line"
        }`}
      >
        {on ? "✓" : ""}
      </span>
      <span className="max-w-[52px] truncate">{label}</span>
    </span>
  );
}
