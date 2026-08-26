import { redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ProfileForm } from "@/components/ProfileForm";
import type { Profile } from "@/lib/types";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = createClient();

  const [{ data }, { count: matchCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
  ]);

  const profile = (data ?? null) as Profile | null;

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 pb-28 pt-6">
        <header className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl soft-1">
            <ProfilePhoto profile={profile} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-extrabold">
              {profile?.name ?? "Twój profil"}
              {profile?.age ? `, ${profile.age}` : ""}
            </h1>
            <p className="truncate text-xs text-inksoft">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <VerifiedBadge verified={profile?.verified ?? false} />
              <span className="font-mono text-[11px] text-gold">
                {matchCount ?? 0} {matchCount === 1 ? "para" : "par"}
              </span>
            </div>
          </div>
        </header>

        <a
          href="/profil/podglad"
          className="flex items-center gap-3 rounded-2xl bg-surface p-3 soft-1 transition active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-coral/15 text-coraldeep">
            <Icon name="eye" className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Zobacz, jak widzą Cię inni</span>
            <span className="block text-[11px] text-inksoft">
              Karta w swipe i pełny profil — dokładnie tak, jak u nich
            </span>
          </span>
          <Icon name="back" className="h-4 w-4 flex-none rotate-180 text-inksoft" />
        </a>

        <PhotoUploader userId={user.id} initial={profile?.photos ?? []} />

        <ProfileForm
          userId={user.id}
          profile={profile}
          photoCount={profile?.photos?.length ?? 0}
        />

        <section className="flex flex-col gap-2 border-t border-line pt-5">
          <form action={signOut}>
            <button className="w-full rounded-xl bg-surface px-4 py-3 font-semibold text-inksoft soft-1">
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
