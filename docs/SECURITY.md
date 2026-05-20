# Voxa — Security & secrets

## What goes where

| Secret | Location | Never in |
|--------|----------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env`, EAS secrets | — (public by design) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env`, EAS secrets | — (public by design) |
| `EXPO_PUBLIC_AI_CHAT_COACH_URL` | `.env`, EAS secrets | — (public URL) |
| `EXPO_PUBLIC_ELEVENLABS_TTS_URL` | `.env`, EAS secrets | — (public URL) |
| `GROQ_API_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY` | Supabase Edge Function secrets | Expo `.env`, EAS public env, git |
| `OPENAI_API_KEY` | Supabase Edge Function secrets | Expo `.env`, git |
| `SUPABASE_SERVICE_ROLE_KEY` | CI/scripts only (if needed) | Expo `.env`, client, git |
| `DATABASE_URL` / DB password | Local `supabase` CLI, CI migrations | Expo `.env`, client, git |

The Expo app **only** reads `EXPO_PUBLIC_*` values via `lib/env.ts`.

## Local `.env`

- Copy from `.env.example`.
- Include **only** `EXPO_PUBLIC_*` and comments.
- `.env` is gitignored — do not commit it.

## Rotate before beta if exposed

If any of these appeared in chat, screenshots, or git history, **rotate immediately**:

1. **Groq** — [console.groq.com](https://console.groq.com) → revoke, create new key → `supabase secrets set GROQ_API_KEY="..."`
2. **Gemini** — Google AI Studio → revoke → `supabase secrets set GEMINI_API_KEY="..."`
3. **ElevenLabs** — [API keys](https://elevenlabs.io/app/developers/api-keys) → revoke → `supabase secrets set ELEVENLABS_API_KEY="..."`
4. **Supabase service role** — Dashboard → Settings → API → roll service role key
5. **Supabase DB password** — Dashboard → Database → reset if pasted anywhere

After rotating Supabase keys, update any CI/scripts that use them. No app redeploy needed for Edge Function secrets-only changes.

## Edge Functions

- `ai-chat-coach` and `elevenlabs-tts` require a signed-in user JWT (`verify_jwt = true`).
- Provider keys never leave the server; clients only see sanitized error messages.
