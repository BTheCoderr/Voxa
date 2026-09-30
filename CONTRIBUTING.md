# Contributing to Voxa

Voxa is a shipped AI speaking-practice product built around realistic conversation reps, gentle coaching, and progress over perfection.

## Before opening a pull request

```bash
npm ci
npm run typecheck
```

For Edge Function changes, run the Deno checks mirrored in GitHub Actions. For marketing-site changes, install and build under `marketing/`.

Keep provider credentials server-side. Never commit OpenAI, Groq, Gemini, ElevenLabs, Supabase service-role, RevenueCat secret, or other private credentials.

## Product scope

Changes should support practical speaking practice, learner confidence, progress, and reliability. Keep user-facing claims aligned with what the shipped App Store build actually supports.

## Deployment

GitHub merge, EAS build, App Store submission, and Netlify publication are separate release steps.
