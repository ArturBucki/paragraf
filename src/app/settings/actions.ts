"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AvatarSpec } from "@/lib/types";
import { GENDERS, LOOKING_FOR, INTERESTS } from "@/lib/types";

const PALETTES: AvatarSpec[] = [
  { skin: "#F3C9A8", hair: "#B07C46", cloth: "#5E9E96", bg: "#F7D8C4", style: "wavy" },
  { skin: "#E7B187", hair: "#33261F", cloth: "#B25E3B", bg: "#C9BAE6", style: "short", stubble: true },
  { skin: "#EEC099", hair: "#241A20", cloth: "#D35C82", bg: "#F5D592", style: "bangs" },
  { skin: "#E9B48C", hair: "#6B4A2B", cloth: "#4E7FB0", bg: "#DCE7F3", style: "short" },
  { skin: "#F0C6A0", hair: "#8A5A2B", cloth: "#C0518A", bg: "#F3DCE8", style: "wavy" },
  { skin: "#D9A47A", hair: "#1F1712", cloth: "#3E6C8E", bg: "#CFE0EC", style: "short", stubble: true },
  { skin: "#F5D3B3", hair: "#8A3B2E", cloth: "#5E9E96", bg: "#F2E3CE", style: "wavy" },
  { skin: "#EFC6A6", hair: "#4A2E1F", cloth: "#8E5BA6", bg: "#EADDF2", style: "bangs" },
];

async function me() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Zapis profilu z ustawień. */
export async function updateProfile(formData: FormData) {
  const { supabase, user } = await me();

  const str = (k: string, max = 120) =>
    String(formData.get(k) ?? "").trim().slice(0, max) || null;

  const gender = str("gender");
  const looking = str("looking_for");
  const height = Number(formData.get("height_cm") || 0) || null;

  // Wybory ze słowników walidujemy — formularz można podmienić po stronie klienta.
  const interests = formData
    .getAll("interests")
    .map(String)
    .filter((i) => (INTERESTS as readonly string[]).includes(i))
    .slice(0, 8);

  await supabase
    .from("profiles")
    .update({
      name: str("name", 40),
      age: Number(formData.get("age") || 0) || null,
      bio: str("bio", 300),
      city: str("city", 60),
      job: str("job", 60),
      education: str("education", 60),
      height_cm: height && height >= 120 && height <= 230 ? height : null,
      gender: gender && (GENDERS as readonly string[]).includes(gender) ? gender : null,
      looking_for:
        looking && (LOOKING_FOR as readonly string[]).includes(looking) ? looking : null,
      interests,
    })
    .eq("id", user.id);

  revalidatePath("/settings");
  redirect("/settings?zapisano=1");
}

/** Zapis listy zdjęć (kolejność ma znaczenie — pierwsze jest główne). */
export async function savePhotos(photos: string[]) {
  const { supabase, user } = await me();
  const clean = photos.filter((p) => typeof p === "string").slice(0, 6);
  await supabase.from("profiles").update({ photos: clean }).eq("id", user.id);
  revalidatePath("/settings");
  return { ok: true };
}

/** Losuje nowy wygląd rysowanego awatara (gdy ktoś nie chce zdjęcia). */
export async function rerollAvatar() {
  const { supabase, user } = await me();
  const avatar = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  await supabase.from("profiles").update({ avatar }).eq("id", user.id);
  revalidatePath("/settings");
  redirect("/settings");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
