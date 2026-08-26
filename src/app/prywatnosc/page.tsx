import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Prywatność — paragraf" };

export default function Prywatnosc() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-10">
      <Link href="/" className="text-sm font-semibold text-coraldeep">
        ← paragraf
      </Link>
      <h1 className="font-display text-3xl font-extrabold">
        Polityka prywatności
      </h1>
      <p className="text-sm text-inksoft">Obowiązuje od {LEGAL.date}.</p>

      <Sekcja t="Kto jest administratorem">
        <p>
          Administratorem Twoich danych jest {LEGAL.operator}. W sprawach danych
          pisz na {LEGAL.email} — odpowiadamy w ciągu 30 dni.
        </p>
        {!LEGAL.complete && (
          <p className="mt-2 text-[13px] text-inksoft">
            Adres siedziby administratora pojawi się tutaj przed publicznym
            startem — do tego czasu podajemy go na życzenie, e-mailem.
          </p>
        )}
      </Sekcja>

      <Sekcja t="Jakie dane zbieramy">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Konto:</b> adres e-mail i hasło (przechowywane w postaci
            zaszyfrowanej).
          </li>
          <li>
            <b>Profil:</b> imię, wiek, zdjęcia, opis, miasto, praca,
            wykształcenie, wzrost, zainteresowania, styl życia, języki, znak
            zodiaku.
          </li>
          <li>
            <b>Dane wrażliwe:</b> płeć i orientacja seksualna — podajesz je
            dobrowolnie, a widoczne są dla innych użytkowników. Podstawą jest
            Twoja wyraźna zgoda (art. 9 ust. 2 lit. a RODO), którą wyrażasz,
            wpisując te dane. Możesz je w każdej chwili usunąć w Ustawieniach.
          </li>
          <li>
            <b>Aktywność:</b> polubienia, pominięcia, pary, rozmowy, rozegrane
            gry i punkty połączenia.
          </li>
          <li>
            <b>Zgłoszenia:</b> treść zgłoszenia i to, kogo dotyczy.
          </li>
        </ul>
        <p className="mt-2">
          Nie zbieramy dokładnej lokalizacji — miasto wpisujesz sam. Nie
          używamy reklamowych plików cookie ani zewnętrznej analityki.
        </p>
      </Sekcja>

      <Sekcja t="Po co i na jakiej podstawie">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Żeby usługa działała — kojarzenie, gry, rozmowy (art. 6 ust. 1 lit. b
            RODO: wykonanie umowy).
          </li>
          <li>
            Żeby było bezpiecznie — zgłoszenia, blokady, zapobieganie nadużyciom
            (art. 6 ust. 1 lit. f: nasz uzasadniony interes).
          </li>
          <li>
            Dane wrażliwe — wyłącznie na podstawie Twojej zgody (art. 9 ust. 2
            lit. a).
          </li>
        </ul>
      </Sekcja>

      <Sekcja t="Kto jeszcze ma do nich dostęp">
        <p>
          Korzystamy z dwóch dostawców, którzy przetwarzają dane w naszym
          imieniu: <b>Supabase</b> (baza danych, logowanie i zdjęcia, serwery w
          USA) oraz <b>Vercel</b> (hosting aplikacji). Nie sprzedajemy danych i
          nie przekazujemy ich reklamodawcom. Twój profil widzą inni użytkownicy
          aplikacji — to sens działania usługi.
        </p>
      </Sekcja>

      <Sekcja t="Jak długo je trzymamy">
        <p>
          Dane konta — dopóki masz konto. Po usunięciu konta profil, zdjęcia,
          pary i rozmowy znikają natychmiast. Zgłoszenia zostawiamy do 12
          miesięcy, odcięte od danych zgłaszającego, żeby móc reagować na
          powtarzające się nadużycia.
        </p>
      </Sekcja>

      <Sekcja t="Twoje prawa">
        <p>
          Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia
          przetwarzania, przenoszenia oraz sprzeciwu. Zgodę na dane wrażliwe
          możesz wycofać w każdej chwili — usuwając te pola w Ustawieniach.
          Konto usuwasz sam, w Ustawieniach, jednym przyciskiem. Możesz też
          złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych.
        </p>
      </Sekcja>

      <Sekcja t="Dzieci">
        <p>
          Aplikacja jest wyłącznie dla osób pełnoletnich. Konto osoby, co do
          której mamy podejrzenie, że jest niepełnoletnia, blokujemy i usuwamy.
        </p>
      </Sekcja>

      <p className="mt-4 rounded-2xl bg-surface p-4 text-[13px] leading-relaxed text-inksoft soft-1">
        {LEGAL.disclaimer}
      </p>
      <Link href="/regulamin" className="text-sm font-semibold text-coraldeep">
        Regulamin →
      </Link>
    </main>
  );
}

function Sekcja({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg font-extrabold">{t}</h2>
      <div className="text-[14px] leading-relaxed">{children}</div>
    </section>
  );
}
