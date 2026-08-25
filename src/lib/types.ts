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

/** Słowniki do wyboru w profilu — krótkie, żeby nie robić ankiety. */
export const GENDERS = ["Kobieta", "Mężczyzna", "Inna"] as const;

export const LOOKING_FOR = [
  "Związek",
  "Coś luźnego",
  "Przyjaźń",
  "Zobaczymy",
] as const;

export const INTERESTS = [
  "Kawa", "Podróże", "Kino", "Muzyka", "Koncerty", "Gotowanie",
  "Bieganie", "Siłownia", "Wspinaczka", "Rower", "Góry", "Morze",
  "Książki", "Planszówki", "Gry", "Fotografia", "Sztuka", "Taniec",
  "Psy", "Koty", "Joga", "Wino", "Stand-up", "Programowanie",
] as const;
