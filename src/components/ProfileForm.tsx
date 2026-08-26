"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import { Section, Field, Pick } from "@/components/ProfileSection";
import { ChipOne, ChipMany, InterestPicker } from "@/components/ProfilePickers";
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

type Draft = {
  name: string;
  age: string;
  height_cm: string;
  bio: string;
  city: string;
  job: string;
  education: string;
  zodiac: string | null;
  gender: string | null;
  orientation: string[];
  interested_in: string | null;
  looking_for: string | null;
  drinking: string | null;
  smoking: string | null;
  workout: string | null;
  pets: string | null;
  kids: string | null;
  languages: string[];
  interests: string[];
};

function toDraft(p: Profile | null): Draft {
  return {
    name: p?.name ?? "",
    age: p?.age ? String(p.age) : "",
    height_cm: p?.height_cm ? String(p.height_cm) : "",
    bio: p?.bio ?? "",
    city: p?.city ?? "",
    job: p?.job ?? "",
    education: p?.education ?? "",
    zodiac: p?.zodiac ?? null,
    gender: p?.gender ?? null,
    orientation: p?.orientation ?? [],
    interested_in: p?.interested_in ?? null,
    looking_for: p?.looking_for ?? null,
    drinking: p?.drinking ?? null,
    smoking: p?.smoking ?? null,
    workout: p?.workout ?? null,
    pets: p?.pets ?? null,
    kids: p?.kids ?? null,
    languages: p?.languages ?? [],
    interests: p?.interests ?? [],
  };
}

/**
 * Ustawienia profilu.
 * Zapis leci prosto z przeglądarki do bazy (RLS pozwala pisać tylko po sobie,
 * a słowniki pilnują więzy CHECK) — dzięki temu „Zapisz" działa od razu,
 * bez przeładowania strony. Pasek uzupełnienia liczy się na bieżąco.
 */
