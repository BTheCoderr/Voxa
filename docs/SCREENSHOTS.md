# Voxa — App Store screenshot plan

Target **6.7" / 6.9"** iPhone first (1290×2796 or 1320×2868); scale down for 5.5" if required. Use **dark mode**, show **status bar**, avoid **Dynamic Island** overlap on headline text (keep top 60–80pt clear or use safe templates).

**Optional:** set `EXPO_PUBLIC_SCREENSHOT_MODE=1` to show the subtle marketing banner on the **Practice** tab for framing.

---

## 1 — “Real conversations, out loud”

| Field | Content |
|--------|---------|
| **Headline** (on image or metadata) | **Real conversations, out loud** |
| **Subline** | Short sessions. Calm AI. No awkward silence. |
| **Screen** | **Practice** tab (`/(app)/(tabs)/`) with scenario cards visible. |
| **Framing** | Top: “TestFlight beta” + title “Choose a scenario”. Show **2–3 scenario cards** fully; bottom third leave breathing room. **History** link visible top-right. |

---

## 2 — “Your voice, realistically”

| Field | Content |
|--------|---------|
| **Headline** | **Your voice, realistically** |
| **Subline** | Scenarios that feel like work, travel, and real life. |
| **Screen** | **Practice** with `SCREENSHOT_MODE=1` **or** scroll so the first card title + subtitle dominate the frame. |
| **Framing** | Tight crop on **one GlassPanel scenario card** + peek of second card; gradient background visible. |

---

## 3 — “Gentle corrections”

| Field | Content |
|--------|---------|
| **Headline** | **Gentle corrections** |
| **Subline** | Notes when they help — not a grade. |
| **Screen** | **Conversation** mid-session or post-recap: show **Correction chips** + **Live transcript** area. Use a completed beta session with 1–2 correction snippets. |
| **Framing** | Orb at top third; **CorrectionChips** and transcript list in center; avoid cutting off the **End session** control. |

---

## 4 — “Momentum, not pressure”

| Field | Content |
|--------|---------|
| **Headline** | **Momentum, not pressure** |
| **Subline** | Streaks for speaking days — XP for showing up. |
| **Screen** | **Progress** tab with **Streak** and **XP** tiles; include **zero state** wave panel if new user, or values **> 0** after one session. |
| **Framing** | Both tiles fully visible; headline in screenshot overlay below or above tiles per template. |

---

## 5 — “Your practice journal”

| Field | Content |
|--------|---------|
| **Headline** | **Your practice journal** |
| **Subline** | History and summaries when you sign in. |
| **Screen** | **History** — either **PolishedEmptyState** (journal empty) **or** 2–3 session cards if you have test data. |
| **Framing** | Title “Conversation history” + wave empty state centered **or** list with realistic scenario titles. |

---

## Capture checklist

- [ ] Turn on **Do Not Disturb**; set **battery** high; consistent **time** (e.g. 9:41 aesthetic optional).  
- [ ] Same **build number** as TestFlight you are promoting.  
- [ ] No **personal email** visible on Profile — use generic test account or crop.  
- [ ] Localize headlines later if you add locales; **English first** per current product scope.

## Product Hunt

Use **shots 1 + 4** as hero + detail; link to TestFlight or landing page; reuse **subtitle** and **promotional text** from `docs/APP_STORE_METADATA.md`.
