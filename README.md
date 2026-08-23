# paragraf

Apka randkowa, w której **match to dopiero początek**. Zamiast pustego „hej"
para wybiera **za obopólną zgodą** wspólną grę, a dopiero ona otwiera rozmowę.
Sercem są gry kooperacyjne; grając zdobywacie **punkty połączenia** (prywatne
dla waszej pary), które **odblokowują głębsze gry**.

Stack: **Next.js 14 (App Router, TypeScript) + Tailwind + Supabase + Vercel**.

---

## Co już działa (v0.1)

- Logowanie i rejestracja (e-mail + hasło, Supabase Auth)
- Profil: imię, wiek, bio, wybór gier + ilustrowany awatar (na razie rysowany, nie zdjęcie)
- Swipe: prawdziwe profile z bazy, na karcie widać, w co ktoś lubi grać
- Dopasowania: przy wzajemnym polubieniu automatycznie powstaje match (trigger w bazie)
- Lista dopasowań + ekran pary z lobby gier (z progami odblokowania wg punktów)
- Baza z RLS (Row Level Security) — dane widzą tylko właściwe osoby

## Następne kroki (kolejne etapy)

- Gry i czat w **czasie rzeczywistym** między dwiema osobami (Supabase Realtime) —
  logikę gier mamy już gotową w klikanym prototypie
- Mechanizm obopólnej zgody na grę zapisywany w tabeli `match_games`
- Naliczanie punktów połączenia po grze + odblokowywanie gier po stronie serwera
- Prawdziwe zdjęcia zamiast ilustracji (upload do Supabase Storage)
- Bezpieczeństwo: zgłaszanie, blokowanie, moderacja
- Zgodność z RODO (zgody, polityka prywatności, usuwanie konta)

---

## Jak uruchomić lokalnie

### 1. Załóż projekt Supabase
1. Wejdź na https://supabase.com i utwórz nowy projekt (darmowy plan wystarczy).
2. W **SQL Editor** wklej całą zawartość `supabase/migrations/0001_init.sql` i kliknij **Run**.
3. W **Project Settings → API** skopiuj:
   - `Project URL`
   - `anon public` key

### 2. Ustaw zmienne środowiskowe
Skopiuj `.env.example` do `.env.local` i uzupełnij:

```
NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj-anon-key
```

### 3. Zainstaluj i odpal
```bash
npm install
npm run dev
```
Aplikacja: http://localhost:3000

### 4. Przetestuj dopasowanie
Match wymaga **dwóch kont**, które się nawzajem polubią. Najproście:
1. Zarejestruj konto A (jedna przeglądarka), wypełnij profil.
2. Zarejestruj konto B (drugie okno/incognito), wypełnij profil.
3. Polubcie się nawzajem → pojawi się „To match!" i para na liście dopasowań.

> Wskazówka: w Supabase → **Authentication → Providers → Email** możesz na czas
> testów **wyłączyć „Confirm email"**, żeby logować się od razu po rejestracji.

---

## Wdrożenie (Vercel)

1. Wrzuć projekt na GitHub.
2. Na https://vercel.com → **New Project** → zaimportuj repo.
3. W ustawieniach projektu dodaj te same dwie zmienne środowiskowe co w `.env.local`.
4. Deploy. Gotowe.

---

## Struktura

```
src/
  app/
    page.tsx              # landing + przekierowania
    login/                # logowanie / rejestracja
    onboarding/           # uzupełnianie profilu
    swipe/                # swipe (serwer pobiera profile)
    matches/              # lista dopasowań
    matches/[id]/         # ekran pary + lobby gier (stub)
    actions.ts            # server actions: profil, polubienia
  components/
    SwipeDeck.tsx         # interaktywna talia kart
    Avatar.tsx            # ilustrowany portret (SVG)
  lib/
    games.ts             # katalog gier (pkt, progi odblokowania)
    types.ts
    supabase/            # klienci Supabase (browser/server/middleware)
supabase/
  migrations/0001_init.sql   # schemat bazy + RLS + trigger dopasowań
```
