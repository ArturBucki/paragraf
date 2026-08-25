import { redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import { GAMES } from "@/lib/games";
import { Icon } from "@/components/Icon";
import { Avatar, DEFAULT_AVATAR } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { updateProfile, rerollAvatar, signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function Settings({
  searchParams,
}: {
  searchParams: { zapisano?: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { count: matchCount } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 pb-24 pt-6">
        <h1 className="font-display text-2xl font-extrabold">Twój profil</h1>

        {/* podgląd + zmiana wyglądu */}
        <section className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full">
            <Avatar spec={profile?.avatar ?? DEFAULT_AVATAR} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-xl font-extrabold">
              {profile?.name ?? "Bez imienia"}
              {profile?.age ? `, ${profile.age}` : ""}
            </div>
            <div className="text-xs text-inksoft">{user.email}</div>
            <div className="mt-1 font-mono text-[11px] text-gold">
              {matchCount ?? 0} {matchCount === 1 ? "para" : "par"}
            </div>
          </div>
          <form action={rerollAvatar}>
            <button className="rounded-full border border-line px-3 py-2 text-xs font-bold">
              <span className="flex items-center gap-1.5"><Icon name="dice" className="h-4 w-4" /> Wygląd</span>
            </button>
          </form>
        </section>

        {searchParams.zapisano && (
          <p className="rounded-xl border border-[#8FE3C2] bg-[#8FE3C2]/12 px-4 py-2.5 text-sm font-semibold text-berry">
            Zapisano zmiany ✓
          </p>
        )}

        <form action={updateProfile} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wide text-inksoft">
              Imię
            </span>
            <input
              name="name"
              required
              defaultValue={profile?.name ?? ""}
              className="rounded-xl border border-line bg-surface px-4 py-3"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wide text-inksoft">
              Wiek
            </span>
            <input
              name="age"
              type="number"
              min={18}
              max={120}
              defaultValue={profile?.age ?? ""}
              className="rounded-xl border border-line bg-surface px-4 py-3"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wide text-inksoft">
              O sobie
            </span>
            <textarea
              name="bio"
              rows={3}
              maxLength={200}
              defaultValue={profile?.bio ?? ""}
              placeholder="Kilka słów — to widzą inni na karcie."
              className="rounded-xl border border-line bg-surface px-4 py-3"
            />
          </label>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-inksoft">
              W co lubisz grać
            </p>
            <p className="mb-3 text-xs text-inksoft">
              To pokazuje się na Twojej karcie — inni od razu widzą, co możecie robić.
            </p>
            <div className="flex flex-col gap-2">
              {GAMES.map((g) => (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 has-[:checked]:border-coral"
                >
                  <input
                    type="checkbox"
                    name="games"
                    value={g.id}
                    defaultChecked={profile?.games?.includes(g.id) ?? false}
                    className="h-4 w-4 accent-[#FF6B4A]"
                  />
                  <Icon name={g.icon} className="h-5 w-5 text-inksoft" />
                  <span className="flex-1 font-semibold">{g.name}</span>
                  <span className="font-mono text-[10px] text-gold">+{g.pts}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-coral px-4 py-3.5 font-bold text-[#06281A]"
          >
            Zapisz zmiany
          </button>
        </form>

        <section className="mt-2 flex flex-col gap-2 border-t border-line pt-5">
          <form action={signOut}>
            <button className="w-full rounded-xl border border-line px-4 py-3 font-semibold text-inksoft">
              Wyloguj się
            </button>
          </form>
          <p className="text-center text-[11px] text-inksoft">
            paragraf · wersja wczesna
          </p>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
