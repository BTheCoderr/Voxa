# Voxa

<!-- repo-intro:start -->
**Project snapshot:** Voxa is a mobile-first AI speaking-practice app for iOS and Android. It combines realistic conversation scenarios, realtime voice, lower-cost text/dictation practice, structured corrections, daily missions, progress tracking, and synced practice history.

**What it demonstrates:** Expo / React Native · TypeScript · OpenAI Realtime · Groq + Gemini fallback · Supabase · ElevenLabs · RevenueCat integration foundation · PostHog · EAS/TestFlight release engineering.
<!-- repo-intro:end -->

> **Practice real conversations out loud.**

Voxa is designed for the conversations that are hard to rehearse alone: interviews, meetings, travel, networking, small talk, customer support, restaurants, and dating.

Instead of turning speaking practice into another classroom-style lesson, Voxa puts the user inside a realistic scenario and gives lightweight coaching after they respond.

## Product experience

### Practice

- daily speaking mission
- scenario-based sessions with a clear skill focus and goal
- Business English, Spanish, and Mandarin learning paths
- voice-first realtime conversations
- lower-cost text + dictation practice
- structured corrections without turning every response into a grade

### Progress

- XP
- speaking-day streaks
- five progression stages: **Foundation → Momentum → Flow → Range → Presence**
- signed-in practice journal
- session history and summaries
- local-first progress before account creation

### Product operations

- tester-facing AI/realtime diagnostics
- EAS build configuration
- TestFlight checklist
- App Store metadata and screenshot plan
- privacy/security documentation
- separate Next.js marketing site under `/marketing`

## Architecture

```mermaid
flowchart LR
    A[Expo mobile app] --> B[Supabase Auth + data]
    A --> C[Realtime session endpoint]
    C --> D[OpenAI Realtime]
    A --> E[Text coaching endpoint]
    E --> F[Groq]
    E --> G[Gemini fallback]
    A --> H[TTS endpoint]
    H --> I[ElevenLabs]
    A --> J[PostHog]
    A --> K[RevenueCat foundation]
```

Provider secret keys do not belong in the public mobile bundle. Realtime, text-generation, and TTS provider credentials are kept behind server-side functions.

## AI delivery strategy

Voxa uses different AI paths for different product needs rather than forcing every interaction through the most expensive mode.

- **Realtime voice:** OpenAI Realtime for natural speech-to-speech practice.
- **Text coaching:** Groq as the primary lower-cost path with Gemini fallback.
- **Voice playback:** ElevenLabs through a server-side function.
- **Diagnostics:** dedicated health/configuration surfaces help testers distinguish provider outages from client bugs.

That split keeps the experience flexible while giving the product multiple cost/performance options.

## Tech stack

| Layer | Technology |
| --- | --- |
| Mobile | Expo 54, React Native 0.81, Expo Router |
| Language | TypeScript |
| Auth + data | Supabase |
| Realtime voice | OpenAI Realtime |
| Text AI | Groq + Gemini fallback |
| TTS | ElevenLabs |
| Local persistence | AsyncStorage / SecureStore |
| Analytics | PostHog |
| Purchases foundation | RevenueCat |
| Builds/releases | EAS |
| Marketing | Next.js app in `/marketing` |

## Repository structure

```text
app/              Expo Router screens and navigation
components/       reusable mobile UI
lib/              AI, auth, persistence, analytics, and product logic
assets/           app icons and visual assets
supabase/         backend functions / database work
docs/             architecture, security, release, QA, screenshots
marketing/        separate web marketing site
eas.json          release profiles
app.json          native app configuration
```

## Local setup

```bash
cp .env.example .env
npm install
npm start
```

For native voice functionality, use a development or production build rather than Expo Go.

```bash
npm run ios
# or
npm run android
```

Release builds should use EAS-managed environment secrets instead of committed provider credentials.

## Release engineering

The repository tracks the non-code work needed to ship a mobile AI product, including:

- bundle identifiers and native permission strings
- EAS release configuration
- auth redirect requirements
- physical-device QA
- TestFlight testing notes
- App Store metadata
- screenshot capture plan
- security boundaries
- provider-specific architecture documentation

## Key documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [AI providers](./docs/AI_PROVIDERS.md)
- [Realtime session flow](./docs/REALTIME_SESSION.md)
- [Security](./docs/SECURITY.md)
- [EAS build guide](./docs/EAS_BUILD.md)
- [TestFlight checklist](./docs/TESTFLIGHT.md)
- [Beta QA checklist](./docs/BETA_QA_CHECKLIST.md)
- [App Store metadata](./docs/APP_STORE_METADATA.md)
- [Screenshot plan](./docs/SCREENSHOTS.md)

## Product principle

Voxa rewards **showing up and speaking**, not perfect answers.

The goal is short, realistic practice that builds comfort through repetition.
