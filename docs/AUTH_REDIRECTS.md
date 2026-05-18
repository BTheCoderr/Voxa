# Voxa — Supabase auth redirects (magic link)

## First checks if links still open Netlify

1. **Request a brand-new magic link** after deploying this app version. Old emails bake in the old `redirect_to` forever.
2. **Supabase → Authentication → Email templates → Magic link**  
   The button/link **must** use **`{{ .ConfirmationURL }}`** (or the documented confirmation link variable).  
   If the template uses **`{{ .SiteURL }}`**, **`https://…netlify…`**, or a hardcoded marketing URL, the app will **never** receive `voxa://` — Supabase is not choosing Netlify; **the template is.**
3. **Redeploy Netlify** so `https://voxxa.netlify.app/auth/callback` exists (bridge page). Until then you get **404** from the marketing site.

---

Magic links use **`emailRedirectTo`** → in-app **`auth/callback`**, which parses tokens and calls `supabase.auth.setSession` (or `exchangeCodeForSession` if you ever switch flows).

**Implementation:** `getAuthMagicLinkRedirectUrl()` uses **`Linking.createURL('auth/callback')`** then normalizes `voxa:/…` → **`voxa://…`**. Screen: `app/auth/callback.tsx`.

## Why the browser opened Netlify (`https://…/auth/callback`) instead of the app

1. **`redirect_to` not allowed or wrong string** — If the value sent to GoTrue does not exactly match an entry in **Redirect URLs**, the server may fall back to **Site URL** (your Netlify homepage host).
2. **`voxa:/auth/callback` vs `voxa://auth/callback`** — Expo’s `createURL` can emit a single slash; we normalize for custom schemes.
3. **Site URL** = `https://voxxa.netlify.app/` — This is only the **default** when GoTrue discards or replaces the requested redirect — it does not “override” a valid `voxa://` template link if the **email** still contains the correct confirmation URL.

**Fix:** Allow-list **`voxa://auth/callback`**, fix **email template**, **normalize** redirect (done in code), request a **new** email.

---

## Supabase Dashboard → Authentication → URL configuration

### Redirect URLs (allow list) — include at minimum

| URL | Purpose |
|-----|---------|
| **`voxa://auth/callback`** | **Required** — iOS/Android dev client, TestFlight, production |
| `https://voxxa.netlify.app/auth/callback` | **Optional** — HTTPS bridge (forwards to `voxa://`; redeploy marketing so it is not 404) |
| `exp://…` / dev URLs | Optional — log **`[auth] emailRedirectTo`** from Metro when using Expo dev client |

### Site URL

Keeping **`https://voxxa.netlify.app/`** is fine for a marketing **default**. Mobile magic links still need **`voxa://auth/callback`** in **Redirect URLs** + correct **email template**.

---

## Implementation details

- **Client:** `lib/auth/magicLinkRedirect.ts` — `Linking.createURL` + normalization.
- **Auth client:** `flowType: 'implicit'` in `lib/supabase/client.ts` (explicit; hash tokens on deep link).
- **Sign-in:** logs `emailRedirectTo` in dev; `trackEvent('sign_in_magic_link_redirect_to', { redirect_prefix })` for analytics.
- **Marketing fallback:** `marketing/app/auth/callback/page.tsx` — **redeploy Netlify** to clear 404.

---

## Security

- Never commit secrets. Rotate keys if they appeared in Git history or chat.

## Troubleshooting

- **404 on Netlify:** Deploy latest `marketing` build with `/auth/callback`.
- **Still HTTPS after new email:** Inspect template → must be `{{ .ConfirmationURL }}`.
