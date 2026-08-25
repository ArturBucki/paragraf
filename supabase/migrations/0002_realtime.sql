-- Stan gry w parze + realtime dla lobby, czatu i punktów.
-- (Zastosowane już na projekcie Supabase.)

alter table public.match_games
  add column if not exists state jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter publication supabase_realtime add table public.match_games;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;

-- Funkcja triggera nie powinna być wywoływalna przez API (RPC).
revoke execute on function public.handle_new_like() from anon, authenticated, public;
