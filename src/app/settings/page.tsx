import { redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { GENDERS, LOOKING_FOR, INTERESTS, type Profile } from "@/lib/types";
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

  const [{ data }, { count: matchCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
  ]);

  const profile = (data ?? null) as Profile | null;

  // Ile z profilu jest wypełnione — konkretny powód, żeby go dokończyć.
  const filled = [
    profile?.photos?.length,
    profile?.bio,
    profile?.city,
    profile?.job,
    profile?.gender,
    profile?.looking_for,
    profile?.interests?.length,
  ].filter(Boolean).length;
  const completeness = Math.round((filled / 7) * 100);

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 pb-28 pt-6">
        <header className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-line">
            <ProfilePhoto profile={profile} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-extrabold">
              {profile?.name ?? "Twój profil"}
              {profile?.age ? `, ${profile.age}` : ""}
            </h1>
            <p className="truncate text-xs text-inksoft">{user.email}</p>
            <p className="mt-1 font-mono text-[11px] text-gold">
              {matchCount ?? 0} {matchCount === 1 ? "para" : "par"}
            </p>
          </div>
        </header>

        {/* uzupełnienie profilu */}
        <section className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold">Profil uzupełniony w {completeness}%</span>
            {completeness < 100 && (
              <span className="text-inksoft">więcej = więcej matchy</span>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-coral transition-all duration-500"
              style={{ width: `${Math.max(6, completeness)}%` }}
            />
          </div>
        </section>

        {searchParams.zapisano && (
          <p className="rounded-xl border border-[#8FE3C2] bg-[#8FE3C2]/12 px-4 py-2.5 text-sm font-semibold text-berry">
            Zapisano zmiany ✓
          </p>
        )}

        <PhotoUploader userId={user.id} initial={profile?.photos ?? []} />

        {(profile?.photos?.length ?? 0) === 0 && (
          <form action={rerollAvatar}>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-inksoft">
              <Icon name="dice" className="h-4 w-4" /> Wylosuj inny awatar
            </button>
          </form>
        )}

        <form action={updateProfile} className="flex flex-col gap-5">
          <Field label="Imię">
            <input
              name="name"
              required
              maxLength={40}
              defaultValue={profile?.name ?? ""}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Wiek">
              <input
                name="age"
                type="number"
                min={18}
                max={120}
                defaultValue={profile?.age ?? ""}
                className="input"
              />
            </Field>
            <Field label="Wzrost (cm)">
              <input
                name="height_cm"
                type="number"
                min={120}
                max={230}
                placeholder="—"
                defaultValue={profile?.height_cm ?? ""}
                className="input"
              />
            </Field>
          </div>

          <Field label="O sobie">
            <textarea
              name="bio"
              rows={3}
              maxLength={300}
              defaultValue={profile?.bio ?? ""}
              placeholder="Kilka zdań — to widzą inni na karcie."
              className="input"
            />
          </Field>

          <Field label="Miasto">
            <input
              name="city"
              maxLength={60}
              defaultValue={profile?.city ?? ""}
              placeholder="np. Warszawa"
              className="input"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3">
            <Field label="Czym się zajmujesz">
              <input
                name="job"
                maxLength={60}
                defaultValue={profile?.job ?? ""}
                placeholder="np. Grafik w agencji"
                className="input"
              />
            </Field>
            <Field label="Wykształcenie">
              <input
                name="education"
                maxLength={60}
                defaultValue={profile?.education ?? ""}
                placeholder="np. Politechnika Warszawska"
                className="input"
              />
            </Field>
          </div>

          <Field label="Płeć">
            <Choice name="gender" options={[...GENDERS]} value={profile?.gender ?? null} />
          </Field>

          <Field label="Czego szukasz">
            <Choice
              name="looking_for"
              options={[...LOOKING_FOR]}
              value={profile?.looking_for ?? null}
            />
          </Field>

          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-inksoft">
              Zainteresowania
            </p>
            <p className="mb-2 text-xs text-inksoft">Wybierz do ośmiu.</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <label key={i} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="interests"
                    value={i}
                    defaultChecked={profile?.interests?.includes(i) ?? false}
                    className="peer sr-only"
                  />
                  <span className="block rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-inksoft peer-checked:border-coral peer-checked:bg-coral/15 peer-checked:text-coraldeep">
                    {i}
                  </span>
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

        <section className="flex flex-col gap-2 border-t border-line pt-5">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-inksoft">
        {label}
      </span>
      {children}
    </label>
  );
}

/** Wybór jednej opcji — pigułki zamiast listy rozwijanej. */
function Choice({
  name,
  options,
  value,
}: {
  name: string;
  options: string[];
  value: string | null;
}) {
  return (
    <span className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={o}
            defaultChecked={value === o}
            className="peer sr-only"
          />
          <span className="block rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-inksoft peer-checked:border-coral peer-checked:bg-coral/15 peer-checked:text-coraldeep">
            {o}
          </span>
        </label>
      ))}
    </span>
  );
}
