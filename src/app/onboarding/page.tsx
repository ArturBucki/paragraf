import { redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import { saveProfile } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Onboarding() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-6 py-10">
      <h1 className="font-display text-3xl font-extrabold">Twój profil</h1>
      <p className="text-inksoft">
        Powiedz coś o sobie i zaznacz, w co lubisz grać — to zobaczą inni.
      </p>

      <form action={saveProfile} className="flex flex-col gap-4">
        <input
          name="name"
          required
          defaultValue={profile?.name ?? ""}
          placeholder="Imię"
          className="rounded-xl border border-line bg-surface px-4 py-3"
        />
        <input
          name="age"
          type="number"
          min={18}
          max={120}
          defaultValue={profile?.age ?? ""}
          placeholder="Wiek"
          className="rounded-xl border border-line bg-surface px-4 py-3"
        />
        <textarea
          name="bio"
          rows={3}
          defaultValue={profile?.bio ?? ""}
          placeholder="Kilka słów o sobie…"
          className="rounded-xl border border-line bg-surface px-4 py-3"
        />

        <button
          type="submit"
          className="mt-2 rounded-xl bg-coral px-4 py-3 font-bold text-[rgb(var(--on-coral))]"
        >
          Zapisz i przejdź do swipe
        </button>
      </form>
    </main>
  );
}
