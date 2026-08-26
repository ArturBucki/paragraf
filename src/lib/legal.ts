/**
 * Dane operatora w jednym miejscu — regulamin, polityka prywatności i rejestracja
 * czytają je stąd, żeby nie rozjechały się między dokumentami.
 *
 * BRAKUJE JESZCZE ADRESU. RODO wymaga, żeby administrator dał się zidentyfikować
 * i namierzyć; sam NIP i e-mail to minimum, adres domyka sprawę. Wpisz go poniżej,
 * a przejściowa formułka w obu dokumentach zniknie sama.
 */
const COMPANY = 'Artur Bucki, prowadzący działalność pod firmą „artb"';
const ADDRESS = ""; // np. "ul. Przykładowa 1/2, 00-001 Warszawa"
const NIP = "8442387394";

export const LEGAL = {
  company: COMPANY,
  address: ADDRESS,
  nip: NIP,
  email: "abucki100@gmail.com",
  site: "paragraf-seven.vercel.app",
  date: "1 września 2026",

  /** Jedna linijka do wstawienia w tekst — tyle, ile faktycznie wiemy. */
  operator: [COMPANY, ADDRESS, NIP && `NIP ${NIP}`].filter(Boolean).join(", "),

  /** true dopiero, gdy da się nas zidentyfikować i namierzyć. */
  complete: Boolean(COMPANY && ADDRESS && NIP),

  disclaimer:
    "To rzetelny szkic, nie opinia prawna. Przed startem z prawdziwymi użytkownikami daj oba dokumenty do sprawdzenia prawnikowi — zwłaszcza część o danych osobowych, bo dane o orientacji seksualnej są danymi wrażliwymi (art. 9 RODO) i wymagają wyraźnej zgody.",
} as const;
