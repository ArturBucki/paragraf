/**
 * Zagadki kooperacyjne.
 *
 * ZASADA, NA KTÓREJ STOI CAŁA GRA: żadna połowa wskazówek nie może sama
 * wskazać odpowiedzi. Każda wskazówka zawęża do TRZECH przedmiotów, a wspólny
 * jest dokładnie jeden. Dlatego odpowiedzi nie da się zgadnąć w pojedynkę —
 * trzeba zapytać drugą osobę, co widzi.
 *
 * Wcześniej było odwrotnie: „kręci się · miesza ciasto" przy czterech opcjach
 * rozwiązywało zagadkę bez jednego słowa rozmowy. Gra we dwoje była grą w
 * pojedynkę z drugą osobą w tle.
 */
export type Riddle = {
  /** Wskazówka dla osoby A i lista tego, co do niej pasuje. */
  clueA: string;
  fitsA: string[];
  /** To samo dla osoby B. */
  clueB: string;
  fitsB: string[];
  /** Sześć opcji: po trzy na każdą wskazówkę, jedna wspólna, jedna do niczego. */
  options: string[];
};

export const RIDDLES: Riddle[] = [
  {
    options: ["🧊 Lodówka", "🍞 Toster", "🥄 Mikser", "🧺 Pralka", "💨 Suszarka", "🕯️ Świeca"],
    clueA: "stoi w kuchni",
    fitsA: ["🧊 Lodówka", "🍞 Toster", "🥄 Mikser"],
    clueB: "ma silnik, który się kręci",
    fitsB: ["🥄 Mikser", "🧺 Pralka", "💨 Suszarka"],
  },
  {
    options: ["🐙 Ośmiornica", "🦈 Rekin", "🐬 Delfin", "🦇 Nietoperz", "🐨 Koala", "🦜 Papuga"],
    clueA: "żyje w morzu",
    fitsA: ["🐙 Ośmiornica", "🦈 Rekin", "🐬 Delfin"],
    clueB: "karmi młode mlekiem",
    fitsB: ["🐬 Delfin", "🦇 Nietoperz", "🐨 Koala"],
  },
  {
    options: ["🖼️ Muzeum", "📚 Biblioteka", "🎬 Kino", "🎪 Cyrk", "🏟️ Stadion", "🏖️ Plaża"],
    clueA: "wypada być cicho",
    fitsA: ["🖼️ Muzeum", "📚 Biblioteka", "🎬 Kino"],
    clueB: "kupujesz bilet na konkretną godzinę",
    fitsB: ["🎬 Kino", "🎪 Cyrk", "🏟️ Stadion"],
  },
  {
    options: ["☀️ Słońce", "🌙 Księżyc", "⭐ Gwiazda", "🌌 Droga Mleczna", "☁️ Chmura", "🌈 Tęcza"],
    clueA: "zobaczysz to tylko po zmroku",
    fitsA: ["🌙 Księżyc", "⭐ Gwiazda", "🌌 Droga Mleczna"],
    clueB: "nie świeci własnym światłem",
    fitsB: ["🌙 Księżyc", "☁️ Chmura", "🌈 Tęcza"],
  },
  {
    options: ["⌚ Zegarek", "📱 Telefon", "🔑 Klucz", "☂️ Parasol", "🎒 Plecak", "🧦 Skarpetka"],
    clueA: "zmieści się w kieszeni",
    fitsA: ["⌚ Zegarek", "📱 Telefon", "🔑 Klucz"],
    clueB: "służy do otwierania albo zamykania",
    fitsB: ["🔑 Klucz", "☂️ Parasol", "🎒 Plecak"],
  },
];

/**
 * Odpowiedź NIE jest zapisana ręcznie — wynika z przecięcia obu połówek.
 * Dzięki temu nie da się dodać zagadki, w której odpowiedź nie zgadza się
 * ze wskazówkami: jeśli przecięcie nie ma dokładnie jednego elementu,
 * zagadka jest zepsuta i zobaczymy to od razu.
 */
export function answerOf(r: Riddle): string {
  const wspolne = r.fitsA.filter((o) => r.fitsB.includes(o));
  return wspolne[0];
}

/** Sanity check — wołany w testach i w trybie deweloperskim. */
export function brokenRiddles(): string[] {
  const bledy: string[] = [];
  RIDDLES.forEach((r, i) => {
    const wspolne = r.fitsA.filter((o) => r.fitsB.includes(o));
    if (wspolne.length !== 1) {
      bledy.push(`Zagadka ${i}: wspólnych opcji ${wspolne.length}, ma być 1.`);
    }
    if (r.fitsA.length < 2 || r.fitsB.length < 2) {
      bledy.push(`Zagadka ${i}: wskazówka zawęża do jednej opcji — da się zgadnąć solo.`);
    }
    for (const o of [...r.fitsA, ...r.fitsB]) {
      if (!r.options.includes(o)) bledy.push(`Zagadka ${i}: „${o}" nie ma na liście opcji.`);
    }
  });
  return bledy;
}

// Ta sama zagadka dla obu osób w parze — bez losowania na kliencie.
export function riddleForMatch(matchId: string): Riddle {
  let sum = 0;
  for (let i = 0; i < matchId.length; i++) sum += matchId.charCodeAt(i);
  return RIDDLES[sum % RIDDLES.length];
}
