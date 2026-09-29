-- PracticeKoro: Live Test + Flashcards foundation
create extension if not exists pgcrypto;

alter table if exists public.test_series
  add column if not exists is_featured boolean not null default false;

create table if not exists public.live_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  exam_id uuid references public.exams(id) on delete set null,
  test_series_id uuid references public.test_series(id) on delete set null,
  test_id uuid not null references public.tests(id) on delete restrict,
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  instructions text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  subscription_required boolean not null default false,
  max_participants integer,
  result_visibility text not null default 'immediate' check (result_visibility in ('immediate','after_end','manual')),
  ranking_enabled boolean not null default true,
  status text not null default 'draft' check (status in ('draft','scheduled','live','completed','cancelled','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_end_at > scheduled_start_at)
);

create index if not exists live_tests_schedule_idx on public.live_tests(status, scheduled_start_at);
create index if not exists live_tests_test_idx on public.live_tests(test_id);

create table if not exists public.live_test_participants (
  id uuid primary key default gen_random_uuid(),
  live_test_id uuid not null references public.live_tests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered','started','completed','cancelled')),
  joined_at timestamptz not null default now(),
  unique(live_test_id,user_id)
);

create index if not exists live_test_participants_user_idx on public.live_test_participants(user_id);

create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.exams(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  chapter_id uuid references public.chapters(id) on delete set null,
  title text not null,
  description text,
  cover_icon text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  order_index integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flashcard_decks_filter_idx on public.flashcard_decks(status,exam_id,subject_id,chapter_id);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  card_type text not null default 'question_answer',
  front_content text not null,
  back_content text not null,
  explanation text,
  source text,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  tags jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  order_index integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flashcards_deck_idx on public.flashcards(deck_id,status,order_index);

create table if not exists public.flashcard_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  status text not null default 'new' check (status in ('new','learning','review','mastered')),
  review_count integer not null default 0,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  updated_at timestamptz not null default now(),
  unique(user_id,flashcard_id)
);

create index if not exists flashcard_progress_due_idx on public.flashcard_progress(user_id,next_review_at);

create table if not exists public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  rating text not null check (rating in ('again','hard','good','easy')),
  reviewed_at timestamptz not null default now()
);

create index if not exists flashcard_reviews_user_idx on public.flashcard_reviews(user_id,reviewed_at desc);

create or replace function public.is_pk_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.role::text,'') in ('admin','super_admin')
  );
$$;

alter table public.live_tests enable row level security;
alter table public.live_test_participants enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_progress enable row level security;
alter table public.flashcard_reviews enable row level security;

drop policy if exists live_tests_public_read on public.live_tests;
create policy live_tests_public_read on public.live_tests for select using (
  visibility = 'public' and status in ('scheduled','live','completed')
);

drop policy if exists live_tests_admin_all on public.live_tests;
create policy live_tests_admin_all on public.live_tests for all using (public.is_pk_admin()) with check (public.is_pk_admin());

drop policy if exists live_participant_own_read on public.live_test_participants;
create policy live_participant_own_read on public.live_test_participants for select using (user_id = auth.uid() or public.is_pk_admin());

drop policy if exists live_participant_own_insert on public.live_test_participants;
create policy live_participant_own_insert on public.live_test_participants for insert with check (user_id = auth.uid());

drop policy if exists live_participant_admin_all on public.live_test_participants;
create policy live_participant_admin_all on public.live_test_participants for all using (public.is_pk_admin()) with check (public.is_pk_admin());

drop policy if exists flash_decks_public_read on public.flashcard_decks;
create policy flash_decks_public_read on public.flashcard_decks for select using (status = 'published');

drop policy if exists flash_decks_admin_all on public.flashcard_decks;
create policy flash_decks_admin_all on public.flashcard_decks for all using (public.is_pk_admin()) with check (public.is_pk_admin());

drop policy if exists flashcards_public_read on public.flashcards;
create policy flashcards_public_read on public.flashcards for select using (
  status = 'published' and exists (
    select 1 from public.flashcard_decks d where d.id = deck_id and d.status = 'published'
  )
);

drop policy if exists flashcards_admin_all on public.flashcards;
create policy flashcards_admin_all on public.flashcards for all using (public.is_pk_admin()) with check (public.is_pk_admin());

drop policy if exists flash_progress_own_all on public.flashcard_progress;
create policy flash_progress_own_all on public.flashcard_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists flash_reviews_own_all on public.flashcard_reviews;
create policy flash_reviews_own_all on public.flashcard_reviews for all using (user_id = auth.uid()) with check (user_id = auth.uid());
