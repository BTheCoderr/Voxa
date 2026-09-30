# Voxa

<!-- repo-intro:start -->
**Project snapshot:** Voxa is an AI-powered speaking-practice app for iOS and Android using real-time voice conversations, Supabase-backed identity/data, and a separate Next.js marketing site.

**What it demonstrates:** Expo/React Native · OpenAI Realtime · Supabase · EAS/TestFlight · mobile product delivery.
<!-- repo-intro:end -->

AI-powered **speaking practice** for iOS and Android — **Expo** (React Native), **OpenAI Realtime** voice, **Supabase** for auth and data. Distributed with **EAS** (dev clients and TestFlight).

- Copy `.env.example` → `.env` locally; use **EAS secrets** for release builds (see `docs/EAS_BUILD.md`).

**Marketing site (web):** [`/marketing`](./marketing) — Next.js static landing + legal pages; deploy separately (e.g. Netlify). Not the Expo app. Root **`netlify.toml`** sets `base = "marketing"` so Netlify only builds that site.
