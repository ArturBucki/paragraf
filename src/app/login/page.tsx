"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    if (mode === "up") {
      const { error } = await supabase.auth.signUp({ email, password });
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
          className="rounded-xl border border-line bg-surface px-4 py-3"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Hasło (min. 6 znaków)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-line bg-surface px-4 py-3"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-coral px-4 py-3 font-bold text-[#06281A] disabled:opacity-60"
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
