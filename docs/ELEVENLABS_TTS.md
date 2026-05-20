# ElevenLabs TTS (optional playback)

Text practice is **text by default** (Groq tutor + optional Gemini fallback). ElevenLabs adds **on-demand** audio for assistant replies — only when the user taps **Play voice**.

## Why a proxy Edge Function?

- `ELEVENLABS_API_KEY` stays in Supabase secrets.
- Cost controls (character limit) run server-side.
- Text practice still works if TTS fails or is not configured.

## Deploy

```bash
supabase secrets set ELEVENLABS_API_KEY="NEW_ELEVENLABS_KEY"
supabase functions deploy elevenlabs-tts
```

Optional:

```bash
supabase secrets set ELEVENLABS_MODEL=eleven_flash_v2_5
supabase secrets set ELEVENLABS_DEFAULT_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

## Client env

```bash
EXPO_PUBLIC_ELEVENLABS_TTS_URL=https://<PROJECT_REF>.supabase.co/functions/v1/elevenlabs-tts
```

Never use `EXPO_PUBLIC_ELEVENLABS_API_KEY`.

## Request

`POST` with Supabase user JWT (`Authorization: Bearer …`).

```json
{
  "text": "Great job — try saying it once more, a little slower.",
  "voiceId": "EXAVITQu4vr4xnSDxMaL",
  "scenarioId": "coffee_order",
  "learningPath": "business_english"
}
```

| Field | Notes |
|-------|--------|
| `text` | Required. Max **500** characters (server enforced). |
| `voiceId` | Optional. Defaults per learning path in app, then `ELEVENLABS_DEFAULT_VOICE_ID`. |
| `scenarioId` | Required for logging/analytics context. |
| `learningPath` | `business_english` \| `spanish` \| `mandarin` |

## Response

```json
{
  "audioBase64": "<mp3 bytes>",
  "contentType": "audio/mpeg",
  "characterCount": 42,
  "voiceId": "EXAVITQu4vr4xnSDxMaL",
  "truncated": false
}
```

The app plays audio via `expo-av` using a `data:audio/mpeg;base64,…` URI.

## App behavior

- **No auto-play** — button only after each assistant reply.
- Friendly inline error if TTS fails; chat, corrections, XP, and streaks are unaffected.
- If `EXPO_PUBLIC_ELEVENLABS_TTS_URL` is empty, the button is disabled with a hint.

## Cost tips

- Uses `eleven_flash_v2_5` by default (lower cost).
- 500-character cap per request.
- User-initiated playback only (not every message).

## Security

Rotate any ElevenLabs key that was shown in screenshots or chat:

1. Revoke the old key in [ElevenLabs → API keys](https://elevenlabs.io/app/developers/api-keys).
2. Create a new key named `voxa`.
3. `supabase secrets set ELEVENLABS_API_KEY="NEW_KEY"`
