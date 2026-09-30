# Voxa

<!-- repo-intro:start -->
**Project snapshot:** Voxa is a mobile-first AI speaking-practice app for iOS and Android. It combines real-time voice or lower-cost text/dictation practice, structured corrections, daily practice missions, progress tracking, and Supabase-backed account sync.

**What it demonstrates:** Expo / React Native · TypeScript · OpenAI Realtime · Groq + Gemini fallback · Supabase · ElevenLabs · RevenueCat wiring · PostHog · EAS/TestFlight/App Store delivery.
<!-- repo-intro:end -->

## What Voxa does

Voxa helps people practice the conversations that are hard to rehearse alone. Users choose a learning path, enter a realistic scenario, respond naturally, and get lightweight coaching instead of a classroom-style lesson.

Current learning paths:

- Business English
- Spanish
- Mandarin

Current scenario library includes job interviews, meetings, networking, small talk, airports, restaurants, customer support, travel, and dating conversations.

## Product experience

- **Daily mission** — one focused practice challenge each day
- **Scenario missions** — every scenario has a skill focus, difficulty, and concrete goal
- **Voice mode** — speech-to-speech practice using the realtime stack
- **Text + dictation mode** — lower-cost practice with AI replies and structured corrections
- **Progress** — XP, streaks, and five calm progression stages: Foundation → Momentum → Flow → Range → Presence
- **Practice journal** — synced conversation history and summaries for signed-in users
- **Local-first progress** — the app remains useful before account creation
- **Three learning paths** — Business English, Spanish, and Mandarin
- **Diagnostics** — tester-facing health checks for the realtime and AI services

## Architecture

The mobile app is built with Expo Router and React Native.

- **Auth + data:** Supabase
- **Realtime voice:** OpenAI Realtime session flow
- **Text coaching:** Groq with Gemini fallback
- **Voice playback:** ElevenLabs through a server-side function
- **Analytics:** PostHog
- **Purchases foundation:** RevenueCat
- **Build + release:** EAS
- **Marketing site:** separate Next.js app under /marketing

The public client never needs provider secret keys. AI/TTS provider secrets belong on the server side.

## Local setup

1. Copy .env.example to .env.
2. Add the public Supabase and service URLs required for the mode you are testing.
3. Run the mobile app with Expo / a development build.

Release builds should use EAS environment secrets instead of committing credentials. See docs/EAS_BUILD.md.

## Important docs

- docs/ARCHITECTURE.md
- docs/AI_PROVIDERS.md
- docs/REALTIME_SESSION.md
- docs/EAS_BUILD.md
- docs/SECURITY.md
- docs/BETA_QA_CHECKLIST.md

## Marketing site

The web marketing experience lives in /marketing. Root netlify.toml sets base = "marketing", so Netlify builds the marketing site rather than the Expo app.
