"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AvatarSpec } from "@/lib/types";

const AVATAR_PALETTES: AvatarSpec[] = [
  { skin: "#F3C9A8", hair: "#B07C46", cloth: "#5E9E96", bg: "#F7D8C4", style: "wavy" },
  { skin: "#E7B187", hair: "#33261F", cloth: "#B25E3B", bg: "#C9BAE6", style: "short", stubble: true },
  { skin: "#EEC099", hair: "#241A20", cloth: "#D35C82", bg: "#F5D592", style: "bangs" },
  { skin: "#E9B48C", hair: "#6B4A2B", cloth: "#4E7FB0", bg: "#DCE7F3", style: "short" },
  { skin: "#F0C6A0", hair: "#8A5A2B", cloth: "#C0518A", bg: "#F3DCE8", style: "wavy" },
];

function randomAvatar(): AvatarSpec {
  return AVATAR_PALETTES[Math.floor(Math.random() * AVATAR_PALETTES.length)];
}

// Zapis profilu (onboarding / edycja).
export async function saveProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const age = Number(formData.get("age") || 0) || null;
  const bio = String(formData.get("bio") || "").trim();
  const games = formData.getAll("games").map(String);

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    name,
    age,
    bio,
    games,
    avatar: randomAvatar(),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/swipe");
  redirect("/swipe");
}

// Polubienie profilu. Trigger w bazie tworzy match przy wzajemności.
export async function likeProfile(likedId: string): Promise<{ matched: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("likes").insert({ liker: user.id, liked: likedId });

  // Sprawdź, czy powstał match z tą osobą.
  const { data: matches } = await supabase
    .from("matches")
    .select("id")
    .or(
      `and(user_a.eq.${user.id},user_b.eq.${likedId}),and(user_a.eq.${likedId},user_b.eq.${user.id})`,
    )
    .limit(1);

  return { matched: !!matches && matches.length > 0 };
}

// Pominięcie profilu (na razie tylko zapis, żeby nie pokazywać ponownie).
export async function passProfile(passedId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("passes").insert({ passer: user.id, passed: passedId });
}
