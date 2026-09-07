import { sinceLabel } from "@/lib/games";
import type { Profile } from "@/lib/types";
import type { Presence } from "@/lib/usePresence";

/**
 * Cztery stany aktywności, od najmocniejszego do żadnego.
 *
 * Celowo unikamy „była/był" — paragraf ma osoby o różnej tożsamości i nie
 * chcemy zgadywać rodzaju gramatycznego z pola gender. „Ostatnio: 12 min temu"
 * brzmi neutralnie i nie potyka się o polską odmianę.
 */
export type Activity = {
  /** room = jest w TEJ rozmowie, app = w apce gdzie indziej, seen = ślad, none = cisza */
  kind: "room" | "app" | "seen" | "none";
  /** Pełne zdanie — nagłówek rozmowy. */
  label: string | null;
  /** Skrót do ciasnych miejsc, np. listy par (tam gdzie zwykle jest godzina). */
  short: string | null;
};

const NONE: Activity = { kind: "none", label: null, short: null };

export function activityOf(
  profile: Profile | null | undefined,
  presence: Presence,
  /** Podaj id pary, jeśli chcesz odróżnić „jest tutaj" od „jest w apce". */
  matchId?: string | null,
): Activity {
  if (!profile) return NONE;

  // Kto wyłączył pokazywanie aktywności, ten znika — także dla nas.
  if (profile.show_activity === false) return NONE;

  if (presence.has(profile.id)) {
    const room = presence.get(profile.id) ?? null;
    if (matchId && room === matchId) {
      return { kind: "room", label: "jest tu z Tobą", short: "tu z Tobą" };
    }
    return {
      kind: "app",
      label: matchId ? "jest w apce, ale nie w tej rozmowie" : "jest w apce",
      short: "w apce",
    };
  }

  const since = sinceLabel(profile.last_seen);
  if (since) return { kind: "seen", label: `ostatnio: ${since}`, short: since };

  return NONE;
}

/** Kolor kropki przy zdjęciu — ten sam język w całej apce. */
export function dotClass(kind: Activity["kind"]): string | null {
  if (kind === "room") return "bg-berry";
  if (kind === "app") return "bg-gold";
  return null;
}
