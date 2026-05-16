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

The repo has a **root** **`netlify.toml`** with `base = "marketing"` so Netlify always builds the Next app (not Expo). **`marketing/netlify.toml`** is only for local `netlify dev` from inside `marketing/`.

### Dashboard (clear old Expo settings)

1. **Site configuration → Build & deploy → Build settings**
2. **Base directory:** leave **empty** (the root `netlify.toml` already sets `base = "marketing"`), **or** set to `marketing` — both work; if you set base in the UI, ensure **Publish directory** is `out` (relative to that base).
3. **Build command:** leave **empty** to use the file, **or** `npm install && npm run build`
4. **Publish directory:** leave **empty** to use the file, **or** `out` (when base is `marketing`)

**Remove any overrides:** delete `expo export -p web`, `dist`, or custom env vars like `NETLIFY_BUILD_COMMAND` that force Expo. The **`window is not defined`** error comes from Expo web export + Supabase in Node — this marketing stack does not run that code path.

### Waitlist form (Netlify Forms)

The beta section uses **`data-netlify="true"`**. After the first successful deploy:

1. Netlify auto-detects the form **waitlist**.
2. In the dashboard: **Forms** → you should see submissions for **waitlist**.

Enable spam filtering if needed. Replace placeholder copy on **Privacy / Terms / Support** before a public launch.

### Monorepo note

The **Expo app** lives at the repo root. Do **not** use `expo export -p web` for this marketing domain if you want to avoid SSR/mobile-only issues — use this **`marketing`** site instead.

## Brand

Colors align with the mobile app (`constants/theme.ts`): void background, deep indigo surfaces, electric blue → cyan gradients, glass panels.
