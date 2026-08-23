export type Profile = {
  id: string;
  name: string;
  age: number | null;
  bio: string | null;
  games: string[];
  avatar: AvatarSpec | null;
  created_at?: string;
};

// Specyfikacja ilustrowanego awatara (do czasu wprowadzenia prawdziwych zdjęć).
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
