# Voxa — TestFlight checklist

Use this list before uploading a build to App Store Connect TestFlight.

## App identity (App Store Connect + `app.json`)

| Item | Current / action |
|------|------------------|
| **Bundle ID** | `com.baheemferrell.voxa` in `app.json` — edit one place if you change it; must match App Store Connect. |
| **App name** | `Voxa` — consider listing title **Voxa Beta** for clarity to testers |
| **Version** | `expo.version` (e.g. `1.0.0`); bump per submission |
| **Build number** | Must increment every upload (EAS: `ios.buildNumber` / Android `versionCode`) |
| **Support email** | Set in App Store Connect → App Information → **Support URL / Marketing** as appropriate; use a monitored inbox |
| **Privacy Policy URL** | Replace placeholder routes in-app (`/legal/privacy`) with a **public HTTPS** URL and paste the same in App Store Connect |

## Permissions & usage strings

| Item | Status |
|------|--------|
| **Microphone** | `NSMicrophoneUsageDescription` in `app.json` → `ios.infoPlist`: *"Voxa uses the microphone for realtime speaking practice with AI."* Keep this accurate and user-facing. |
| **Android `RECORD_AUDIO`** | Declared under `expo.android.permissions`. |

## Auth & backend (beta)

- **Supabase**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` in EAS secrets / `.env` for release builds.
- **Magic link / redirect**: Confirm `emailRedirectTo` (`voxa://`) matches your app scheme and any **Supabase Auth redirect allow list**.
- **Realtime voice**: `EXPO_PUBLIC_REALTIME_SESSION_URL` must point at the deployed `realtime-session` Edge Function; set **OpenAI** secrets only on the server, never in the client.
- **Test account**: Document a dedicated test email for Apple review if needed; magic-link flow requires inbox access.

## Analytics (optional)

- **PostHog**: `EXPO_PUBLIC_POSTHOG_KEY` + host; events are no-ops if the key is omitted.

## Legal & copy

- In-app **Privacy** and **Terms** under `/legal/*` are **placeholders** until you publish real policies and URLs.
- Beta copy in-app states: TestFlight beta, imperfect AI, practice tool (not a certified test).

## Known limitations (share with testers)

- Voice requires a **development/production build** with native audio modules — **not** Expo Go.
- **Web** does not support the full voice loop.
- **Signed-out** users: progress stays on-device; cloud history requires sign-in + Supabase.
- **RevenueCat** / monetization not enabled in this beta pass.

## Pre-upload commands

- `npx tsc --noEmit`
- Run on a **physical iOS** device: onboarding → scenario → full voice session → end recap → history & profile.

## After TestFlight

- Collect crashes from Xcode / TestFlight.
- Replace placeholder legal URLs and support contact before public App Store submission.
