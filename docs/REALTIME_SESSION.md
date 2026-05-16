# Realtime session minting (Voxa)

This document describes the **`realtime-session`** Supabase Edge Function: a small, server-only bridge between the Expo app and OpenAI’s **Realtime API**.

## Why this exists

- The **OpenAI API key must never ship inside the mobile app** or in any `EXPO_PUBLIC_*` variable.
- The Realtime API issues a **short-lived client secret** (`client_secret.value`) that the app will later use to connect over WebRTC/WebSocket (not implemented in this pass).
- Supabase Edge Functions run **server-side** and read secrets from the **Supabase Secret Store**.

## Deploy

Prerequisites: [Supabase CLI](https://supabase.com/docs/guides/cli), project linked (`supabase link`).

```bash
# From repo root
supabase secrets set OPENAI_API_KEY=sk-...
# Optional — defaults to gpt-4o-realtime-preview in code if unset:
supabase secrets set OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview

supabase functions deploy realtime-session
```

JWT verification is enabled in [`supabase/config.toml`](../supabase/config.toml) (`verify_jwt = true`). The CLI deploy picks that up; do **not** pass `--no-verify-jwt` in production.

For **local** `supabase functions serve`, you may use flags that skip JWT if you are testing without a logged-in user — see current CLI docs.

After deploy, set the app’s public URL:

```bash
# .env (Expo)
EXPO_PUBLIC_REALTIME_SESSION_URL=https://<PROJECT_REF>.supabase.co/functions/v1/realtime-session
```

Use the **same** Supabase project as `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` so the user’s `access_token` and `apikey` header match what the gateway expects.

## Secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `OPENAI_API_KEY` | Yes | Server-only key for `POST https://api.openai.com/v1/realtime/sessions` |
| `OPENAI_REALTIME_MODEL` | No | Model id (defaults in function if omitted) |

Set secrets in **Dashboard → Project Settings → Edge Functions → Secrets**, or via `supabase secrets set`.

## Request

`POST` JSON body:

```json
{
  "scenarioId": "job_interview",
  "learningPath": "business_english",
  "userLevel": "intermediate"
}
```

### Fields

| Field | Type | Values |
|-------|------|--------|
| `scenarioId` | string | Non-empty (e.g. app scenario slug) |
| `learningPath` | string | `business_english` \| `spanish` \| `mandarin` |
| `userLevel` | string | `beginner` \| `intermediate` \| `advanced` |

### Headers (from the Expo app)

- `Authorization: Bearer <supabase_user_access_token>`
- `apikey: <EXPO_PUBLIC_SUPABASE_ANON_KEY>` (included automatically by `fetchRealtimeClientSecret` when configured)
- `Content-Type: application/json`

With `verify_jwt = true` in `supabase/config.toml`, anonymous calls are rejected at the gateway.

## Success response

```json
{
  "clientSecret": "ek_...",
  "expiresAt": 1234567890,
  "sessionId": "sess_...",
  "model": "gpt-4o-realtime-preview-..."
}
```

- `clientSecret` — ephemeral Realtime token (`client_secret.value` from OpenAI).
- `expiresAt` — Unix timestamp (seconds) from OpenAI’s `client_secret.expires_at`.
- `sessionId` — OpenAI session id (`id` field).
- `model` — Resolved model for the session.

## Errors

HTTP 4xx/5xx with JSON:

```json
{ "error": "human-readable message", "code": "optional_machine_code" }
```

The app surfaces `error` strings; API keys are never returned.

## Product behavior (session instructions)

The function configures OpenAI with **instructions** that encode Voxa’s coach persona: realistic scenarios, **soft corrections**, **pronunciation help**, confidence-building tone, and path-specific behavior (Business English vs Spanish vs Mandarin).

## Local development

```bash
supabase start
supabase secrets set OPENAI_API_KEY=sk-...  # local secrets if supported in your setup
supabase functions serve realtime-session
```

Consult current Supabase docs for local secrets and JWT behavior.

## Next steps (not in this pass)

- Connect the client to Realtime using `clientSecret` (WebRTC or WebSocket).
- Log `sessionId` + metadata to your database for history and billing.
