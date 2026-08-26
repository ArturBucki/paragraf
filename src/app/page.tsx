import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { GAMES } from "@/lib/games";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

/**
 * Landing — paleta 70/20/10:
 *  70%  butelkowa zieleń (#FFF7EC / #FDF1DF)  — grunt strony
 *  20%  ciepły kremowy (#23305C)              — treść, karty, oddech
 *  10%  koral (#F5A524)                       — akcent, tylko tam gdzie ma kliknąć wzrok
 */
export default async function Home() {
  const user = await currentUser();
  if (user) redirect("/swipe");

  return (
    <div className="min-h-screen bg-[#FFF7EC] text-[#23305C] antialiased">
      {/* ---------------------------------------------------------------- nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-extrabold tracking-tight">
          para<span className="text-[#B9770B]">graf</span>
        </span>
        <Link
          href="/login"
          className="rounded-full border border-[#23305C]/25 px-4 py-2 text-sm font-semibold transition hover:border-[#23305C]/60"
        >
          Zaloguj się
        </Link>
      </header>

      {/* --------------------------------------------------------------- hero */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-10 md:pb-28 md:pt-16">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-[#23305C]/55">
          Randki inaczej
        </p>

        <h1 className="max-w-[15ch] font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-tight md:text-7xl">
          Match to dopiero{" "}
          <span className="relative whitespace-nowrap text-[#B9770B]">
            początek
            <svg
              aria-hidden="true"
              viewBox="0 0 300 14"
              className="absolute -bottom-2 left-0 w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M2 9 Q 75 2 150 7 T 298 5"
                fill="none"
                stroke="#F5A524"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.55"
              />
            </svg>
          </span>
          .
        </h1>

        <p className="mt-9 max-w-lg text-lg leading-relaxed text-[#23305C]/75 md:text-xl">
          Na innych apkach po matchu zapada cisza. Tutaj zamiast pustego „hej"
          <strong className="font-semibold text-[#23305C]"> gracie razem</strong> —
          i dopiero to otwiera rozmowę.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/login"
            className="rounded-2xl bg-[#F5A524] px-8 py-4 text-center font-bold text-[#2A1B00] shadow-[0_12px_30px_-12px_rgba(245,165,36,0.55)] transition hover:brightness-105"
          >
            Zacznij grać
          </Link>
          <a
            href="#jak-to-dziala"
            className="rounded-2xl border border-[#23305C]/25 px-8 py-4 text-center font-semibold transition hover:border-[#23305C]/60"
          >
            Jak to działa
          </a>
        </div>
      </section>

      {/* ------------------------------------------------------------ problem */}
      <section className="border-y border-[#23305C]/10 bg-[#FDF1DF]">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-14 md:grid-cols-3 md:py-16">
          {[
            {
              t: "Setki matchy, zero rozmów",
              d: "Swipe zamienił randki w automat do gry. Match nic nie znaczy, więc nic z niego nie wynika.",
            },
            {
              t: "„Co ja mam napisać?”",
              d: "Rozmowa nie startuje albo umiera po dwóch zdaniach. Nikt nie lubi zaczynać od zera.",
            },
            {
              t: "Ocena po jednym zdjęciu",
              d: "Charakter, humor, sposób bycia — wszystko to zostaje niewidoczne.",
            },
          ].map((x) => (
            <div key={x.t}>
              <h3 className="font-display text-lg font-bold leading-snug">{x.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#23305C]/60">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- jak to działa */}
      <section id="jak-to-dziala" className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <h2 className="max-w-[18ch] font-display text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Poznajecie się, robiąc coś <em className="not-italic text-[#B9770B]">razem</em>.
        </h2>
        <p className="mt-5 max-w-xl text-[#23305C]/70">
          Bo najmocniej zbliża nie ocenianie zdjęć, tylko bycie po tej samej stronie.
        </p>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Swipe",
              d: "Klasycznie — przeglądasz i decydujesz, kto Ci się podoba.",
            },
            {
              n: "02",
              t: "Zagrajcie",
              d: "Wybieracie grę za obopólną zgodą. Bez zgody obojga nic nie startuje.",
            },
            {
              n: "03",
              t: "Rozmowa",
              d: "Czat otwiera się po grze — z tematem, śmiechem i czymś wspólnym za sobą.",
            },
          ].map((s) => (
            <li
              key={s.n}
              className="rounded-3xl bg-[#23305C] p-7 text-[#FFF7EC] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.6)]"
            >
              <span className="font-mono text-xs font-bold tracking-[0.15em] text-[#FFF7EC]/40">
                {s.n}
              </span>
              <h3 className="mt-4 font-display text-2xl font-extrabold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#FFF7EC]/70">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* --------------------------------------------------------------- gry */}
      <section className="border-y border-[#23305C]/10 bg-[#FDF1DF]">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Gry, które naprawdę zbliżają
          </h2>
          <p className="mt-4 max-w-xl text-[#23305C]/70">
            Współpraca daje więcej punktów niż rywalizacja — bo to ona buduje więź.
            Im więcej gracie, tym głębsze gry się odblokowują.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GAMES.map((g) => (
              <div
                key={g.id}
                className="flex items-start gap-3 rounded-2xl border border-[#23305C]/12 bg-[#23305C]/[0.04] p-5"
              >
                <Icon name={g.icon} className="h-6 w-6 flex-none text-[#F5A524]" />
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8F5C00]">
                    {g.tag} · +{g.pts}
                  </div>
                  <h3 className="mt-1 font-bold leading-tight">{g.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#23305C]/55">
                    {g.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ punkty */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Punkty połączenia — tylko wasze
            </h2>
            <p className="mt-5 leading-relaxed text-[#23305C]/70">
              Za każdą wspólną grę zbieracie punkty. Są prywatne dla waszej pary i
              liczą się od zera z każdą nową osobą — nikt nie widzi, ile czasu
              spędzasz w apce.
            </p>
            <p className="mt-4 leading-relaxed text-[#23305C]/70">
              Rosną tylko wtedy, gdy naprawdę coś razem robicie. I to one odblokowują
              głębsze, bardziej osobiste gry.
            </p>
          </div>

          <div className="rounded-3xl bg-[#23305C] p-7 text-[#FFF7EC]">
            {[
              { pkt: "0", txt: "Kółko i krzyżyk, zagadka, dwie prawdy", open: true },
              { pkt: "60", txt: "Kalambury — rysuj i zgaduj", open: true },
              { pkt: "150", txt: "36 pytań, które zbliżają", open: true },
              { pkt: "320", txt: "Escape room we dwoje", open: true },
            ].map((r, i) => (
              <div
                key={r.pkt}
                className={`flex items-center gap-4 py-4 ${
                  i > 0 ? "border-t border-[#FFF7EC]/10" : ""
                }`}
              >
                <span className="w-[4.5rem] shrink-0 whitespace-nowrap font-mono text-sm font-bold tabular-nums text-[#FFF7EC]/45">
                  {r.pkt} pkt
                </span>
                <span className="flex-1 text-sm font-semibold">{r.txt}</span>
                <Icon name={r.open ? "spark" : "lock"} className="h-4 w-4" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- cta */}
      <section className="border-t border-[#23305C]/10 bg-[#FDF1DF]">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-28">
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Przestań pisać „hej".
          </h2>
          <p className="mx-auto mt-6 max-w-md text-lg text-[#23305C]/70">
            Zagraj z kimś, kto Ci się podoba — i zobacz, czy iskrzy.
          </p>
          <Link
            href="/login"
            className="mt-10 inline-block rounded-2xl bg-[#F5A524] px-10 py-4 font-bold text-[#2A1B00] shadow-[0_12px_30px_-12px_rgba(245,165,36,0.55)] transition hover:brightness-105"
          >
            Załóż konto — za darmo
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-10 text-sm text-[#23305C]/40 sm:flex-row sm:items-center sm:justify-between">
        <span>
          para<span className="text-[#B9770B]">graf</span> — poznaj się przez grę
        </span>
        <span>Wersja wczesna · buduje się na bieżąco</span>
      </footer>
    </div>
  );
}
