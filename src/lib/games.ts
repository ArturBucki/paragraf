import type { IconName } from "@/components/Icon";

// Katalog gier — wspólny dla całej apki.
// pts    = punkty połączenia za ukończenie (współpraca daje więcej niż rywalizacja)
// unlock = próg punktów pary, od którego gra jest dostępna (0 = od startu)
export type Game = {
  id: string;
  icon: IconName;
  /** Krótka nazwa na koło losowania. */
  short: string;
  name: string;
  desc: string;
  tag: string;
  pts: number;
  unlock: number;
  kind: "coop" | "create" | "social" | "versus";
};

export const GAMES: Game[] = [
  { id: "ttt", short: "Kółko", icon: "grid", name: "Kółko i krzyżyk", desc: "Szybka rozgrywka na rozgrzewkę.", tag: "Rywalizacja", pts: 30, unlock: 0, kind: "versus" },
  { id: "truths", short: "2 prawdy", icon: "masks", name: "Dwie prawdy, jedno kłamstwo", desc: "Zgadnij, co zmyśliła druga osoba.", tag: "Poznajcie się", pts: 40, unlock: 0, kind: "social" },
  { id: "riddle", short: "Zagadka", icon: "puzzle", name: "Zagadka we dwoje", desc: "Każde ma połowę wskazówek — złóżcie je.", tag: "Współpraca", pts: 60, unlock: 0, kind: "coop" },
  { id: "draw", short: "Kalambury", icon: "brush", name: "Kalambury", desc: "Jedno rysuje, drugie zgaduje — na żywo.", tag: "Zabawa", pts: 50, unlock: 60, kind: "create" },
  { id: "q36", short: "36 pytań", icon: "chat", name: "36 pytań", desc: "Głębsze pytania, które zbliżają.", tag: "Bliskość", pts: 80, unlock: 150, kind: "social" },
  { id: "escape", short: "Escape", icon: "key", name: "Escape room we dwoje", desc: "Rozszyfrujcie kod razem.", tag: "Współpraca+", pts: 100, unlock: 320, kind: "coop" },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
