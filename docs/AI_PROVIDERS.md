# AI providers (text practice)

Voxa’s **default** practice mode is **text-first**: low cost, works in Expo Go, no OpenAI Realtime bill.

## Architecture

```
Expo app  →  Supabase Edge Functions  →  Groq / Gemini / ElevenLabs
              (JWT required)              (API keys in secrets only)
```

The mobile app **never** receives `GROQ_API_KEY`, `GEMINI_API_KEY`, or `ELEVENLABS_API_KEY`.

## Providers

| Role | Provider | When |
|------|----------|------|
| Tutor + corrections | **Groq** (primary) | `VOXA_AI_PROVIDER=groq` (default) |
| Tutor fallback | **Gemini Flash Lite** | Groq timeout, rate limit, 5xx, or invalid JSON |
| Optional reply audio | **ElevenLabs** | User taps **Play voice** only |
| Premium live voice | **OpenAI Realtime** | `EXPO_PUBLIC_AI_MODE=voice` (future / experimental) |

## Edge Function: `ai-chat-coach`

**Deploy**

```bash
supabase functions deploy ai-chat-coach
```

**Secrets** (rotate any key that appeared in screenshots or chat):

```bash
supabase secrets set VOXA_AI_PROVIDER=groq
supabase secrets set GROQ_API_KEY="NEW_GROQ_KEY"
supabase secrets set GEMINI_API_KEY="NEW_GEMINI_KEY"
supabase secrets set ELEVENLABS_API_KEY="NEW_ELEVENLABS_KEY"
```

Optional model overrides:

```bash
supabase secrets set GROQ_MODEL=llama-3.1-8b-instant
supabase secrets set GEMINI_MODEL=gemini-2.0-flash-lite
```

Default models (low cost):

- **Groq:** `llama-3.1-8b-instant` — free-tier friendly tutoring
- **Gemini fallback:** `gemini-2.0-flash-lite`

**Request**

```json
{
  "scenarioId": "coffee_order",
  "learningPath": "business_english",
  "userLevel": "intermediate",
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

**Response**

```json
{
  "reply": "…",
  "corrections": [{ "original": "…", "improved": "…", "explanation": "…" }],
  "encouragement": "…",
  "_meta": { "providerUsed": "groq", "usedFallback": false }
}
```

**Health** (no keys exposed):

```bash
curl "https://<PROJECT_REF>.supabase.co/functions/v1/ai-chat-coach?health=1" \
  -H "Authorization: Bearer <USER_ACCESS_TOKEN>" \
  -H "apikey: <ANON_KEY>"
```

## Client env (`.env`)

```bash
EXPO_PUBLIC_AI_MODE=text
EXPO_PUBLIC_AI_CHAT_COACH_URL=https://<PROJECT_REF>.supabase.co/functions/v1/ai-chat-coach
EXPO_PUBLIC_ELEVENLABS_TTS_URL=https://<PROJECT_REF>.supabase.co/functions/v1/elevenlabs-tts
EXPO_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Do **not** add `EXPO_PUBLIC_GROQ_API_KEY`, `EXPO_PUBLIC_GEMINI_API_KEY`, or `EXPO_PUBLIC_ELEVENLABS_API_KEY`.

## Fallback behavior

When `VOXA_AI_PROVIDER=groq` (default):

1. Call Groq (`llama-3.1-8b-instant`) with a ~25s timeout.
2. On retriable errors (429, 502–504, timeout, rate limit) **or invalid/missing JSON**, call Gemini if `GEMINI_API_KEY` is set.
3. Return the same JSON schema either way.

When `VOXA_AI_PROVIDER=gemini`:

1. Call Gemini first.
2. Fall back to Groq on the same failure conditions if `GROQ_API_KEY` is set.

If only one provider key is configured, that provider is used.

## Premium voice (later)

OpenAI Realtime remains in the codebase for **live** voice sessions. Enable with:

```bash
EXPO_PUBLIC_AI_MODE=voice
EXPO_PUBLIC_REALTIME_SESSION_URL=https://<PROJECT_REF>.supabase.co/functions/v1/realtime-session
```

Requires a dev/EAS build with native audio — not Expo Go.

## Diagnostics

Profile → **Diagnostics** shows AI mode, configured URLs, and coach health (`groq: configured`, etc.). Provider keys are **server-side only** — never shown in the app.

See also [ELEVENLABS_TTS.md](./ELEVENLABS_TTS.md) for optional playback.
