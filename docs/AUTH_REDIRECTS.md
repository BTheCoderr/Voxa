# Voxa — Supabase authentication

## Primary: email + password (beta testing)

**Default sign-in path** in the app (`app/(auth)/sign-in.tsx`):

- **Sign in:** `supabase.auth.signInWithPassword({ email, password })`
- **Create account:** `supabase.auth.signUp({ email, password })`

No deep links or redirect URLs are required for this flow. After success, the app calls **`router.replace('/')`** and **`AuthProvider`** picks up the session via `onAuthStateChange`.

### Supabase dashboard (password auth)

1. **Authentication → Providers → Email** — enable Email provider.
2. For frictionless beta testing, consider **disabling “Confirm email”** so `signUp` returns a session immediately. If confirmation stays on, users must confirm via email before password sign-in works.
3. **Authentication → Policies** — ensure sign-ups are allowed if you use Create account.

### Client-side validation

- Invalid email format
- Password length on sign-up (6+ characters; matches typical Supabase minimum)
- Mapped API errors: wrong password, user already exists, weak password, etc. (`lib/auth/authErrors.ts`)

---

## Optional: magic link (future / secondary)

Magic link remains available as **“Email me a magic link instead”** on the sign-in screen. It uses **`emailRedirectTo`** → in-app **`auth/callback`** (`app/auth/callback.tsx`).

Use magic link when you want passwordless login in production. For **TestFlight / dev testing**, prefer **email + password** to avoid redirect/deep-link issues.

### Magic link redirect URLs

If you use magic link, configure **Authentication → Redirect URLs**:

| URL | Purpose |
|-----|---------|
| **`voxa://auth/callback`** | Dev client, TestFlight, production |
| `https://voxxa.netlify.app/auth/callback` | Optional HTTPS bridge (marketing site forwards to `voxa://`) |
| `exp://<LAN-IP>:8081/--/auth/callback` | Expo Go only (IP changes; log `[auth] emailRedirectTo` in Metro) |

**Email templates** must use **`{{ .ConfirmationURL }}`**, not hardcoded Site URL.

See implementation: `lib/auth/magicLinkRedirect.ts`, `lib/auth/completeSessionFromUrl.ts`.

---

## Security

- Never commit secrets. Rotate keys if they appeared in Git history or chat.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| “Invalid login credentials” | Wrong password or no account — use Create account or reset password in Supabase dashboard. |
| Sign up succeeds but can’t sign in | Email confirmation may be required — disable in Supabase for beta or confirm email. |
| Magic link opens Netlify | Fix email template + allow-list `voxa://auth/callback`; request a **new** link. |
