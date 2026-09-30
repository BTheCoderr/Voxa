alter table public.conversations
  add column if not exists coach_review jsonb;

comment on column public.conversations.coach_review is
  'Structured Voxa coaching recap used to derive cross-session learner trends.';
