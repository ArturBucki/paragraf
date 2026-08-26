"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

/**
 * Usunięcie konta. Świadomie bez „może zostaniesz?" i bez ukrywania —
 * to prawo użytkownika, a nie coś, co trzeba wyszarpać.
 * Zdjęcia kasujemy z magazynu jawnie, resztę zabiera kaskada w bazie.
 */
export function DangerZone({ userId, photos }: { userId: string; photos: string[] }) {
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    // Najpierw pliki — po usunięciu konta nie będzie już czym się uwierzytelnić.
    const paths = photos
      .map((url) => {
        const at = url.indexOf("/photos/");
        return at >= 0 ? url.slice(at + "/photos/".length) : null;
      })
      .filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("photos").remove(paths);

    const { error: rpcError } = await supabase.rpc("delete_my_account");
    if (rpcError) {
      setBusy(false);
      setError("Nie udało się usunąć konta. Napisz do nas, zrobimy to ręcznie.");
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <section className="flex flex-col gap-3 border-t border-line pt-5">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-inksoft">
        <Link href="/regulamin" className="underline">
          Regulamin
        </Link>
        <Link href="/prywatnosc" className="underline">
          Polityka prywatności
        </Link>
      </div>

      {step === "idle" ? (
        <button
          onClick={() => setStep("confirm")}
          className="flex items-center justify-center gap-2 rounded-xl bg-surface py-3 text-sm font-semibold text-coraldeep soft-1"
        >
          <Icon name="ban" className="h-4 w-4" /> Usuń konto
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4 soft-1">
          <p className="text-sm font-bold">Usunąć konto na zawsze?</p>
          <p className="text-[13px] leading-relaxed text-inksoft">
            Znikną: profil, zdjęcia, wszystkie pary, rozmowy i punkty połączenia.
            Tego nie da się cofnąć — nie mamy kopii, którą moglibyśmy przywrócić.
          </p>
          <p className="text-[12px] text-inksoft">
            Wpisz <b className="text-ink">USUWAM</b>, żeby potwierdzić.
          </p>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input"
            placeholder="USUWAM"
            autoComplete="off"
          />
          {error && <p className="text-[13px] font-semibold text-coraldeep">{error}</p>}
          <button
            onClick={remove}
            disabled={text.trim().toUpperCase() !== "USUWAM" || busy}
            className="rounded-xl bg-coral py-3 font-bold text-[rgb(var(--on-coral))] disabled:opacity-40"
          >
            {busy ? "Usuwam…" : "Usuń konto na zawsze"}
          </button>
          <button
            onClick={() => {
              setStep("idle");
              setText("");
              setError(null);
            }}
            className="rounded-xl py-2 text-sm font-semibold text-inksoft"
          >
            Zostawiam
          </button>
        </div>
      )}
    </section>
  );
}
