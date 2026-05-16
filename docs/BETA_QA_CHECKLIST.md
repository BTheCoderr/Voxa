# Voxa — TestFlight / beta QA checklist

Use a **physical iPhone** with an **EAS development** or **production** build (not Expo Go). Mark each row when verified.

## Environment

- [ ] Build includes `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_REALTIME_SESSION_URL` (EAS secrets or local `.env` for dev client).
- [ ] Device has network (Wi‑Fi or cellular) suitable for WebSocket + API calls.

## Account & onboarding

- [ ] **Cold launch** — app opens to splash / onboarding or main tabs without crash.
- [ ] **Onboarding** — complete language → goals → microphone explainer → **Enter Voxa** lands on Practice tab.
- [ ] **Sign in** — Profile → Sign in; magic link email sends (Supabase configured); return to app and session restores (if testing full flow).

## Microphone

- [ ] **Permission** — first voice session triggers system mic prompt; copy matches product intent.
- [ ] **Allow** — session proceeds after granting.
- [ ] **Deny** — app shows a clear error (user can retry after enabling in Settings).

## Voice session (Practice)

- [ ] **Start session** — leaves idle; orb / status shows connecting → live.
- [ ] **Assistant audio** — AI reply is audible (speaker volume OK; not muted).
- [ ] **User speech** — transcript or partial user text appears (if model returns input transcription).
- [ ] **Assistant text** — transcript lines appear while or after assistant speaks.
- [ ] **Corrections** — at least sometimes “gentle note” chips appear after assistant lines (model-dependent).
- [ ] **Mute** — mic mute stops sending (or silences per implementation); unmute restores.
- [ ] **End session** — session tears down; **recap** shows duration, XP (if transcript), correction count when applicable.
- [ ] **Try again** after error — user can restart without relaunching app.

## Progress & cloud

- [ ] **XP / streak** — after a session with transcript, Progress tab reflects XP and/or streak (per rules).
- [ ] **History** — signed in + Supabase: completed session appears in history list with plausible title/summary.
- [ ] **Pull to refresh** on History loads latest.

## Profile & diagnostics

- [ ] **Profile** — Privacy / Terms open.
- [ ] **Diagnostics** (`Profile` → Diagnostics for testers) — toggles reflect reality: Supabase configured, signed in, realtime URL, mic status, app version.
- [ ] **Sign out** — clears session; app behaves for signed-out mode (local progress only if applicable).

## Regression sparks

- [ ] **Background app** mid-session — behavior acceptable (may end session; no stuck audio).
- [ ] **Low battery / network blip** — error surfaces without hard crash; user can retry.

## Notes

- **Date tested:** _______________
- **Build profile:** development / preview / production  
- **Build number / version:** _______________
- **Tester:** _______________
