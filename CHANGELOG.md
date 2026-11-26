# Changelog

## Current production line

Voxa is publicly available on the Apple App Store as **Voxa AI Speaking Practice**.

The repository mobile configuration is currently version **1.0.0**. The product includes realistic text practice, voice playback, Business English / Spanish / Mandarin paths, structured corrections, XP/streak progress, history, and the AI-provider architecture documented in this repo.

## 1.0.1 — unreleased (prepared 2026-11-26)

Fixes and hardening; no new user-facing features. Realtime voice remains disabled.

- Account deletion: `delete-account` Edge Function source committed and tested; deleting an account also clears on-device practice data. Privacy screen documents in-app deletion.
- Usage limits: quota tables are now in migrations; the coach message count is atomic and the daily session limit counts sessions started; per-user daily cap on voice playback (TTS).
- Security: voice playback (TTS) requires a signed-in user; Diagnostics hidden in App Store builds.
- Copy: removed beta/developer-facing text from auth errors and the crash screen.
- Engineering: unit tests (`npm test`), SQL migration tests, CI checks every Edge Function; Dependabot no longer proposes Expo-SDK-incompatible upgrades.

## Earlier work

Pre-App-Store TestFlight and beta milestones remain documented under `docs/`. Those files are historical release evidence, not the current product-status source of truth.

## Policy

Add a dated release entry whenever the App Store marketing version changes.
