# Voxa — marketing site

Standalone **Next.js** landing page for [Voxa](https://github.com/BTheCoderr/Voxa). This is **not** the Expo mobile app — deploy it separately (Netlify, Vercel, etc.).

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS. **`output: 'export'`** produces static HTML in `out/` (no Node server).

## Run locally

```bash
cd marketing
npm install
npm run dev
```

Open [http://localhost:3333](http://localhost:3333).

## Build

```bash
cd marketing
npm install
npm run build
```

Static files are written to **`marketing/out/`**.

## Deploy on Netlify

You already have a Netlify site. Point it at this folder:

1. **Site settings → Build & deploy → Continuous deployment → Build settings**
2. **Base directory:** `marketing`
3. **Build command:** `npm install && npm run build`  
   (Or leave blank if you rely on `marketing/netlify.toml`.)
4. **Publish directory:** `out`  
   (If the UI asks for a path **relative to the base directory**, use `out`, not `marketing/out`.)

Optional: commit **`marketing/netlify.toml`** — it sets `publish = "out"` and `NODE_VERSION = "20"`.

### Waitlist form (Netlify Forms)

The beta section uses **`data-netlify="true"`**. After the first successful deploy:

1. Netlify auto-detects the form **waitlist**.
2. In the dashboard: **Forms** → you should see submissions for **waitlist**.

Enable spam filtering if needed. Replace placeholder copy on **Privacy / Terms / Support** before a public launch.

### Monorepo note

The **Expo app** lives at the repo root. Do **not** use `expo export -p web` for this marketing domain if you want to avoid SSR/mobile-only issues — use this **`marketing`** site instead.

## Brand

Colors align with the mobile app (`constants/theme.ts`): void background, deep indigo surfaces, electric blue → cyan gradients, glass panels.
