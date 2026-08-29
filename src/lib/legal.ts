/**
 * Dane operatora w jednym miejscu — regulamin, polityka prywatności i rejestracja
 * czytają je stąd, żeby nie rozjechały się między dokumentami.
 *
 * Adres jest adresem zamieszkania, więc pokazujemy go w jednym miejscu — w
 * polityce prywatności, bo tam RODO wymaga, żeby administrator dał się namierzyć.
 * Regulamin odsyła do polityki zamiast powtarzać adres drugi raz.
 * Jeśli pojawi się osobny adres do korespondencji, podmień go poniżej.
 */
const COMPANY = 'Artur Bucki, prowadzący działalność pod firmą „artb"';
const ADDRESS = "ul. Południowa 6, 16-420 Raczki";
const NIP = "8442387394";

export const LEGAL = {
  company: COMPANY,
  address: ADDRESS,
  nip: NIP,
  email: "abucki100@gmail.com",
  site: "paragraf-seven.vercel.app",
  date: "1 września 2026",

  /** Bez adresu — regulamin i wszystko poza polityką prywatności. */
  operator: [COMPANY, NIP && `NIP ${NIP}`].filter(Boolean).join(", "),

  /** Z adresem — wyłącznie polityka prywatności (obowiązek z RODO). */
  administrator: [COMPANY, ADDRESS, NIP && `NIP ${NIP}`]
    .filter(Boolean)
    .join(", "),

  disclaimer:
    "To rzetelny szkic, nie opinia prawna. Przed startem z prawdziwymi użytkownikami daj oba dokumenty do sprawdzenia prawnikowi — zwłaszcza część o danych osobowych, bo dane o orientacji seksualnej są danymi wrażliwymi (art. 9 RODO) i wymagają wyraźnej zgody.",
} as const;
