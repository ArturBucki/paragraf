export type Profile = {
  id: string;
  name: string;
  age: number | null;
  bio: string | null;
  games: string[];
  avatar: AvatarSpec | null;

  /** Zdjęcia profilowe (publiczne URL-e ze Storage). Pierwsze = główne. */
  photos: string[];
  gender: string | null;
  looking_for: string | null;
  city: string | null;
  job: string | null;
  education: string | null;
  height_cm: number | null;
  interests: string[];

  /** Kim jestem i kogo szukam. */
  orientation: string[];
  interested_in: string | null;

  /** Styl życia — krótkie odpowiedzi, same kliknięcia. */
  drinking: string | null;
  smoking: string | null;
  workout: string | null;
  pets: string | null;
  kids: string | null;
  zodiac: string | null;
  languages: string[];

  /** Zweryfikowane zdjęcie — na razie ustawiane ręcznie, docelowo selfie. */
  verified: boolean;

  created_at?: string;
};

// Ilustrowany awatar — używany, dopóki ktoś nie wgra zdjęcia.
export type AvatarSpec = {
  skin: string;
  hair: string;
  cloth: string;
  bg: string;
  style: "wavy" | "short" | "bangs";
  stubble?: boolean;
};

export type Match = {
  id: string;
  user_a: string;
  user_b: string;
  points: number;
  created_at: string;
};

/**
 * Słowniki profilu. Wszystko jest klikane — nikt nie chce wypełniać ankiety
 * na telefonie. Każda odpowiedź jest krótka i po ludzku sformułowana.
 */
export const GENDERS = [
  "Kobieta",
  "Mężczyzna",
  "Osoba niebinarna",
  "Wolę nie mówić",
] as const;

/** Orientacja — wielokrotny wybór, bo ludzie nie mieszczą się w jednej etykiecie. */
export const ORIENTATIONS = [
  "Hetero",
  "Gej",
  "Lesbijka",
  "Bi",
  "Pan",
  "Aseksualna",
  "Queer",
  "Szukam nazwy",
] as const;
export const MAX_ORIENTATION = 3;

/** Kogo chcę widzieć w swipe. */
export const INTERESTED_IN = ["Kobiety", "Mężczyzn", "Wszystkich"] as const;

export const LOOKING_FOR = [
  "Związek",
  "Randki",
  "Coś luźnego",
  "Przyjaźń",
  "Jeszcze nie wiem",
] as const;

export const DRINKING = ["Nie piję", "Okazjonalnie", "Towarzysko", "Często"] as const;
export const SMOKING = ["Nie palę", "Okazjonalnie", "Palę", "Vape"] as const;
export const WORKOUT = [
  "Codziennie",
  "Kilka razy w tygodniu",
  "Czasem",
  "Sport to nie moja bajka",
] as const;
export const PETS = ["Pies", "Kot", "Inne zwierzę", "Bez zwierząt", "Alergia"] as const;
export const KIDS = ["Mam dzieci", "Chcę kiedyś", "Nie chcę", "Jeszcze nie wiem"] as const;

export const ZODIAC = [
  "Baran", "Byk", "Bliźnięta", "Rak", "Lew", "Panna",
  "Waga", "Skorpion", "Strzelec", "Koziorożec", "Wodnik", "Ryby",
] as const;

export const LANGUAGES = [
  "Polski", "Angielski", "Niemiecki", "Hiszpański", "Francuski",
  "Włoski", "Ukraiński", "Rosyjski", "Migowy",
] as const;
export const MAX_LANGUAGES = 5;

/**
 * Zainteresowania w grupach — łatwiej wybrać z półki niż z jednej długiej listy.
 * Kolor grupy wraca potem na karcie w swipe.
 */
export const INTEREST_GROUPS = [
  {
    name: "Ruch",
    accent: "#8FE3C2",
    items: ["Bieganie", "Siłownia", "Joga", "Wspinaczka", "Rower", "Pływanie",
      "Piłka", "Siatkówka", "Narty", "Tenis"],
  },
  {
    name: "Kultura",
    accent: "#C299E6",
    items: ["Kino", "Seriale", "Muzyka", "Koncerty", "Teatr", "Książki",
      "Sztuka", "Fotografia", "Stand-up", "Podcasty"],
  },
  {
    name: "Jedzenie i wieczory",
    accent: "#FF9F6B",
    items: ["Kawa", "Gotowanie", "Wino", "Piwo kraftowe", "Sushi", "Pizza",
      "Wegetariańsko", "Słodycze", "Grill", "Śniadania na mieście"],
  },
  {
    name: "Granie",
    accent: "#F5C86B",
    items: ["Planszówki", "Gry", "Karty", "Szachy", "Quizy", "Escape roomy",
      "Kalambury", "Bilard"],
  },
  {
    name: "Świat",
    accent: "#7FD8E8",
    items: ["Podróże", "Góry", "Morze", "Miasto", "Camping", "Festiwale",
      "Rolki", "Zwiedzanie"],
  },
  {
    name: "Codzienność",
    accent: "#FF6B4A",
    items: ["Psy", "Koty", "Rośliny", "Programowanie", "Majsterkowanie",
      "Moda", "Wolontariat", "Nauka języków"],
  },
] as const;

/** Płaska lista — do walidacji po stronie serwera. */
export const INTERESTS = INTEREST_GROUPS.flatMap((g) => g.items as readonly string[]);
export const MAX_INTERESTS = 8;
