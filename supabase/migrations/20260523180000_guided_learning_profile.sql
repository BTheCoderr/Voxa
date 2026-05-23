-- Guided learning profile fields (additive, safe for existing rows)

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists native_language text,
  add column if not exists target_language text,
  add column if not exists interests text[] not null default '{}',
  add column if not exists level text,
  add column if not exists explanation_language text,
  add column if not exists onboarding_completed boolean not null default false;

comment on column public.profiles.display_name is 'Learner display name from guided onboarding';
comment on column public.profiles.target_language is 'LaunchLanguage id: english_business | spanish | mandarin';
comment on column public.profiles.onboarding_completed is 'Guided conversational onboarding finished';
