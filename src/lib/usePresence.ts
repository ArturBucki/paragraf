"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Kto jest teraz w apce.
 * Jeden wspólny kanał obecności — dzięki temu widać, z kim można zagrać OD RAZU,
 * zamiast zostawiać zaproszenie i czekać w nieskończoność.
 */
export function usePresence(meId: string | null) {
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!meId) return;
    const supabase = createClient();
    const ch = supabase.channel("presence:global", {
      config: { presence: { key: meId } },
    });

    ch.on("presence", { event: "sync" }, () => {
      setOnline(new Set(Object.keys(ch.presenceState())));
    }).subscribe((status) => {
      if (status === "SUBSCRIBED") ch.track({ online_at: new Date().toISOString() });
    });

    return () => {
      supabase.removeChannel(ch);
    };
  }, [meId]);

  return online;
}
