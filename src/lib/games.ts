import type { IconName } from "@/components/Icon";

// Katalog gier — wspólny dla całej apki.
// pts    = punkty połączenia za ukończenie (współpraca daje więcej niż rywalizacja)
// unlock = próg punktów pary, od którego gra jest dostępna (0 = od startu)
// accent = własny kolor gry; dzięki niemu wybór wygląda jak półka z grami,
//          a nie jak lista pozycji w formularzu
export type Game = {
  id: string;
  icon: IconName;
  /** Krótka nazwa na koło losowania. */
  short: string;
  name: string;
  desc: string;
  tag: string;
  /** Ile zajmuje — ludzie wybierają też pod czas, który mają. */
  time: string;
  accent: string;
  pts: number;
  unlock: number;
  kind: "coop" | "create" | "social" | "versus";
};

export const GAMES: Game[] = [
  {
    id: "ttt", short: "Kółko", icon: "grid",
    name: "Kółko i krzyżyk", desc: "Szybka rozgrywka na rozgrzewkę.",
    tag: "Rywalizacja", time: "1 min", accent: "#C8A96A",
    pts: 30, unlock: 0, kind: "versus",
  },
  {
    id: "truths", short: "2 prawdy", icon: "masks",
    name: "Dwie prawdy, jedno kłamstwo", desc: "Zgadnij, co zmyśliła druga osoba.",
    tag: "Poznajcie się", time: "2 min", accent: "#9BA8D4",
    pts: 40, unlock: 0, kind: "social",
  },
  {
    id: "riddle", short: "Zagadka", icon: "puzzle",
    name: "Zagadka we dwoje", desc: "Każde ma połowę wskazówek — złóżcie je.",
    tag: "Współpraca", time: "3 min", accent: "#7FBFA3",
    pts: 60, unlock: 0, kind: "coop",
  },
  {
    id: "draw", short: "Kalambury", icon: "brush",
    name: "Kalambury", desc: "Jedno rysuje, drugie zgaduje — na żywo.",
    tag: "Zabawa", time: "3 min", accent: "#D98A63",
    pts: 50, unlock: 60, kind: "create",
  },
  {
    id: "q36", short: "36 pytań", icon: "chat",
    name: "36 pytań", desc: "Głębsze pytania, które zbliżają.",
    tag: "Bliskość", time: "10 min", accent: "#7FB0BF",
    pts: 80, unlock: 150, kind: "social",
  },
  {
    id: "escape", short: "Escape", icon: "key",
    name: "Escape room we dwoje", desc: "Trzy zamki, dwie połówki wskazówek.",
    tag: "Współpraca+", time: "6 min", accent: "#C9695A",
    pts: 100, unlock: 320, kind: "coop",
  },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

/** Bonus za zagranie w grę dnia — mały powód, żeby wpaść dziś. */
export const DAILY_BONUS = 15;

/**
 * Gra dnia — ta sama dla obojga i zmienia się codziennie.
 * Liczona z daty i id pary, więc każda para ma własną.
 */
export function gameOfTheDay(matchId: string, today: string, points: number): Game {
  const pool = GAMES.filter((g) => points >= g.unlock);
  const src = pool.length ? pool : GAMES;
  let sum = 0;
  const seed = matchId + today;
  for (let i = 0; i < seed.length; i++) sum = (sum * 31 + seed.charCodeAt(i)) % 100000;
  return src[sum % src.length];
}

/** Ile brakuje do kolejnej gry — daje kierunek zamiast abstrakcyjnych punktów. */
export function nextUnlock(points: number): { game: Game; missing: number } | null {
  const locked = GAMES.filter((g) => g.unlock > points).sort(
    (a, b) => a.unlock - b.unlock,
  )[0];
  return locked ? { game: locked, missing: locked.unlock - points } : null;
}
