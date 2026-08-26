import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Regulamin — paragraf" };

export default function Regulamin() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-coraldeep">
        ← paragraf
      </Link>
      <h1 className="font-display text-3xl font-extrabold">Regulamin</h1>
      <p className="text-sm text-inksoft">
        Obowiązuje od {LEGAL.date}. Wersja wczesna aplikacji.
      </p>

      <Sekcja n="1" t="Kto prowadzi paragraf">
        <p>
          Usługę prowadzi {LEGAL.operator}, kontakt: {LEGAL.email}. Aplikacja
          działa pod adresem {LEGAL.site}.
        </p>
        {!LEGAL.complete && (
          <p className="mt-2 text-[13px] text-inksoft">
            Dane rejestrowe podmiotu uzupełnimy tu przed publicznym startem;
            do tego czasu usługa działa w wersji testowej dla zaproszonych osób.
          </p>
        )}
      </Sekcja>

      <Sekcja n="2" t="Kto może korzystać">
        <p>
          Tylko osoby, które ukończyły 18 lat. Zakładając konto, oświadczasz, że
          jesteś pełnoletni i podajesz prawdziwe dane o sobie. Jedna osoba może
          mieć jedno konto.
        </p>
      </Sekcja>

      <Sekcja n="3" t="Na czym polega usługa">
        <p>
          paragraf kojarzy pełnoletnie osoby i pozwala im zagrać razem w krótkie
          gry, zanim otworzy się rozmowa. Nie gwarantujemy, że kogoś poznasz ani
          że aplikacja będzie dostępna bez przerw — to wczesna wersja i może się
          zmieniać.
        </p>
      </Sekcja>

      <Sekcja n="4" t="Czego nie wolno">
        <ul className="list-disc space-y-1 pl-5">
          <li>Podszywać się pod kogoś innego ani używać cudzych zdjęć.</li>
          <li>Publikować treści seksualnych, przemocowych i nienawistnych.</li>
          <li>Nękać, grozić, wyłudzać pieniędzy ani reklamować czegokolwiek.</li>
          <li>Kontaktować się z osobami niepełnoletnimi w celach intymnych.</li>
          <li>Zbierać danych innych użytkowników ani obchodzić zabezpieczeń.</li>
        </ul>
        <p className="mt-2">
          Konto łamiące te zasady blokujemy — czasowo albo na stałe. Poważne
          sprawy zgłaszamy odpowiednim służbom.
        </p>
      </Sekcja>

      <Sekcja n="5" t="Twoje treści">
        <p>
          Zdjęcia i teksty należą do Ciebie. Wgrywając je, dajesz nam zgodę na
          ich wyświetlanie w aplikacji innym użytkownikom — wyłącznie po to, żeby
          usługa działała. Zgoda kończy się, gdy usuniesz treść albo konto.
        </p>
      </Sekcja>

      <Sekcja n="6" t="Zgłoszenia i blokowanie">
        <p>
          Przy każdym profilu i w każdej rozmowie jest opcja „Zgłoś" i
          „Zablokuj". Zgłoszenia sprawdzamy; zablokowana osoba nie dostaje o tym
          informacji i znikacie sobie nawzajem.
        </p>
      </Sekcja>

      <Sekcja n="7" t="Bezpieczeństwo spotkań">
        <p>
          Nie weryfikujemy tożsamości ani niekaralności użytkowników. Na
          pierwsze spotkanie umawiaj się w miejscu publicznym, powiedz komuś
          bliskiemu, gdzie idziesz, i nie przekazuj nikomu pieniędzy ani danych
          do logowania. W nagłej sytuacji dzwoń pod 112.
        </p>
      </Sekcja>

      <Sekcja n="8" t="Rezygnacja">
        <p>
          Konto możesz usunąć w każdej chwili w Ustawieniach — razem z profilem,
          zdjęciami, parami i rozmowami. Usunięcia nie da się cofnąć.
        </p>
      </Sekcja>

      <Sekcja n="9" t="Odpowiedzialność">
        <p>
          Usługa jest udostępniana w takiej postaci, w jakiej jest. Nie
          odpowiadamy za zachowanie innych użytkowników ani za to, co wydarzy się
          poza aplikacją. Nie ogranicza to praw, które przysługują Ci jako
          konsumentowi.
        </p>
      </Sekcja>

      <Sekcja n="10" t="Zmiany i spory">
        <p>
          O zmianach regulaminu uprzedzimy w aplikacji z wyprzedzeniem. W
          sprawach nieuregulowanych stosuje się prawo polskie. Reklamacje ślij na{" "}
          {LEGAL.email} — odpowiadamy w ciągu 14 dni.
        </p>
      </Sekcja>

      <p className="mt-4 rounded-2xl bg-surface p-4 text-[13px] leading-relaxed text-inksoft soft-1">
        {LEGAL.disclaimer}
      </p>
      <Link href="/prywatnosc" className="text-sm font-semibold text-coraldeep">
        Polityka prywatności →
      </Link>
    </main>
  );
}

function Sekcja({
  n,
  t,
  children,
}: {
  n: string;
  t: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg font-extrabold">
        <span className="text-inksoft">{n}.</span> {t}
      </h2>
      <div className="text-[14px] leading-relaxed">{children}</div>
    </section>
  );
}
