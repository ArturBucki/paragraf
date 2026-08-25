"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gameById } from "@/lib/games";

// Zgoda na losowanie trzymana jako pseudo-gra w tej samej tabeli.
const RANDOM_ID = "__random__";

type Ok = { ok: true } | { ok: false; error: string };

async function loadMatch(matchId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, match: null };

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    return { supabase, user, match: null };
  }
  return { supabase, user, match };
}

/** Zaznacza/odznacza chęć zagrania. Gra rusza, gdy oboje chcą. */
export async function toggleWantGame(
  matchId: string,
  gameId: string,
): Promise<Ok> {
  const { supabase, user, match } = await loadMatch(matchId);
  if (!user || !match) return { ok: false, error: "Brak dostępu." };

  // "__random__" to nie gra, tylko zgoda na losowanie — nie ma progu odblokowania.
  if (gameId !== RANDOM_ID) {
    const game = gameById(gameId);
    if (!game) return { ok: false, error: "Nie ma takiej gry." };
    if ((match.points ?? 0) < game.unlock) {
      return { ok: false, error: `Ta gra odblokuje się przy ${game.unlock} pkt.` };
    }
  }

  const isA = match.user_a === user.id;
  const column = isA ? "a_wants" : "b_wants";

  const { data: row } = await supabase
    .from("match_games")
    .select("*")
    .eq("match_id", matchId)
    .eq("game_id", gameId)
    .maybeSingle();

  const current = row ? Boolean(row[column]) : false;

  const { error } = await supabase.from("match_games").upsert(
    {
      match_id: matchId,
      game_id: gameId,
      a_wants: isA ? !current : (row?.a_wants ?? false),
      b_wants: isA ? (row?.b_wants ?? false) : !current,
      played: row?.played ?? false,
      state: row?.state ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id,game_id" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/matches/${matchId}`);
  return { ok: true };
}

/** Kończy grę: przyznaje punkty połączenia raz i odblokowuje czat. */
export async function finishGame(
  matchId: string,
  gameId: string,
): Promise<{ ok: boolean; awarded: number; points: number; unlocked: string[] }> {
  const { supabase, user, match } = await loadMatch(matchId);
  if (!user || !match) return { ok: false, awarded: 0, points: 0, unlocked: [] };

  const game = gameById(gameId);
  if (!game) return { ok: false, awarded: 0, points: match.points ?? 0, unlocked: [] };

  const { data: row } = await supabase
    .from("match_games")
    .select("played")
    .eq("match_id", matchId)
    .eq("game_id", gameId)
    .maybeSingle();

  // Punkty tylko raz za daną grę — chroni przed podwójnym naliczeniem,
  // gdy obie osoby zakończą grę w tym samym momencie.
  if (row?.played) {
    return { ok: true, awarded: 0, points: match.points ?? 0, unlocked: [] };
  }

  const before = match.points ?? 0;
  const after = before + game.pts;

  await supabase
    .from("match_games")
    .upsert(
      {
        match_id: matchId,
        game_id: gameId,
        played: true,
        a_wants: false,
        b_wants: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,game_id" },
    );

  await supabase.from("matches").update({ points: after }).eq("id", matchId);

  // Po rozegranej grze zerujemy też zgodę na losowanie, żeby nie startowało w kółko.
  await supabase
    .from("match_games")
    .update({ a_wants: false, b_wants: false })
    .eq("match_id", matchId)
    .eq("game_id", RANDOM_ID);

  const { GAMES } = await import("@/lib/games");
  const unlocked = GAMES.filter((g) => g.unlock > before && g.unlock <= after).map(
    (g) => g.name,
  );

  // Ślad w rozmowie, żeby oboje widzieli, co się wydarzyło.
  await supabase.from("messages").insert({
    match_id: matchId,
    sender: user.id,
    body: `__system__Zagraliście w „${game.name}" · +${game.pts} pkt połączenia`,
  });

  revalidatePath(`/matches/${matchId}`);
  return { ok: true, awarded: game.pts, points: after, unlocked };
}

/** Wysyła wiadomość w rozmowie pary. */
export async function sendMessage(matchId: string, body: string): Promise<Ok> {
  const text = body.trim();
  if (!text) return { ok: false, error: "Pusta wiadomość." };
  if (text.length > 2000) return { ok: false, error: "Wiadomość jest za długa." };

  const { supabase, user, match } = await loadMatch(matchId);
  if (!user || !match) return { ok: false, error: "Brak dostępu." };

  const { error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender: user.id, body: text });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
