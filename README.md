# Voxa

AI-powered **speaking practice** for iOS and Android — **Expo** (React Native), **OpenAI Realtime** voice, **Supabase** for auth and data. Distributed with **EAS** (dev clients and TestFlight).

- Copy `.env.example` → `.env` locally; use **EAS secrets** for release builds (see `docs/EAS_BUILD.md`).

**Marketing site (web):** [`/marketing`](./marketing) — Next.js static landing + legal pages; deploy separately (e.g. Netlify). Not the Expo app. Root **`netlify.toml`** sets `base = "marketing"` so Netlify only builds that site.
