# Voxa — Supabase auth redirects (magic link)

Magic links use **`emailRedirectTo`** pointing at the in-app route **`auth/callback`**, which parses tokens from the deep link and calls `supabase.auth.setSession` (or `exchangeCodeForSession` for PKCE).

Implementation:

- **Redirect URL:** `getAuthMagicLinkRedirectUrl()` in `lib/auth/magicLinkRedirect.ts` → `Linking.createURL('auth/callback')`.
- **Screen:** `app/auth/callback.tsx`.

## Supabase Dashboard → Authentication → URL configuration

Add every redirect URL that **`Linking.createURL('auth/callback')`** can produce in your environments. Typical patterns:

| Environment | Example redirect (verify with `console.log(getAuthMagicLinkRedirectUrl())`) |
|-------------|----------------------------------------------------------------------------|
| **iOS TestFlight / production** | `voxa://auth/callback` |
| **iOS/Android dev client** | Often `voxa://auth/callback` (same scheme as `app.json`) |
| **Expo Go / Metro** | Often `exp://<LAN-IP>:8081/--/auth/callback` or `exp+<slug>://...` — **Expo Go** lacks custom native modules; use an **EAS dev build** for representative auth + voice testing. |

Also allow variants Supabase or the OS might emit:

- `voxa://auth/callback`
- `voxa:///auth/callback` (extra slash — rare)

**Site URL** in Supabase can stay your project default; **Redirect URLs** must include the exact strings above (wildcard `*` is supported in some plans — prefer explicit URLs when possible).

## Security

- **Never commit** live JWTs, service-role keys, or database passwords. If secrets hit Git history, **rotate** them in Supabase and use **EAS secrets** / `.env` (gitignored) only.
- GitGuardian (or similar) alerts on `eyJ…` in commits are expected if anon keys were pasted — treat as exposed for public repos.

## Troubleshooting

- **Blank screen after email link:** Redirect URL not in Supabase allow list, or `emailRedirectTo` did not match (fixed by using `getAuthMagicLinkRedirectUrl()`).
- **“Invalid” / expired link:** Request a new magic link; tokens are short-lived.
