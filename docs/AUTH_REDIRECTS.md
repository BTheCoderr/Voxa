# Voxa — Supabase auth redirects (magic link)

Magic links use **`emailRedirectTo`** → in-app route **`auth/callback`**, which parses tokens and calls `supabase.auth.setSession` (or `exchangeCodeForSession` for PKCE).

**Implementation:** `getAuthMagicLinkRedirectUrl()` in `lib/auth/magicLinkRedirect.ts` (native = **`voxa://auth/callback`** by default), screen: `app/auth/callback.tsx`.

---

## Why the browser opened Netlify (`https://…/auth/callback`) instead of the app

1. **`emailRedirectTo` was not allowed.**  
   Supabase only redirects to URLs listed under **Authentication → URL Configuration → Redirect URLs**.  
   If `voxa://auth/callback` is missing, GoTrue may **ignore** the client redirect and use **Site URL** instead (often your marketing site).

2. **Scheme / slash mismatch.**  
   `Linking.createURL('auth/callback')` can produce **`voxa:/auth/callback`** (single slash after the scheme). Your dashboard may only list **`voxa://auth/callback`**. Treating them as different strings can cause the redirect to be rejected → **fallback to Site URL**.

3. **Site URL is your marketing domain.**  
   If **Site URL** = `https://voxxa.netlify.app`, that becomes the default “safe” redirect when the requested URL is not permitted.

**Fix:** Add the exact native URL(s) below to **Redirect URLs**, and optionally keep the Netlify URL as a **fallback bridge** (see Marketing site).

---

## Supabase Dashboard → Authentication → URL configuration

### Redirect URLs (allow list) — include at minimum

| URL | Purpose |
|-----|---------|
| **`voxa://auth/callback`** | **Required** — iOS/Android TestFlight, dev client, production (matches `app.json` `scheme`) |
| `voxa:/auth/callback` | Optional — if you ever see this variant from `Linking.createURL` |
| `https://YOUR_NETLIFY_HOST/auth/callback` | Optional — fallback page that forwards to `voxa://…` (see `/marketing/app/auth/callback`) |
| `exp://127.0.0.1:8081/--/auth/callback` | Optional — local Expo Go / Metro (changes per machine; log in dev) |

### Site URL

- Can remain **`https://your-marketing-site.netlify.app`** for email templates and web.
- **Do not rely on Site URL alone** for mobile: mobile magic links must use **`voxa://auth/callback`** in the allow list, or users stay in the browser.

### Debug the value sent from the app

On a **native** build, after tapping “Send magic link”, check Metro logs:

```text
[auth] emailRedirectTo canonical (sent to Supabase) → voxa://auth/callback
```

Override (EAS / `.env`): **`EXPO_PUBLIC_AUTH_REDIRECT_NATIVE=voxa://auth/callback`**

---

## Marketing site fallback (`/auth/callback`)

If an email still opens **`https://…/auth/callback`** on Netlify, that route **forwards** `search` + `hash` (tokens) to **`voxa://auth/callback`**, so the OS can open the app. Redeploy marketing after adding this page.

---

## Security

- Never commit secrets. Rotate keys if they appeared in Git history or chat.

## Troubleshooting

- **404 on Netlify:** Deploy latest marketing with `app/auth/callback/page.tsx`, or remove Netlify from the magic-link path by fixing Redirect URLs + native `emailRedirectTo`.
- **Blank native screen:** Callback route or session parse — see `app/auth/callback.tsx`.
