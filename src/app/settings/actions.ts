"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AvatarSpec } from "@/lib/types";

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

/** Zapis danych profilu z ustawień. */
export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const age = Number(formData.get("age") || 0) || null;
  const bio = String(formData.get("bio") || "").trim();
  const games = formData.getAll("games").map(String);

  await supabase
    .from("profiles")
    .update({ name, age, bio, games })
    .eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/swipe");
  redirect("/settings?zapisano=1");
}

/** Losuje nowy wygląd awatara (do czasu wprowadzenia prawdziwych zdjęć). */
export async function rerollAvatar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
