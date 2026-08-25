// Zagadki kooperacyjne: każda osoba widzi INNĄ połowę wskazówek.
// Rozwiązanie wymaga rozmowy — to sedno gry.
export type Riddle = {
  clueA: string;
  clueB: string;
  options: string[];
  answer: string;
};

export const RIDDLES: Riddle[] = [
  {
    clueA: "to zwierzę · mieszka w wodzie",
    clueB: "ma osiem ramion · zmienia kolor",
    options: ["🦈 Rekin", "🐙 Ośmiornica", "🐬 Delfin", "🐢 Żółw"],
    answer: "🐙 Ośmiornica",
  },
  {
    clueA: "jest w kuchni · robi hałas",
    clueB: "kręci się · miesza ciasto",
    options: ["🍞 Toster", "🥄 Mikser", "🧊 Lodówka", "🍽️ Zmywarka"],
    answer: "🥄 Mikser",
  },
  {
    clueA: "można na tym siedzieć · bywa w parku",
    clueB: "jest długa · zwykle drewniana",
    options: ["🪑 Krzesło", "🛋️ Kanapa", "🪵 Ławka", "🧺 Koc"],
    answer: "🪵 Ławka",
  },
  {
    clueA: "świeci · jest na niebie",
    clueB: "zmienia kształt · widać ją nocą",
    options: ["☀️ Słońce", "🌙 Księżyc", "⭐ Gwiazda", "☄️ Kometa"],
    answer: "🌙 Księżyc",
  },
];

// Ta sama zagadka dla obu osób w parze — bez losowania na kliencie.
export function riddleForMatch(matchId: string): Riddle {
  let sum = 0;
  for (let i = 0; i < matchId.length; i++) sum += matchId.charCodeAt(i);
  return RIDDLES[sum % RIDDLES.length];
}
