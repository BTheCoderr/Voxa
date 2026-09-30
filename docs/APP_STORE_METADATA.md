# Voxa — App Store & TestFlight metadata

Replace placeholders (`YOUR_*`) before submission. Align **Privacy Policy URL** and **Support** with App Store Connect.

## App name (30 characters max)

**Voxa**

*(Optional TestFlight listing title: **Voxa Beta** for clearer tester expectations.)*

## Subtitle (30 characters max, iOS)

**Speak scenarios with AI**

## Promotional text (170 chars, can change without review)

**Practice real conversations out loud. Calm AI partner, gentle corrections, and streaks that reward showing up — not perfection. TestFlight beta.**

## Short description (Google Play / external, ~80 chars)

**Realistic voice scenarios with AI — build speaking confidence in short daily reps.**

## Keywords (iOS, 100 chars, comma-separated)

```
speaking,english,conversation,practice,AI,language,pronunciation,voice,streak,business
```

*(Adjust for your primary language track; avoid trademarked competitor names.)*

## Full description (template)

**Voxa** helps you practice **speaking** in realistic scenarios — meetings, travel, everyday moments — with a calm **AI conversation partner**.

• **Voice-first:** talk out loud; short sessions fit a busy day.  
• **Supportive feedback:** gentle corrections when it helps — no judgment.  
• **Adaptive coaching:** difficulty, weekly plans, and next missions respond to your saved practice history.  
• **Progress you can inspect:** XP, streaks, Coaching Journal, Correction Mastery, and factual recent-vs-earlier trends.  
• **History (signed in):** revisit session recaps, corrections, and targeted replay when cloud sync is enabled.

**Important:** Voxa is a **practice tool**, not a certified language exam or professional tutoring replacement. **AI responses may be imperfect.** TestFlight builds may change frequently — thank you for early feedback.

**Privacy:** we use the microphone only for sessions you start; see our privacy policy for data handling (replace with live URL).

## Privacy summary (App Store “Privacy Nutrition” alignment — narrative)

- **Microphone:** used to stream audio during **realtime practice sessions** you initiate; not used for unrelated recording.  
- **Account (optional):** email magic link via Supabase Auth; progress/history may sync when signed in.  
- **Analytics (optional):** product events (e.g. PostHog) if configured in the build; no ads SDK in this pass.  
- **Third parties:** AI inference via your backend (e.g. OpenAI through your Edge Function) — disclose per your policies.

## URLs (placeholders)

| Field | Placeholder |
|--------|-------------|
| **Support URL** | `https://YOUR_DOMAIN/support` |
| **Marketing URL** | `https://YOUR_DOMAIN` |
| **Privacy Policy URL** | `https://YOUR_DOMAIN/privacy` |

Use the same privacy URL in-app when you replace `/legal/privacy` placeholders.

## Tester notes (TestFlight “What to test”)

1. Complete onboarding: language → goal → **practice difficulty** → microphone explainer.  
2. Create/sign into an account and test **Forgot password** from the real email link.  
3. Run one **text practice** session and test optional “Hear this response” playback.  
4. Run one **voice session**; end cleanly and check the Coach Recap.  
5. **History / Coaching Journal:** reopen the completed session and replay its focus.  
6. **Progress:** inspect Weekly Coach Plan, Adaptive Difficulty, Correction Mastery, and Progress Trends states.  
7. **Come-back nudges:** test “Not today” plus the Profile opt-out toggle.  
8. **Diagnostics:** verify environment, microphone state, app/build identity, TTS health, and realtime configuration.  

**Known:** Voice requires a **dev/production build** (not Expo Go). Web voice loop may be limited.

## Bundle identifiers (see `app.json`)

- iOS: `com.baheemferrell.voxa` — must match App Store Connect application.  
- Android: `com.baheemferrell.voxa`, `versionCode` **1** (increment every Play upload).  
- iOS **`buildNumber`:** **1** (increment every TestFlight/App Store upload).

## Version

- Marketing version: **1.0.0** (`expo.version`) — bump per release.
