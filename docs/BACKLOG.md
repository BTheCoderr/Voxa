# Voxa — Engineering backlog (post-checkpoint)

Non-blocking items deferred from shipping readiness pass.

## Audio

- **Migrate TTS playback from `expo-av` to `expo-audio`** — `expo-av` is deprecated in Expo SDK 54. Current playback in `lib/tts/elevenLabsTts.ts` uses `Audio.Sound` from `expo-av`. Low urgency while playback still works.

## Data

- **Coach timeout abort** — pass `AbortSignal` into Groq/Gemini provider fetches so timed-out primary requests are cancelled.
- **Structured encouragement persistence** — store `encouragement` on `conversations` or a messages metadata column if analytics need it.

## Auth UX

- Optional deep-link return to pending practice screen after sign-in.
