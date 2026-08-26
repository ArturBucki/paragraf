import Link from "next/link";
import type { Profile } from "@/lib/types";
import { INTEREST_GROUPS } from "@/lib/types";
import { Icon, type IconName } from "@/components/Icon";
import { PhotoViewer } from "@/components/PhotoViewer";
import { VerifiedBadge } from "@/components/VerifiedBadge";

/** Kolor po grupie — te same barwy co przy wybieraniu w ustawieniach. */
const ACCENT = new Map<string, string>(
  INTEREST_GROUPS.flatMap((g) => g.items.map((i) => [i, g.accent] as const)),
);

/**
 * Cudzy profil w całości — to, co na karcie w swipe jest skrótem.
 * Nic, czego właściciel sam nie wpisał w ustawieniach.
 */
export function ProfileView({
  profile,
  backHref,
  matchHref,
  embedded = false,
}: {
  profile: Profile;
  backHref: string;
  /** Jeśli to Wasza para — skrót z powrotem do rozmowy. */
  matchHref?: string;
  /** W podglądzie własnego profilu nagłówek jest wyżej — tu go nie powtarzamy. */
  embedded?: boolean;
}) {
  const meta: { icon: IconName; text: string }[] = [];
  if (profile.city) meta.push({ icon: "pin", text: profile.city });
  if (profile.job) meta.push({ icon: "work", text: profile.job });
  if (profile.education) meta.push({ icon: "cap", text: profile.education });
  if (profile.height_cm) meta.push({ icon: "ruler", text: `${profile.height_cm} cm` });

  const facts: { label: string; value: string }[] = [];
  const add = (label: string, value?: string | null) => {
    if (value) facts.push({ label, value });
  };
  add("Płeć", profile.gender);
  add("Orientacja", profile.orientation?.join(", ") || null);
  add("Szuka", profile.looking_for);
  add("Zodiak", profile.zodiac);
  add("Alkohol", profile.drinking);
  add("Papierosy", profile.smoking);
  add("Sport", profile.workout);
  add("Zwierzaki", profile.pets);
  add("Dzieci", profile.kids);
  add("Języki", profile.languages?.join(", ") || null);

  return (
    <main className={`mx-auto flex max-w-md flex-col gap-4 px-4 ${embedded ? "pb-2 pt-0" : "min-h-screen pb-28 pt-4"}`}>
      {!embedded && (
      <header className="flex items-center gap-3">
        <Link
          href={backHref}
          aria-label="Wróć"
          className="grid h-10 w-10 flex-none place-items-center rounded-full border border-line text-inksoft transition active:scale-95"
        >
          <Icon name="back" className="h-5 w-5" />
        </Link>
        <span className="min-w-0 flex-1" />
        {matchHref && (
          <Link
            href={matchHref}
            className="flex flex-none items-center gap-1.5 rounded-full bg-coral px-3.5 py-2 text-xs font-extrabold text-[rgb(var(--on-coral))] transition active:scale-95"
          >
            <Icon name="chat" className="h-4 w-4" /> Rozmowa
          </Link>
        )}
      </header>
      )}

      <PhotoViewer
        profile={profile}
        overlay={
          <>
            <h1 className="font-display text-[28px] font-extrabold leading-tight">
              {profile.name}
              {profile.age ? `, ${profile.age}` : ""}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <VerifiedBadge verified={profile.verified} onPhoto />
              {profile.looking_for && (
                <span className="rounded-full bg-coral px-2.5 py-0.5 text-[11px] font-bold text-[rgb(var(--on-coral))]">
                  {profile.looking_for}
                </span>
              )}
            </div>
          </>
        }
      />

      {meta.length > 0 && (
        <section className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-inksoft">
          {meta.map((m) => (
            <span key={m.icon} className="flex items-center gap-1.5">
              <Icon name={m.icon} className="h-4 w-4 opacity-80" />
              {m.text}
            </span>
          ))}
        </section>
      )}

      {profile.bio && (
        <section className="rounded-2xl bg-surface p-4 soft-1">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-inksoft">
            O mnie
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed">{profile.bio}</p>
        </section>
      )}

      {facts.length > 0 && (
        <section>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-inksoft">
            Fakty
          </p>
          <div className="grid grid-cols-2 gap-2">
            {facts.map((f) => (
              <div
                key={f.label}
                className="rounded-xl bg-surface px-3 py-2 soft-1"
              >
                <p className="font-mono text-[9px] uppercase tracking-wide text-inksoft">
                  {f.label}
                </p>
                <p className="truncate text-sm font-semibold">{f.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {profile.interests?.length > 0 && (
        <section>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-inksoft">
            Zainteresowania
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((t) => {
              const accent = ACCENT.get(t) ?? "#6FD3A6";
              return (
                <span
                  key={t}
                  className="rounded-full border px-3 py-1.5 text-[13px] font-semibold"
                  style={{
                    borderColor: accent,
                    background: `${accent}1F`,
                    color: accent,
                  }}
                >
                  {t}
                </span>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
