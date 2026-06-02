# App Review resubmission checklist

Use this after installing the new TestFlight build (post `3592aa9` + release polish).

## App Store Connect — Privacy (manual)

In **App Store Connect → App Privacy**:

1. **Product Interaction** (or equivalent analytics/usage data type):
   - **Purpose:** App Functionality
   - **Linked to user:** Yes
   - **Used for tracking:** **No**
2. Do **not** declare tracking if you do not use ATT — Voxa does not implement App Tracking Transparency.
3. **Microphone:** Used for practice sessions the user starts (if declared).
4. **Contact / Support URL:** `https://voxxa.netlify.app/support/`
5. **Privacy Policy URL:** `https://voxxa.netlify.app/privacy/`

## App Review notes (paste in Resolution Center / Review Notes)

```
This version of Voxa is entirely free — no in-app purchases, subscriptions, paywalls, or externally purchased unlocks.

Account creation: free email/password sign-in from Profile → Sign in.
Account deletion: Profile → Delete account → type DELETE → check confirmation → Delete account permanently.

Features in this build:
- Free text AI practice and guided lessons
- Optional “Hear this response” voice playback (daily usage limit)
- Session history and XP when signed in

Live voice conversation and premium teasers are not shown in this production build.

Support: support@voxa.app
Privacy: https://voxxa.netlify.app/privacy/
```

## TestFlight QA (10 steps)

1. Install the **new** build from TestFlight (not build 2).
2. Fresh launch → complete onboarding or skip to Practice.
3. **Practice → Quick Practice → Job Interview** → send a text message → receive AI reply.
4. Tap **Hear this response** once (confirm playback or daily-limit message — not “paid plan”).
5. **Guided Lessons** → open lesson map → complete or start a lesson.
6. **Progress / History** — confirm XP or session appears after practice (signed in).
7. **Profile → Sign in** — create or sign in with email/password.
8. **Profile → Privacy** and **Terms** — confirm finished copy and support email.
9. **Profile → Delete account** — type `DELETE`, confirm → lands on welcome, account gone.
10. Confirm **no** “Premium”, “Coming soon”, “Beta”, or “TestFlight” copy anywhere in the app.

## EAS production env (required)

```bash
export NODE_OPTIONS='--use-bundled-ca'
eas env:create --name EXPO_PUBLIC_DELETE_ACCOUNT_URL \
  --value "https://nsgrmaygwzdiyiijgpvd.supabase.co/functions/v1/delete-account" \
  --environment production --visibility plaintext
```

Verify:

```bash
eas env:list --environment production
```

## Build & submit

```bash
export NODE_OPTIONS='--use-bundled-ca'
eas build --profile production --platform ios
eas submit --platform ios --latest
```

(`eas submit` may prompt for App Store Connect app ID on first use.)

## Supabase (after TTS copy fix)

```bash
supabase functions deploy elevenlabs-tts
```
