"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

const REASONS = [
  "Fałszywy profil",
  "Obraźliwe zachowanie",
  "Treści seksualne",
  "Spam lub oszustwo",
  "Osoba niepełnoletnia",
  "Coś innego",
] as const;

/**
 * Blokowanie i zgłaszanie — dostępne wszędzie tam, gdzie widzisz drugą osobę.
 * Zablokowany nie dostaje żadnego sygnału: po prostu znikacie sobie nawzajem.
 */
export function SafetyMenu({
  otherId,
  otherName,
  matchId,
}: {
  otherId: string;
  otherName: string;
  matchId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "report" | "block">("menu");
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setMode("menu");
    setReason(null);
    setNote("");
    setDone(null);
  }

  async function block() {
    setBusy(true);
    const supabase = createClient();
    const { data: me } = await supabase.auth.getUser();
    if (me?.user) {
      await supabase.from("blocks").insert({ blocker: me.user.id, blocked: otherId });
    }
    setBusy(false);
    close();
    router.push("/matches");
    router.refresh();
  }

  async function report() {
    if (!reason) return;
    setBusy(true);
    const supabase = createClient();
    const { data: me } = await supabase.auth.getUser();
    if (me?.user) {
      await supabase.from("reports").insert({
        reporter: me.user.id,
        reported: otherId,
        match_id: matchId ?? null,
        reason,
        note: note.trim() || null,
      });
    }
    setBusy(false);
    setDone("Zgłoszenie przyjęte. Sprawdzimy je najszybciej, jak się da.");
    setMode("menu");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Więcej opcji: ${otherName}`}
        className="grid h-9 w-9 flex-none place-items-center rounded-full text-inksoft transition active:scale-95"
      >
        <Icon name="more" className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-[2px]"
          onClick={close}
        >
          <div
            className="w-full rounded-t-[28px] bg-bg px-4 pb-8 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />

            {done ? (
              <div className="flex flex-col gap-3 pb-2">
                <p className="text-sm font-semibold text-berry">{done}</p>
                <button
                  onClick={close}
                  className="rounded-xl bg-surface py-3 font-semibold soft-1"
                >
                  Zamknij
                </button>
              </div>
            ) : mode === "menu" ? (
              <div className="flex flex-col gap-2 pb-2">
                <p className="px-1 pb-1 text-sm font-bold">{otherName}</p>

                <button
                  onClick={() => setMode("report")}
                  className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 text-left soft-1"
                >
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-coral/15 text-coraldeep">
                    <Icon name="flag" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">Zgłoś</span>
                    <span className="block text-[11px] text-inksoft">
                      Sprawdzimy profil. Druga osoba się nie dowie.
                    </span>
                  </span>
                </button>

                <button
                  onClick={() => setMode("block")}
                  className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 text-left soft-1"
                >
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-surface2 text-inksoft">
                    <Icon name="ban" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">Zablokuj</span>
                    <span className="block text-[11px] text-inksoft">
                      Znikacie sobie nawzajem — bez powiadomienia.
                    </span>
                  </span>
                </button>

                <button
                  onClick={close}
                  className="mt-1 rounded-xl py-3 text-sm font-semibold text-inksoft"
                >
                  Anuluj
                </button>
              </div>
            ) : mode === "block" ? (
              <div className="flex flex-col gap-3 pb-2">
                <p className="text-sm font-bold">Zablokować {otherName}?</p>
                <p className="text-[13px] leading-relaxed text-inksoft">
                  Wasza para i rozmowa znikną. Nie zobaczycie się nawzajem w
                  odkrywaniu. Druga osoba nie dostanie żadnej informacji.
                </p>
                <button
                  onClick={block}
                  disabled={busy}
                  className="rounded-xl bg-coral py-3 font-bold text-[rgb(var(--on-coral))] disabled:opacity-60"
                >
                  {busy ? "Blokuję…" : "Tak, zablokuj"}
                </button>
                <button
                  onClick={() => setMode("menu")}
                  className="rounded-xl py-2.5 text-sm font-semibold text-inksoft"
                >
                  Wróć
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-2">
                <p className="text-sm font-bold">Co jest nie tak?</p>

                <div className="flex flex-wrap gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`rounded-full border-2 px-3.5 py-2 text-[13px] font-semibold transition ${
                        reason === r
                          ? "border-coral bg-coral/12 text-ink"
                          : "border-[rgb(var(--ink)/0.07)] bg-surface text-inksoft"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Możesz dopisać szczegóły (nieobowiązkowe)."
                  className="input"
                />

                <button
                  onClick={report}
                  disabled={!reason || busy}
                  className="rounded-xl bg-coral py-3 font-bold text-[rgb(var(--on-coral))] disabled:opacity-50"
                >
                  {busy ? "Wysyłam…" : "Wyślij zgłoszenie"}
                </button>

                <p className="px-1 text-[11px] leading-relaxed text-inksoft">
                  Zgłoszenie trafia do nas, nie do drugiej osoby. Jeśli komuś
                  dzieje się krzywda, zadzwoń pod 112.
                </p>

                <button
                  onClick={() => setMode("menu")}
                  className="rounded-xl py-2.5 text-sm font-semibold text-inksoft"
                >
                  Wróć
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
