"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { enablePush, disablePush, pushState } from "@/lib/push";

/**
 * Włącznik powiadomień.
 *
 * Celowo NIE pytamy o zgodę przy wejściu do apki — przeglądarka daje jedną
 * szansę na całe życie konta i zmarnowanie jej na powitalne okienko oznacza,
 * że potem nie da się już nic wysłać. Pytamy tutaj, gdy ktoś sam kliknie.
 */
export function PushSetting({ userId }: { userId: string }) {
  const [state, setState] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setState(pushState());
  }, []);

  if (state === "unsupported") {
    return (
      <p className="rounded-2xl bg-surface p-3 text-[12px] leading-relaxed text-inksoft soft-1">
        Ta przeglądarka nie obsługuje powiadomień. Na iPhonie działają dopiero
        po dodaniu paragrafu do ekranu głównego.
      </p>
    );
  }

  const on = state === "granted";

  async function toggle() {
    setBusy(true);
    if (on) {
      await disablePush();
      setState("default");
    } else {
      const ok = await enablePush(userId);
      setState(ok ? "granted" : pushState());
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 soft-1">
      <span
        className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${
          on ? "bg-berry/15 text-berry" : "bg-coral/15 text-coraldeep"
        }`}
      >
        <Icon name="spark" className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">
          {on ? "Powiadomienia włączone" : "Powiadomienia o grach"}
        </p>
        <p className="text-[11px] leading-relaxed text-inksoft">
          {state === "denied"
            ? "Zablokowane w przeglądarce — odblokuj je w ustawieniach strony."
            : on
              ? "Dostajesz sygnał, gdy ktoś zaprosi Cię do gry albo napisze."
              : "Bez nich zaproszenie do gry czeka, aż sam wejdziesz do apki."}
        </p>
      </div>

      {state !== "denied" && (
        <button
          onClick={toggle}
          disabled={busy}
          className={`flex-none rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-50 ${
            on
              ? "bg-surface2 text-inksoft"
              : "bg-coral text-[rgb(var(--on-coral))]"
          }`}
        >
          {busy ? "…" : on ? "Wyłącz" : "Włącz"}
        </button>
      )}
    </div>
  );
}
