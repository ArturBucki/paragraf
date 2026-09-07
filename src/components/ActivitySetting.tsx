"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

/**
 * „Pokazuj moją aktywność" — na zasadzie wzajemności.
 *
 * Wyłączone znaczy: nie widzą Cię, ale Ty też nie widzisz ich. Bez tego
 * powstaje asymetria, w której ktoś obserwuje z ukrycia — a to jest dokładnie
 * ta rzecz, przed którą to ustawienie ma chronić.
 */
export function ActivitySetting({
  userId,
  initial,
}: {
  userId: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !on;
    setOn(next); // od razu — ustawienia mają być natychmiastowe
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        show_activity: next,
        // Wyłączenie ma zacierać ślad, a nie tylko przestać go odświeżać.
        ...(next ? {} : { last_seen: null }),
      })
      .eq("id", userId);
    if (error) setOn(!next);
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 soft-1">
      <span
        className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${
          on ? "bg-berry/15 text-berry" : "bg-surface2 text-inksoft"
        }`}
      >
        <Icon name={on ? "eye" : "ban"} className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">
          {on ? "Widać, kiedy jesteś" : "Twoja aktywność ukryta"}
        </p>
        <p className="text-[11px] leading-relaxed text-inksoft">
          {on
            ? "Pary widzą, że jesteś w apce i kiedy byłeś ostatnio. Ty widzisz to samo u nich."
            : "Nikt nie widzi, kiedy jesteś — ale Ty też nie widzisz nikogo."}
        </p>
      </div>

      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={on}
        className={`relative h-7 w-12 flex-none rounded-full transition disabled:opacity-50 ${
          on ? "bg-berry" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            on ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
