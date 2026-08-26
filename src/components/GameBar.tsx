"use client";

import type { Game } from "@/lib/games";
import { Icon } from "@/components/Icon";

/**
 * Pasek gry przy czacie — zawsze widoczny, bo to on niesie całą mechanikę pary.
 * Cztery stany, każdy w innym kolorze, żeby dało się je rozpoznać bez czytania:
 *   gotowe (mięta) → ona chce (fiolet/mięta) → Ty czekasz (koral) → nic (neutralny)
 */
export function GameBar({
  ready,
  invited,
  waiting,
  otherName,
  otherOnline,
  daily,
  onOpen,
  onStart,
  onToggle,
}: {
  ready: Game | null;
  invited: Game | null;
  waiting: Game | null;
  daily: Game | null;
  otherName: string;
  otherOnline: boolean;
  onOpen: () => void;
  onStart: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  // 1. OBOJE GOTOWI — najważniejszy moment w całej apce.
  if (ready) {
    return (
      <button
        onClick={() => onStart(ready.id)}
        className="mb-2 flex w-full items-center gap-3 rounded-2xl border-2 border-[#6FD3A6] bg-[#6FD3A6]/15 px-3 py-3 text-left transition active:scale-[0.99]"
      >
        <span className="relative flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#6FD3A6]/20">
          <Icon name={ready.icon} className="h-5 w-5 text-berry" />
          <span className="absolute inset-0 animate-ping rounded-xl bg-[#6FD3A6]/25" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold leading-tight">
            {ready.name}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold text-berry">
            <Ready label="Ty" on />
            <Ready label={otherName} on />
          </span>
        </span>
        <span className="flex-none rounded-full bg-[#6FD3A6] px-4 py-2 text-sm font-extrabold text-[#14211C]">
          START
        </span>
      </button>
    );
  }

  // 2. ONA CHCE — wystarczy dołączyć.
  if (invited) {
    return (
      <button
        onClick={() => onToggle(invited.id)}
        className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-berry/60 bg-berry/10 px-3 py-2.5 text-left transition active:scale-[0.99]"
      >
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-berry/15">
          <Icon name={invited.icon} className="h-5 w-5 text-berry" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold leading-tight">
            {invited.name}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold">
            <Ready label="Ty" on={false} />
            <Ready label={otherName} on />
          </span>
        </span>
        <span className="flex-none rounded-full bg-berry px-3.5 py-2 text-xs font-extrabold text-[#14211C]">
          Wchodzę
        </span>
      </button>
    );
  }

  // 3. TY CZEKASZ na drugą osobę.
  if (waiting) {
    return (
      <div className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-coral/50 bg-coral/10 px-3 py-2.5">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-coral/15">
          <Icon name={waiting.icon} className="h-5 w-5 text-coraldeep" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold leading-tight">
            {waiting.name}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold">
            <Ready label="Ty" on />
            <Ready label={otherName} on={false} />
          </span>
        </span>
        <button
          onClick={() => onToggle(waiting.id)}
          className="flex-none rounded-full border border-line px-3 py-1.5 text-[11px] font-bold text-inksoft"
        >
          Anuluj
        </button>
      </div>
    );
  }

  // 4. NIC NIE WISI — zaproszenie do wspólnej gry.
  return (
    <button
      onClick={onOpen}
      className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5 text-left transition active:scale-[0.99]"
    >
      <span
        className="grid h-10 w-10 flex-none place-items-center rounded-xl"
        style={{ background: daily ? `${daily.accent}22` : "rgb(var(--bg))", color: daily?.accent }}
      >
        <Icon name={daily ? daily.icon : "gamepad"} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-tight">
          {daily ? `Gra dnia: ${daily.name}` : "Zagrajcie razem"}
        </span>
        <span className="block text-[11px] text-inksoft">
          {otherOnline
            ? `${otherName} jest teraz online — dobry moment`
            : "dziś z bonusem punktowym"}
        </span>
      </span>
      <span className="flex-none rounded-full bg-coral px-3.5 py-2 text-xs font-extrabold text-[#14211C]">
        Wybierz
      </span>
    </button>
  );
}

/** Znacznik gotowości jednej osoby — kropka + imię. */
function Ready({ label, on }: { label: string; on: boolean }) {
  return (
    <span className={`flex items-center gap-1 ${on ? "text-berry" : "text-inksoft"}`}>
      <span
        className={`grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] font-bold ${
          on ? "bg-[#6FD3A6] text-[#14211C]" : "border border-line"
        }`}
      >
        {on ? "✓" : ""}
      </span>
      <span className="max-w-[70px] truncate">{label}</span>
    </span>
  );
}
