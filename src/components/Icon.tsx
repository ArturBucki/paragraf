/**
 * Autorski zestaw ikon paragrafu.
 * Jeden styl: linia 1.8, zaokrąglone końce, siatka 24×24, kolor dziedziczony
 * (currentColor) — dzięki temu ikony reagują na stan tak jak tekst obok.
 */
export type IconName =
  | "cards"
  | "chat"
  | "user"
  | "dice"
  | "spark"
  | "lock"
  | "puzzle"
  | "grid"
  | "brush"
  | "key"
  | "masks"
  | "gamepad"
  | "heart"
  | "close"
  | "send"
  | "back"
  | "pin"
  | "work"
  | "cap"
  | "ruler"
  | "info"
  | "verified"
  | "eye";

const PATHS: Record<IconName, React.ReactNode> = {
  // Talia kart — odkrywanie
  cards: (
    <>
      <rect x="8.5" y="4" width="11" height="15" rx="2.5" />
      <path d="M6 6.8 4.9 7.2A2.5 2.5 0 0 0 3.4 10.4l2.6 7.4" />
    </>
  ),
  // Rozmowa
  chat: (
    <>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.4A.5.5 0 0 1 5 19v-3H6.5A2.5 2.5 0 0 1 4 13.5Z" />
      <path d="M8.5 8.5h7M8.5 11.5h4" />
    </>
  ),
  // Profil
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" />
    </>
  ),
  // Kostka — losowanie
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="9" cy="9" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  // Iskra — punkty połączenia
  spark: (
    <path d="M12 3.6c.7 4.2 1.5 5 5.7 5.7-4.2.7-5 1.5-5.7 5.7-.7-4.2-1.5-5-5.7-5.7 4.2-.7 5-1.5 5.7-5.7ZM18 15.4c.35 2 .75 2.4 2.75 2.75-2 .35-2.4.75-2.75 2.75-.35-2-.75-2.4-2.75-2.75 2-.35 2.4-.75 2.75-2.75Z" />
  ),
  // Zamek — gra zablokowana
  lock: (
    <>
      <rect x="4.8" y="10.5" width="14.4" height="9.5" rx="2.6" />
      <path d="M8.4 10.5V8a3.6 3.6 0 0 1 7.2 0v2.5" />
      <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  // Puzzel — zagadka we dwoje
  puzzle: (
    <path d="M5 8.6a1.6 1.6 0 0 1 1.6-1.6h2.2a2 2 0 1 1 4 0h2.6A1.6 1.6 0 0 1 17 8.6v2.6a2 2 0 1 1 0 4V18a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 18v-3.4a2 2 0 1 0 0-4Z" />
  ),
  // Kółko i krzyżyk — równa siatka, jedno kółko, jeden krzyżyk
  grid: (
    <>
      <path d="M4.6 10.2h14.8M4.6 14.6h14.8M9.8 4.6v14.8M14.2 4.6v14.8" opacity="0.4" />
      <circle cx="7.2" cy="7.4" r="1.6" />
      <path d="M15.9 16.1l2.6 2.6M18.5 16.1l-2.6 2.6" />
    </>
  ),
  // Pędzel — wspólne rysowanie
  brush: (
    <>
      <path d="M17.2 3.9a2.5 2.5 0 0 1 3.5 3.5l-7.6 7.6-4.3.8.8-4.3Z" />
      <path d="M8 16c-1.6 0-2.6 1-3 2.2-.3 1-.9 1.6-1.8 1.9 1 .9 2.3 1.2 3.5.9 1.7-.4 2.8-1.7 2.8-3.2A1.9 1.9 0 0 0 8 16Z" />
    </>
  ),
  // Klucz — escape room
  key: (
    <>
      <circle cx="8.4" cy="8.4" r="3.9" />
      <circle cx="8.4" cy="8.4" r="1.15" fill="currentColor" stroke="none" />
      <path d="M11.2 11.2 19.6 19.6" />
      <path d="M17.2 17.2l-2 2M14.6 14.6l-2 2" />
    </>
  ),
  // Dwie prawdy, jedno kłamstwo — dwie karty, na wierzchniej ptaszek
  masks: (
    <>
      <rect x="3.4" y="6.6" width="10.4" height="13" rx="2.4" />
      <path d="M8.2 4.4h9.2a2.4 2.4 0 0 1 2.4 2.4v9" />
      <path d="M6.2 13.4l2.1 2.1 3.4-3.7" />
    </>
  ),
  // Pad — wybór gry
  gamepad: (
    <>
      <path d="M7.5 8h9a4.5 4.5 0 0 1 4.4 3.6l.7 3.6A2.6 2.6 0 0 1 19 18.3c-.9 0-1.7-.5-2.2-1.2L16 16H8l-.8 1.1c-.5.7-1.3 1.2-2.2 1.2a2.6 2.6 0 0 1-2.6-3.1l.7-3.6A4.5 4.5 0 0 1 7.5 8Z" />
      <path d="M7 11.2v2.4M5.8 12.4h2.4M15.6 11.6h.01M17.6 13.2h.01" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.4-4.6-7.4-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.4 2.4C19.4 15.4 12 20 12 20Z" />
  ),
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  send: <path d="M4.5 12 20 4.5 15.5 20l-4-6.2Z" />,
  back: <path d="M14.5 5.5 8 12l6.5 6.5" />,

  // Miasto — pinezka
  pin: (
    <>
      <path d="M12 21c4-4.6 6-7.8 6-10.4A6 6 0 0 0 6 10.6C6 13.2 8 16.4 12 21Z" />
      <circle cx="12" cy="10.4" r="2.2" />
    </>
  ),
  // Praca — teczka
  work: (
    <>
      <rect x="3.2" y="7.6" width="17.6" height="12" rx="2.4" />
      <path d="M9 7.6V6.2A1.8 1.8 0 0 1 10.8 4.4h2.4A1.8 1.8 0 0 1 15 6.2v1.4" />
      <path d="M3.2 12.6h17.6" />
    </>
  ),
  // Wykształcenie — czapka
  cap: (
    <>
      <path d="M12 4.6 21.4 9 12 13.4 2.6 9 12 4.6Z" />
      <path d="M6.6 11v4.4c0 1.5 2.4 2.8 5.4 2.8s5.4-1.3 5.4-2.8V11" />
    </>
  ),
  // Więcej o osobie
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5.2" />
      <path d="M12 7.9h.01" />
    </>
  ),
  // Weryfikacja — odznaka z ptaszkiem
  verified: (
    <>
      <path d="M12 3.2l2.3 1.7 2.8-.2.9 2.7 2.3 1.6-1 2.7 1 2.7-2.3 1.6-.9 2.7-2.8-.2L12 20.8l-2.3-1.7-2.8.2-.9-2.7-2.3-1.6 1-2.7-1-2.7 2.3-1.6.9-2.7 2.8.2Z" />
      <path d="M8.8 12.1l2.2 2.2 4.2-4.4" />
    </>
  ),
  // Podgląd — oko
  eye: (
    <>
      <path d="M2.8 12S6.4 6.2 12 6.2 21.2 12 21.2 12 17.6 17.8 12 17.8 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.9" />
    </>
  ),
  // Wzrost — miarka
  ruler: (
    <>
      <rect x="3.4" y="8.6" width="17.2" height="6.8" rx="1.8" />
      <path d="M7.6 8.6v2.6M12 8.6v3.6M16.4 8.6v2.6" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-5 w-5",
  filled,
}: {
  name: IconName;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
