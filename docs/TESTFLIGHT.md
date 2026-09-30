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
- **Password auth**: verify sign up, sign in, sign out, and **Forgot password** from a real device.
- **Auth callback**: keep `voxa://auth/callback` in the Supabase Auth redirect allow list. Optional magic link and password recovery both reuse it.
- **Realtime voice**: the realtime endpoint derives from `EXPO_PUBLIC_SUPABASE_URL` unless an explicit override is intentionally set. Keep **OpenAI** secrets server-side only.
- **Test account**: Document a dedicated test email for Apple review if needed; magic-link flow requires inbox access.

## Analytics (optional)

- **PostHog**: `EXPO_PUBLIC_POSTHOG_KEY` + host; events are no-ops if the key is omitted.

## Legal & copy

- In-app **Privacy** and **Terms** now provide product-aligned overviews; review them against the public legal policies before release.
- Beta copy in-app states: TestFlight beta, imperfect AI, practice tool (not a certified test).

## Known limitations (share with testers)

- Voice requires a **development/production build** with native audio modules — **not** Expo Go.
- **Web** does not support the full voice loop.
- **Signed-out** users: progress stays on-device; cloud history requires sign-in + Supabase.
- **RevenueCat** is integration foundation only; do not market a paid entitlement unless the release actually enables one.
- TTS playback still uses deprecated `expo-av`; keep it on the physical-device QA list until migration to `expo-audio` is separately validated.

## Pre-upload commands

- `npm run check:config`
- `npm run typecheck`
- Confirm GitHub Edge Function + marketing build gates are green.
- Run the full **physical iPhone** checklist in `docs/BETA_QA_CHECKLIST.md`, including password recovery, text/TTS, realtime voice, AirPods/interruption handling, Journal/Mastery/Weekly Plan/Trends, and Come-back nudges.

## After TestFlight

- Collect crashes from Xcode / TestFlight.
- Fix every release-blocking item from the physical-device checklist.
- Review the in-app legal overviews and confirm public Privacy Policy + Support URLs before the next public App Store update.
