"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Kto jest teraz w apce i GDZIE.
 *
 * Wartość mapy to id pary, w której ktoś aktualnie siedzi (albo null, gdy jest
 * w apce, ale nigdzie konkretnie). To rozróżnienie jest w paragrafie ważniejsze
 * niż samo „online": gra rusza tylko wtedy, gdy oboje jesteście w TEJ rozmowie,
 * więc „jest u Ciebie w rozmowie" to sygnał „zapraszaj teraz", a nie „kiedyś".
 */
export type Presence = Map<string, string | null>;

const EMPTY: Presence = new Map();

export function usePresence(
  meId: string | null,
  {
    room = null,
    enabled = true,
  }: {
    /** Pokój, w którym właśnie jestem — trafia do innych. */
    room?: string | null;
    /** false, gdy ktoś wyłączył pokazywanie aktywności. */
    enabled?: boolean;
  } = {},
): Presence {
  const [who, setWho] = useState<Presence>(EMPTY);

  useEffect(() => {
    if (!meId || !enabled) {
      setWho(EMPTY);
      return;
    }

    const supabase = createClient();
    const ch = supabase.channel("presence:global", {
      config: { presence: { key: meId } },
    });

    ch.on("presence", { event: "sync" }, () => {
      const next: Presence = new Map();
      const state = ch.presenceState<{ room?: string | null }>();
      for (const id of Object.keys(state)) {
        const metas = state[id];
        const last = metas?.[metas.length - 1];
        next.set(id, last?.room ?? null);
      }
      setWho(next);
    }).subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.track({ room, at: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(ch);
    };
  }, [meId, room, enabled]);

  useHeartbeat(meId, enabled);

  return who;
}

/**
 * Zapisuje „ostatnio widziany" do bazy.
 *
 * Obecność przez realtime znika w tej samej sekundzie, w której ktoś zamknie
 * kartę — a wtedy zostaje pytanie „to on wyszedł minutę temu, czy w zeszły
 * wtorek?". Bez tego szara kropka nic nie znaczy.
 */
function useHeartbeat(meId: string | null, enabled: boolean) {
  useEffect(() => {
    if (!meId || !enabled) return;
    const supabase = createClient();

    const beat = () => {
      supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", meId)
        .then(
          () => {},
          () => {},
        );
    };

    beat();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") beat();
    }, 60_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", beat);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", beat);
      beat(); // ostatni ślad przy wyjściu
    };
  }, [meId, enabled]);
}
