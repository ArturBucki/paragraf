import { redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ChipOne, ChipMany, InterestPicker } from "@/components/ProfilePickers";
import { Section, Field, Pick } from "@/components/ProfileSection";
import {
  GENDERS,
  ORIENTATIONS,
  MAX_ORIENTATION,
  INTERESTED_IN,
  LOOKING_FOR,
  DRINKING,
  SMOKING,
  WORKOUT,
  PETS,
  KIDS,
  ZODIAC,
  LANGUAGES,
  MAX_LANGUAGES,
  MAX_INTERESTS,
  type Profile,
} from "@/lib/types";
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

  // Ile sekcji jest gotowe — konkretny powód, żeby dokończyć profil.
  const sections = {
    basics: [profile?.name, profile?.age, profile?.city, profile?.height_cm],
    about: [profile?.bio, profile?.job, profile?.education, profile?.languages?.length],
    who: [
      profile?.gender,
      profile?.orientation?.length,
      profile?.interested_in,
      profile?.looking_for,
    ],
    life: [
      profile?.drinking,
      profile?.smoking,
      profile?.workout,
      profile?.pets,
      profile?.kids,
    ],
    likes: [profile?.interests?.length],
  };
  const done = (xs: unknown[]) => xs.filter(Boolean).length;
  const all = Object.values(sections).flat();
  const withPhotos = [...all, profile?.photos?.length];
  const completeness = Math.round(
    (done(withPhotos) / withPhotos.length) * 100,
  );

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 pb-28 pt-6">
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
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <VerifiedBadge verified={profile?.verified ?? false} />
              <span className="font-mono text-[11px] text-gold">
                {matchCount ?? 0} {matchCount === 1 ? "para" : "par"}
              </span>
            </div>
          </div>
        </header>

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
          <p className="rounded-xl border border-[#6FD3A6] bg-berry/12 px-4 py-2.5 text-sm font-semibold text-berry">
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

        <form action={updateProfile} className="flex flex-col gap-3">
          <Section
            icon="user"
            title="Podstawy"
            hint="Imię, wiek, gdzie jesteś"
            done={done(sections.basics)}
            total={sections.basics.length}
            open
          >
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

            <Field label="Miasto">
              <input
                name="city"
                maxLength={60}
                defaultValue={profile?.city ?? ""}
                placeholder="np. Warszawa"
                className="input"
              />
            </Field>

            <Pick label="Znak zodiaku">
              <ChipOne
                name="zodiac"
                options={ZODIAC}
                value={profile?.zodiac ?? null}
                accent="#C8A96A"
              />
            </Pick>
          </Section>

          <Section
            icon="chat"
            title="O mnie"
            hint="To, co czytają przed pierwszą grą"
            done={done(sections.about)}
            total={sections.about.length}
          >
            <Field label="Kilka zdań o sobie">
              <textarea
                name="bio"
                rows={3}
                maxLength={300}
                defaultValue={profile?.bio ?? ""}
                placeholder="Co robisz, gdy masz wolny wieczór?"
                className="input"
              />
            </Field>

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

            <Pick label="Języki">
              <ChipMany
                name="languages"
                options={LANGUAGES}
                value={profile?.languages ?? []}
                max={MAX_LANGUAGES}
                accent="#7FB0BF"
              />
            </Pick>
          </Section>

          <Section
            icon="heart"
            title="Ja i kogo szukam"
            hint="Płeć, orientacja, czego szukasz"
            done={done(sections.who)}
            total={sections.who.length}
          >
            <Pick label="Płeć">
              <ChipOne
                name="gender"
                options={GENDERS}
                value={profile?.gender ?? null}
              />
            </Pick>

            <Pick label="Orientacja" hint={`Możesz wskazać do ${MAX_ORIENTATION}.`}>
              <ChipMany
                name="orientation"
                options={ORIENTATIONS}
                value={profile?.orientation ?? []}
                max={MAX_ORIENTATION}
                accent="#9BA8D4"
              />
            </Pick>

            <Pick label="Pokazuj mi" hint="Kogo chcesz widzieć w swipe.">
              <ChipOne
                name="interested_in"
                options={INTERESTED_IN}
                value={profile?.interested_in ?? null}
                accent="#6FD3A6"
              />
            </Pick>

            <Pick label="Czego szukasz">
              <ChipOne
                name="looking_for"
                options={LOOKING_FOR}
                value={profile?.looking_for ?? null}
              />
            </Pick>
          </Section>

          <Section
            icon="spark"
            title="Styl życia"
            hint="Pięć szybkich klików"
            done={done(sections.life)}
            total={sections.life.length}
          >
            <Pick label="Alkohol">
              <ChipOne
                name="drinking"
                options={DRINKING}
                value={profile?.drinking ?? null}
                accent="#D98A63"
              />
            </Pick>
            <Pick label="Papierosy">
              <ChipOne
                name="smoking"
                options={SMOKING}
                value={profile?.smoking ?? null}
                accent="#D98A63"
              />
            </Pick>
            <Pick label="Sport">
              <ChipOne
                name="workout"
                options={WORKOUT}
                value={profile?.workout ?? null}
                accent="#6FD3A6"
              />
            </Pick>
            <Pick label="Zwierzaki">
              <ChipOne
                name="pets"
                options={PETS}
                value={profile?.pets ?? null}
                accent="#7FB0BF"
              />
            </Pick>
            <Pick label="Dzieci">
              <ChipOne
                name="kids"
                options={KIDS}
                value={profile?.kids ?? null}
                accent="#9BA8D4"
              />
            </Pick>
          </Section>

          <Section
            icon="puzzle"
            title="Zainteresowania"
            hint="Wspólne tematy widać na karcie"
            done={done(sections.likes)}
            total={sections.likes.length}
          >
            <InterestPicker
              value={profile?.interests ?? []}
              max={MAX_INTERESTS}
            />
          </Section>

          <button
            type="submit"
            className="sticky bottom-24 z-10 rounded-xl bg-coral px-4 py-3.5 font-bold text-[rgb(var(--on-coral))] shadow-lg transition active:scale-[0.99]"
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
