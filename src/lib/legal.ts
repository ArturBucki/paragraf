/**
 * Dane operatora w jednym miejscu — regulamin, polityka prywatności i rejestracja
 * czytają je stąd, żeby nie rozjechały się między dokumentami.
 *
 * DO UZUPEŁNIENIA: company, address, nip. Dopóki są puste, dokumenty pokazują
 * imię i adres e-mail (to wystarczy na test wśród znajomych, ale przy szerszym
 * starcie RODO wymaga pełnej tożsamości administratora).
 */
const COMPANY = ""; // np. "paragraf sp. z o.o."
const ADDRESS = ""; // np. "ul. Przykładowa 1/2, 00-001 Warszawa"
const NIP = ""; // np. "1234567890"

export const LEGAL = {
  company: COMPANY,
  address: ADDRESS,
  nip: NIP,
  email: "abucki100@gmail.com",
  site: "paragraf-seven.vercel.app",
  date: "1 września 2026",

  /** Jedna linijka do wstawienia w tekst — tyle, ile faktycznie wiemy. */
  operator: [COMPANY || "Artur", ADDRESS, NIP && `NIP ${NIP}`]
    .filter(Boolean)
    .join(", "),

  /** true, gdy komplet danych firmowych jest wpisany. */
  complete: Boolean(COMPANY && ADDRESS && NIP),

  disclaimer:
    "To rzetelny szkic, nie opinia prawna. Przed startem z prawdziwymi użytkownikami daj oba dokumenty do sprawdzenia prawnikowi — zwłaszcza część o danych osobowych, bo dane o orientacji seksualnej są danymi wrażliwymi (art. 9 RODO) i wymagają wyraźnej zgody.",
} as const;
