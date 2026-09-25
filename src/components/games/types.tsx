import type { RealtimeChannel } from "@supabase/supabase-js";

export type GameProps = {
  matchId: string;
  /** Rozstrzyga, kto jest „pierwszy" — np. kto rysuje, a kto zgaduje. */
  isA: boolean;
  otherName: string;
  channel: RealtimeChannel | null;
  onFinish: () => void;

  /*
   * Poniższe są dla gier, w których odpowiada się ZWYKŁYM czatem, a nie
   * osobnym polem w grze. Dzięki temu odpowiedzi zostają w rozmowie na stałe,
   * zamiast znikać razem z ekranem gry.
   */
  /** Wiadomości pary — stąd gra wie, kto już odpowiedział. */
  messages?: { id: number; sender: string; body: string }[];
  meId?: string;
  /** Wrzuca pytanie do rozmowy jako trwałą wiadomość. */
  ask?: (text: string) => void;
  /**
   * Ziarno tej konkretnej rozgrywki — takie samo u obojga, inne za każdym
   * razem. Bez niego para dostawała w kółko tę samą zagadkę i to samo hasło.
   */
  seed?: number;
};

/** Wspólny ekran wygranej — ten sam rytm zakończenia w każdej grze. */
export function Won({
  title,
  sub,
  onFinish,
}: {
  title: string;
  sub: string;
  onFinish: () => void;
}) {
  return (
    <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-[#6FD3A6] bg-berry/12 p-6 text-center">
      <p className="font-display text-lg font-extrabold">{title}</p>
      <p className="text-sm text-inksoft">{sub}</p>
      <button
        onClick={onFinish}
        className="mt-1 rounded-xl bg-coral px-6 py-3 font-bold text-[rgb(var(--on-coral))]"
      >
        Odbierzcie punkty
      </button>
    </div>
  );
}

/** Deterministyczny wybór z listy — oboje dostają to samo, bez losowania u klienta. */
export function pickFor<T>(items: T[], seed: string, salt = 0): T {
  let sum = salt;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return items[sum % items.length];
}
