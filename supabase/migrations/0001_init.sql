-- paragraf — schemat startowy
-- Uruchom w Supabase: Dashboard -> SQL Editor -> wklej i "Run"
-- (albo przez Supabase CLI: `supabase db push`)

-- ------------------------------------------------------------------
-- PROFILE
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  age        int,
  bio        text,
  games      text[] not null default '{}',
  avatar     jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Każdy zalogowany widzi profile (potrzebne do swipe'a).
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Użytkownik zarządza tylko swoim profilem.
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ------------------------------------------------------------------
-- POLUBIENIA / POMINIĘCIA
-- ------------------------------------------------------------------
create table if not exists public.likes (
  id         bigint generated always as identity primary key,
  liker      uuid not null references auth.users (id) on delete cascade,
  liked      uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (liker, liked)
);

alter table public.likes enable row level security;

create policy "likes_select_own"
  on public.likes for select
  to authenticated
  using (liker = auth.uid());

create policy "likes_insert_own"
  on public.likes for insert
  to authenticated
  with check (liker = auth.uid());

create table if not exists public.passes (
  id         bigint generated always as identity primary key,
  passer     uuid not null references auth.users (id) on delete cascade,
  passed     uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (passer, passed)
);

alter table public.passes enable row level security;

create policy "passes_select_own"
  on public.passes for select
  to authenticated
  using (passer = auth.uid());

create policy "passes_insert_own"
  on public.passes for insert
  to authenticated
  with check (passer = auth.uid());

-- ------------------------------------------------------------------
-- DOPASOWANIA (matches) — para przechowywana uporządkowana (user_a < user_b)
-- ------------------------------------------------------------------
create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references auth.users (id) on delete cascade,
  user_b     uuid not null references auth.users (id) on delete cascade,
  points     int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_a, user_b)
);

alter table public.matches enable row level security;

create policy "matches_select_participant"
  on public.matches for select
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "matches_update_participant"
  on public.matches for update
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- Trigger: gdy powstaje wzajemne polubienie, utwórz match.
create or replace function public.handle_new_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.likes l
    where l.liker = new.liked and l.liked = new.liker
  ) then
    insert into public.matches (user_a, user_b)
    values (least(new.liker, new.liked), greatest(new.liker, new.liked))
    on conflict (user_a, user_b) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_like_created on public.likes;
create trigger on_like_created
  after insert on public.likes
  for each row execute function public.handle_new_like();

-- ------------------------------------------------------------------
-- WYBÓR GIER W PARZE (obopólna zgoda) — na następny etap
-- ------------------------------------------------------------------
create table if not exists public.match_games (
  match_id uuid not null references public.matches (id) on delete cascade,
  game_id  text not null,
  a_wants  boolean not null default false,
  b_wants  boolean not null default false,
  played   boolean not null default false,
  primary key (match_id, game_id)
);

alter table public.match_games enable row level security;

create policy "match_games_participant"
  on public.match_games for all
  to authenticated
  using (exists (
    select 1 from public.matches m
    where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
  ))
  with check (exists (
    select 1 from public.matches m
    where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
  ));

-- ------------------------------------------------------------------
-- WIADOMOŚCI — na następny etap (czat po grze)
-- ------------------------------------------------------------------
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  match_id   uuid not null references public.matches (id) on delete cascade,
  sender     uuid not null references auth.users (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (exists (
    select 1 from public.matches m
    where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
  ));

create policy "messages_insert_participant"
  on public.messages for insert
  to authenticated
  with check (
    sender = auth.uid() and exists (
      select 1 from public.matches m
      where m.id = match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );
