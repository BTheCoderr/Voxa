# Voxa — launch branding direction

Internal reference for TestFlight, App Store, Product Hunt, and design handoff. **Not a final trademark package** — engage a designer for production lock-in.

## Positioning

- **Voice-first**: practice speaking, not passive reading.
- **Calm premium**: confident typography, deep space palette, glass surfaces — not gamified clutter.
- **Conversation-forward**: motion and form cues suggest *dialogue* and *sound*, not travel/cartoons/flags.

## Wordmark concept (premium)

- **Name**: **Voxa** — short, memorable, Latin *vox* (voice) without being on-the-nose.
- **Logotype**: geometric grotesk or humanist sans (e.g. Satoshi, Neue Montreal, DM Sans, or SF Pro as interim).
- **Case**: Title case **Voxa** in product; all-caps **VOXA** only in tight badges (tracking +1% to +3%).
- **Weight**: semibold for primary lockup; avoid extra-bold “startup loud.”
- **Optical**: slight tightening of *Vo* pair optional; no connected ligatures required.
- **Lockup with tagline** (web/PR only):  
  `Voxa` / *Speak with confidence* — tagline in muted secondary weight, smaller size.

## App icon concept (no clichés)

**Avoid:** owl, globe, chat bubbles overloaded with dots, country flags, cartoon mascots, headset stock art.

**Direction:** abstract **voice arcs** or **concentric wavefronts** — 2–4 smooth curves or rings, slightly asymmetric (feels human, not stock). Gradient along the mark: **deep indigo → electric blue → cyan** on **void** background. Single focal glow (cyan) where arcs converge or peak.

**Metaphor:** the moment sound leaves the chest — soft geometry, not literal waveforms etched in neon.

## Color system (reference)

| Token | Hex | Use |
|--------|-----|-----|
| Void | `#070A12` | App background, icon base |
| Deep indigo | `#0B1020` | Surfaces, icon gradient start |
| Electric blue | `#3B6CFF` | Primary actions, gradient mid |
| Cyan | `#38D9FF` | Accents, highlights, success tone |
| Frost | `rgba(255,255,255,0.08)` | Glass borders |

## Assets in repo

| File | Role |
|------|------|
| `assets/images/icon.png` | iOS / main Expo icon (**AI-generated placeholder** — replace with designer export 1024×1024) |
| `assets/images/adaptive-icon.png` | Android foreground (duplicate placeholder; keep art in center 66%) |
| `assets/images/splash-icon.png` | Splash center mark (duplicate placeholder) |
| `assets/images/favicon.png` | Web favicon (duplicate placeholder) |
| `docs/branding/wordmark-concept.svg` | Wordmark reference |
| `docs/branding/icon-concept.svg` | Vector arcs reference for designers |

## Handoff checklist

- [ ] Trademark search on “Voxa” in your markets  
- [ ] Export iOS/Android/Web full asset grid from Figma  
- [ ] Pixel-align splash to `backgroundColor` in `app.json` (`#070A12`)  
- [ ] Adaptive icon: verify no critical detail in outer 18% trim
