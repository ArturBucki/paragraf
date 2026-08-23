// Katalog gier — wspólny dla całej apki.
// pts   = punkty połączenia za ukończenie (co-op daje więcej niż rywalizacja)
// unlock = próg punktów pary, od którego gra jest dostępna (0 = od startu)
export type Game = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  tag: string;
  pts: number;
  unlock: number;
  kind: "coop" | "create" | "social" | "versus";
};

export const GAMES: Game[] = [
  { id: "ttt", icon: "⭕", name: "Kółko i krzyżyk", desc: "Szybka rozgrywka na rozgrzewkę.", tag: "Rywalizacja", pts: 30, unlock: 0, kind: "versus" },
  { id: "truths", icon: "🎭", name: "Dwie prawdy, jedno kłamstwo", desc: "Zgadnij, co zmyśliła druga osoba.", tag: "Poznajcie się", pts: 40, unlock: 0, kind: "social" },
  { id: "riddle", icon: "🧩", name: "Zagadka we dwoje", desc: "Każde ma połowę wskazówek — złóżcie je.", tag: "Współpraca", pts: 60, unlock: 0, kind: "coop" },
  { id: "draw", icon: "🎨", name: "Wspólne rysowanie", desc: "Jedno płótno, dwie pary rąk.", tag: "Tworzenie", pts: 50, unlock: 60, kind: "create" },
  { id: "q36", icon: "💬", name: "36 pytań", desc: "Głębsze pytania, które zbliżają.", tag: "Bliskość", pts: 80, unlock: 150, kind: "social" },
  { id: "escape", icon: "🗝️", name: "Escape room we dwoje", desc: "Rozszyfrujcie kod razem.", tag: "Współpraca+", pts: 100, unlock: 320, kind: "coop" },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
