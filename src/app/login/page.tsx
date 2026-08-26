"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Zgoda jest warunkiem założenia konta — 18+ i akceptacja obu dokumentów.
  const [agreed, setAgreed] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    if (mode === "up") {
      if (!agreed) {
        setMsg("Zaznacz zgodę, żeby założyć konto.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        // Ślad zgody zostaje przy koncie — kiedy i na co ktoś się zgodził.
        options: {
          data: {
            terms_accepted_at: new Date().toISOString(),
            adult_confirmed: true,
          },
        },
      });
      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }
      // Jeśli potwierdzanie e-maila jest wyłączone, sesja jest od razu — idziemy dalej.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/onboarding");
        return;
      }
      setMsg("Sprawdź skrzynkę i potwierdź adres e-mail, potem zaloguj się.");
      setMode("in");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }
    router.push("/swipe");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-5 px-6">
      <h1 className="font-display text-3xl font-extrabold">
        {mode === "in" ? "Zaloguj się" : "Załóż konto"}
      </h1>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Hasło (min. 6 znaków)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        {mode === "up" && (
          <label className="flex items-start gap-2.5 px-1 text-[12px] leading-relaxed text-inksoft">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-none accent-[rgb(var(--coral))]"
            />
            <span>
              Mam ukończone 18 lat, akceptuję{" "}
              <Link href="/regulamin" className="underline">
                regulamin
              </Link>{" "}
              i{" "}
              <Link href="/prywatnosc" className="underline">
                politykę prywatności
              </Link>
              .
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={loading || (mode === "up" && !agreed)}
          className="rounded-xl bg-coral px-4 py-3 font-bold text-[rgb(var(--on-coral))] disabled:opacity-50"
        >
          {loading ? "…" : mode === "in" ? "Wejdź" : "Utwórz konto"}
        </button>
      </form>

      {msg && <p className="text-sm text-inksoft">{msg}</p>}

      <button
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="text-sm text-coraldeep underline underline-offset-4"
      >
        {mode === "in"
          ? "Nie masz konta? Załóż je"
          : "Masz już konto? Zaloguj się"}
      </button>
    </main>
  );
}
