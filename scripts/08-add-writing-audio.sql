alter table public.writings
  add column if not exists audio_url text,
  add column if not exists audio_voice text;

comment on column public.writings.audio_url is 'Public URL of the generated article narration';
comment on column public.writings.audio_voice is 'Kokoro voice identifier used for narration';