export function ProfileForm({
  userId,
  profile,
  photoCount,
}: {
  userId: string;
  profile: Profile | null;
  photoCount: number;
}) {
  const [d, setD] = useState<Draft>(() => toDraft(profile));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setD((prev) => ({ ...prev, [k]: v }));

  const sections = useMemo(
    () => ({
      basics: [d.name, d.age, d.city, d.height_cm],
      about: [d.bio, d.job, d.education, d.languages.length],
      who: [d.gender, d.orientation.length, d.interested_in, d.looking_for],
      life: [d.drinking, d.smoking, d.workout, d.pets, d.kids],
      likes: [d.interests.length],
    }),
    [d],
  );
  const done = (xs: unknown[]) => xs.filter(Boolean).length;
  const all = [...Object.values(sections).flat(), photoCount];
  const completeness = Math.round((done(all) / all.length) * 100);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");

    const num = (v: string, lo: number, hi: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
    };
    const txt = (v: string, max: number) => v.trim().slice(0, max) || null;

    const { error } = await createClient()
      .from("profiles")
      .update({
        name: txt(d.name, 40) ?? "Bez imienia",
        age: num(d.age, 18, 120),
        height_cm: num(d.height_cm, 120, 230),
        bio: txt(d.bio, 300),
        city: txt(d.city, 60),
        job: txt(d.job, 60),
        education: txt(d.education, 60),
        zodiac: d.zodiac,
        gender: d.gender,
        orientation: d.orientation.slice(0, MAX_ORIENTATION),
        interested_in: d.interested_in,
        looking_for: d.looking_for,
        drinking: d.drinking,
        smoking: d.smoking,
        workout: d.workout,
        pets: d.pets,
        kids: d.kids,
        languages: d.languages.slice(0, MAX_LANGUAGES),
        interests: d.interests.slice(0, MAX_INTERESTS),
      })
      .eq("id", userId);

    setState(error ? "error" : "saved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  }

  return (
    <>
      <section className="rounded-2xl bg-surface p-4 soft-1">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold">Profil uzupełniony w {completeness}%</span>
          {completeness < 100 && (
            <span className="text-inksoft">więcej = więcej matchy</span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-coral transition-all duration-500"
            style={{ width: `${Math.max(6, completeness)}%` }}
          />
        </div>
      </section>

      <form onSubmit={save} className="flex flex-col gap-3">
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
              value={d.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={40}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Wiek">
              <input
                value={d.age}
                onChange={(e) => set("age", e.target.value)}
                type="number"
                min={18}
                max={120}
                className="input"
              />
            </Field>
            <Field label="Wzrost (cm)">
              <input
                value={d.height_cm}
                onChange={(e) => set("height_cm", e.target.value)}
                type="number"
                min={120}
                max={230}
                placeholder="—"
                className="input"
              />
            </Field>
          </div>

          <Field label="Miasto">
            <input
              value={d.city}
              onChange={(e) => set("city", e.target.value)}
              maxLength={60}
              placeholder="np. Warszawa"
              className="input"
            />
          </Field>

          <Pick label="Znak zodiaku">
            <ChipOne
              options={ZODIAC}
              value={d.zodiac}
              onChange={(v) => set("zodiac", v)}
              accent="#B9770B"
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
              value={d.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Co robisz, gdy masz wolny wieczór?"
              className="input"
            />
          </Field>

          <Field label="Czym się zajmujesz">
            <input
              value={d.job}
              onChange={(e) => set("job", e.target.value)}
              maxLength={60}
              placeholder="np. Grafik w agencji"
              className="input"
            />
          </Field>

          <Field label="Wykształcenie">
            <input
              value={d.education}
              onChange={(e) => set("education", e.target.value)}
              maxLength={60}
              placeholder="np. Politechnika Warszawska"
              className="input"
            />
          </Field>

          <Pick label="Języki">
            <ChipMany
              options={LANGUAGES}
              value={d.languages}
              onChange={(v) => set("languages", v)}
              max={MAX_LANGUAGES}
              accent="#4657C4"
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
              options={GENDERS}
              value={d.gender}
              onChange={(v) => set("gender", v)}
            />
          </Pick>

          <Pick label="Orientacja" hint={`Możesz wskazać do ${MAX_ORIENTATION}.`}>
            <ChipMany
              options={ORIENTATIONS}
              value={d.orientation}
              onChange={(v) => set("orientation", v)}
              max={MAX_ORIENTATION}
              accent="#4657C4"
            />
          </Pick>

          <Pick label="Pokazuj mi" hint="Kogo chcesz widzieć w swipe.">
            <ChipOne
              options={INTERESTED_IN}
              value={d.interested_in}
              onChange={(v) => set("interested_in", v)}
              accent="#157A59"
            />
          </Pick>

          <Pick label="Czego szukasz">
            <ChipOne
              options={LOOKING_FOR}
              value={d.looking_for}
              onChange={(v) => set("looking_for", v)}
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
              options={DRINKING}
              value={d.drinking}
              onChange={(v) => set("drinking", v)}
              accent="#B9770B"
            />
          </Pick>
          <Pick label="Papierosy">
            <ChipOne
              options={SMOKING}
              value={d.smoking}
              onChange={(v) => set("smoking", v)}
              accent="#B9770B"
            />
          </Pick>
          <Pick label="Sport">
            <ChipOne
              options={WORKOUT}
              value={d.workout}
              onChange={(v) => set("workout", v)}
              accent="#157A59"
            />
          </Pick>
          <Pick label="Zwierzaki">
            <ChipOne
              options={PETS}
              value={d.pets}
              onChange={(v) => set("pets", v)}
              accent="#4657C4"
            />
          </Pick>
          <Pick label="Dzieci">
            <ChipOne
              options={KIDS}
              value={d.kids}
              onChange={(v) => set("kids", v)}
              accent="#4657C4"
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
            value={d.interests}
            onChange={(v) => set("interests", v)}
            max={MAX_INTERESTS}
          />
        </Section>

        <button
          type="submit"
          className={`sticky bottom-24 z-10 flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold soft-2 transition active:scale-[0.99] ${
            state === "saved"
              ? "bg-berry text-white"
              : state === "error"
                ? "bg-surface text-coraldeep"
                : "bg-coral text-[rgb(var(--on-coral))]"
          }`}
        >
          {state === "saved" && <Icon name="verified" className="h-4 w-4" />}
          {state === "saving"
            ? "Zapisuję…"
            : state === "saved"
              ? "Zapisano"
              : state === "error"
                ? "Nie udało się — spróbuj jeszcze raz"
                : "Zapisz zmiany"}
        </button>
      </form>
    </>
  );
}
