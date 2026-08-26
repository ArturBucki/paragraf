"use client";

import { useEffect, useState } from "react";
import type { GameProps } from "./types";

const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function TicTacToe({ isA, otherName, channel, onFinish }: GameProps) {
  const mySym = isA ? "O" : "X";
  const theirSym = isA ? "X" : "O";
  const [cells, setCells] = useState<(string | null)[]>(Array(9).fill(null));
  const [myTurn, setMyTurn] = useState(isA);

  const winner = WINS.map((w) =>
    cells[w[0]] && cells[w[0]] === cells[w[1]] && cells[w[1]] === cells[w[2]]
      ? cells[w[0]]
      : null,
  ).find(Boolean);
  const over = Boolean(winner) || cells.every(Boolean);

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
            ? "Wygrałeś!"
            : winner
              ? `${otherName} wygrywa`
              : "Remis"
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
          className="rounded-xl bg-coral px-6 py-3 font-bold text-[#14211C]"
        >
          Odbierzcie punkty
        </button>
      )}
    </div>
  );
}
