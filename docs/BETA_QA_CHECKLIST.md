# Voxa — physical iPhone beta QA checklist

Use a **physical iPhone** with an **EAS development, preview, or production build**. Do not sign off native voice from Expo Go or the iOS simulator.

## Build + environment

- [ ] Record the commit SHA, app version, native build number, EAS profile, iPhone model, and iOS version.
- [ ] `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are present.
- [ ] Text coach, TTS, and Realtime URLs resolve automatically from the Supabase URL unless an explicit override is intentionally configured.
- [ ] Diagnostics shows Supabase configured, expected AI mode, realtime URL configured, and the expected app/build identity.
- [ ] `npm run check:config`, TypeScript, Edge Function checks, and marketing build are green on the release commit.

## Cold launch + onboarding

- [ ] Cold launch does not crash or hang.
- [ ] Complete **language → goals → practice difficulty → microphone explainer**.
- [ ] Beginner / Intermediate / Advanced choice persists for the selected learning path.
- [ ] Switch Business English / Spanish / Mandarin and confirm each path can keep its own difficulty.
- [ ] Relaunch the app and confirm onboarding/preferences remain stable.

## Account + recovery

- [ ] Create an account with email + password.
- [ ] Sign out and sign back in with password.
- [ ] Incorrect password shows a useful error without exposing technical details.
- [ ] **Forgot password** sends a generic confirmation message.
- [ ] Password-reset email opens Voxa through `voxa://auth/callback`.
- [ ] Recovery link lands on **Choose a new password**.
- [ ] New password works after sign-out/sign-in.
- [ ] Optional magic-link sign-in still returns through `voxa://auth/callback`.
- [ ] Auth callback handles an expired link without trapping the user.

## Microphone + audio permission

- [ ] First voice session requests microphone permission with accurate system copy.
- [ ] Allowing permission continues into the session.
- [ ] Denying permission gives a recoverable explanation.
- [ ] Blocking permission permanently gives a clear Settings-oriented message.
- [ ] Diagnostics reports the same mic state the OS is actually using.

## Text practice

- [ ] Start text practice at Beginner, Intermediate, and Advanced.
- [ ] Active difficulty is visible in the practice header.
- [ ] Send several turns; replies remain usable with the keyboard open.
- [ ] Corrections render without overflowing on a small iPhone.
- [ ] **Hear this response** plays ElevenLabs audio.
- [ ] Starting another playback stops/unloads the prior playback cleanly.
- [ ] Finish session → Coach Recap renders strength, focus, corrections, next mission, duration, and XP.
- [ ] **Practice this next** carries the new focus + mission into the next scenario.

## Realtime voice practice

- [ ] Start session: idle → permission if needed → minting → connecting → live.
- [ ] Assistant audio is audible through iPhone speaker.
- [ ] User speech produces transcript/turn data when available.
- [ ] Assistant transcript appears without obvious duplication.
- [ ] Mute/unmute behaves correctly.
- [ ] End session tears down audio and shows Coach Recap.
- [ ] Retry after a connection error works without relaunching.

### Audio route / interruption checks

- [ ] Test with **AirPods/Bluetooth** connected before launch.
- [ ] Connect/disconnect AirPods while Voxa is idle; next session still works.
- [ ] Test speaker volume low/high and iPhone silent mode.
- [ ] Background Voxa mid-session, then foreground it; no stuck mic/audio loop.
- [ ] Lock/unlock the phone mid-session; app recovers or ends cleanly.
- [ ] Trigger an interruption (phone/FaceTime/alarm if practical); audio does not remain stuck afterward.
- [ ] Switch Wi-Fi ↔ cellular or briefly lose network; user gets a recoverable state instead of a hard crash.

## Coaching Journal + Memory

- [ ] Completed signed-in session appears in History.
- [ ] Tap History entry → Coaching Journal opens.
- [ ] Structured recap shows strength, focus, next mission, and saved corrections.
- [ ] Older session without structured recap still opens with its fallback summary.
- [ ] **Practice this focus** reopens targeted practice with the expected focus/mission.
- [ ] Progress → **Voxa remembers** reflects recent coached sessions once enough reviewed data exists.

## Correction Mastery

- [ ] New saved corrections appear as new evidence rather than fake recurring patterns.
- [ ] A genuinely repeated correction can become **Needs another rep**.
- [ ] Status explanation shows why Voxa chose the label.
- [ ] **Practice this** launches the target phrase/skill.
- [ ] Mastered-for-now copy remains qualified rather than claiming permanent mastery.

## Weekly Coach Plan

- [ ] Plan shows 2–3 reps for a path with enough evidence.
- [ ] Plan stays stable after completing a rep; remaining items do not reshuffle.
- [ ] Completing a matching scenario marks one plan item complete.
- [ ] Focus + mission arrive inside the launched practice session.
- [ ] Switch learning paths and confirm plans stay path-specific.

## Adaptive Difficulty

- [ ] Practice Home and Profile show the same selected difficulty for the current path.
- [ ] Beginner responses are visibly more scaffolded than Advanced responses.
- [ ] Advanced practice is not silently simplified.
- [ ] Difficulty recommendation does not appear until enough sessions/learner turns exist.
- [ ] A recommendation never changes the level automatically.
- [ ] Accepting a recommendation updates the preference and subsequent sessions.

## Progress Trends

- [ ] Progress snapshot opens full Trends screen.
- [ ] Recent and earlier windows are equal-sized.
- [ ] Every claim shows exact evidence/denominators.
- [ ] Correction activity is clearly described as coaching activity, not a proficiency score.
- [ ] Paths without enough history show the forming/needs-more-history state instead of fake trends.
- [ ] Older sessions without Coach Recaps still allow range/difficulty/correction trends where data exists.

## Come-back nudges

- [ ] At most one Coach nudge appears on Practice Home.
- [ ] One-rep-left / late-week / streak-risk / streak-recovery / quiet-comeback states use the intended priority.
- [ ] Nudge button launches the exact referenced rep.
- [ ] **Not today** hides all nudges for the rest of the device day.
- [ ] Profile toggle disables Come-back nudges entirely and Home reflects it immediately.
- [ ] Streak-recovery wording does not claim an old streak can be restored.

## Progress + persistence

- [ ] XP increases after a qualifying completed session.
- [ ] Streak/date updates correctly across midnight in the tester timezone.
- [ ] Coach stage remains separate from practice difficulty.
- [ ] Signed-in cloud history survives app relaunch.
- [ ] Sign-out does not expose the prior user's account-owned history to the next user.

## Legal + support + release copy

- [ ] Privacy screen accurately matches current data/audio behavior.
- [ ] Terms screen is reviewed for the intended release.
- [ ] App Store Privacy Policy URL and Support URL are public HTTPS URLs.
- [ ] Review all in-app legal copy against the public policies before the next public App Store update.
- [ ] App Store screenshots and metadata match the actual current product.

## Exit criteria

A release candidate is **not signed off** until:
- [ ] no reproducible crash exists in onboarding/auth/practice/end-session flows;
- [ ] microphone + Realtime have passed on a physical iPhone;
- [ ] TTS has passed on a physical iPhone;
- [ ] auth recovery has been proven from the real email link;
- [ ] all GitHub quality gates pass on the exact release commit.

## Test record

- **Date:** ____________________
- **Commit SHA:** ____________________
- **Version / build:** ____________________
- **EAS profile:** development / preview / production
- **iPhone / iOS:** ____________________
- **Tester:** ____________________
- **Blocking issues:** ____________________
