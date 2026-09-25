/**
 * 36 pytań dr. Arthura Arona — zestaw skrócony do 12, w trzech rundach
 * o rosnącej głębi. To jest sedno badania: stopniowe, WZAJEMNE odsłanianie się.
 */
export const Q36: { round: 1 | 2 | 3; q: string }[] = [
  { round: 1, q: "Kogo z całego świata chcesz zaprosić na kolację?" },
  { round: 1, q: "Co dla Ciebie znaczy „idealny dzień”?" },
  { round: 1, q: "Kiedy ostatnio zdarzyło Ci się śpiewać samemu sobie?" },
  { round: 1, q: "Za co w życiu czujesz największą wdzięczność?" },
  { round: 1, q: "Co robisz, kiedy nikt nie patrzy, i trochę Cię to bawi?" },

  { round: 2, q: "Jaką jedną cechę albo zdolność chcesz mieć jutro rano?" },
  { round: 2, q: "Co jest Twoim największym osiągnięciem?" },
  { round: 2, q: "Co cenisz najbardziej w przyjaźni?" },
  { round: 2, q: "Jakie masz najcieplejsze wspomnienie?" },
  { round: 2, q: "Czego się w sobie uczysz od dłuższego czasu?" },

  { round: 3, q: "Kiedy ostatnio zdarzyło Ci się płakać przy kimś?" },
  { round: 3, q: "Czego zwykle nie mówisz komuś poznanemu wczoraj — a tu masz ochotę?" },
  { round: 3, q: "O czym myślisz, kiedy nie możesz zasnąć?" },
  { round: 3, q: "Co już udało Ci się polubić w drugiej osobie?" },
];

/*
 * Wszystkie pytania są bez rodzaju gramatycznego. Wcześniej było „gdybyś mógł",
 * „śpiewałeś", „wdzięczny" — czyli apka randkowa zakładała, że pyta mężczyznę.
 */

export const ROUND_LABEL: Record<1 | 2 | 3, string> = {
  1: "Runda 1 · lekko",
  2: "Runda 2 · głębiej",
  3: "Runda 3 · szczerze",
};

/** Trzy zdania o sobie — dwa prawdziwe, jedno zmyślone. */
export const TRUTH_SETS: string[][] = [
  ["Spałem kiedyś całą noc na lotnisku w Oslo.", "Umiem żonglować czterema piłkami.", "Mam kota, który wabi się Pierogi."],
  ["Przepłynąłem kiedyś jezioro w listopadzie.", "Byłem statystą w reklamie telewizyjnej.", "Nie piłem kawy przez cały rok."],
  ["Znam na pamięć cały tekst „Misia”.", "Złamałem rękę, tańcząc na weselu.", "Byłem raz na koncercie zespołu, którego nie znałem."],
  ["Uczyłem się gry na akordeonie.", "Zgubiłem kiedyś paszport w dniu wylotu.", "Ugotowałem obiad dla dwunastu osób."],
];

// Ten sam zestaw u obojga — bez losowania po stronie klienta.
export function truthSetFor(matchId: string, salt = 0): string[] {
  let sum = salt;
  for (let i = 0; i < matchId.length; i++) sum += matchId.charCodeAt(i);
  return TRUTH_SETS[sum % TRUTH_SETS.length];
}

/** Escape room — trzy zamki, każdy z połową wskazówek u innej osoby. */
export type Lock = {
  clueA: string;
  clueB: string;
  options: string[];
  answer: string;
  label: string;
};

export const LOCKS: Lock[] = [
  {
    label: "Zamek 1 · symbole",
    clueA: "pierwszy symbol to koło ●",
    clueB: "ostatni to trójkąt ▲, środkowy to gwiazda ★",
    options: ["■ ● ▲", "● ★ ▲", "● ■ ★", "▲ ● ★"],
    answer: "● ★ ▲",
  },
  {
    label: "Zamek 2 · liczba",
    clueA: "liczba jest parzysta i mniejsza od 50",
    clueB: "to wielokrotność 7, a jej cyfry dają w sumie 6",
    options: ["24", "42", "35", "48"],
    answer: "42",
  },
  {
    label: "Zamek 3 · kolor",
    clueA: "nie jest ciepły ani czarny",
    clueB: "kojarzy się z morzem, ale nie jest zielony",
    options: ["Czerwony", "Granatowy", "Złoty", "Oliwkowy"],
    answer: "Granatowy",
  },
];
