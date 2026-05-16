# Voxa — EAS build & TestFlight

Expo Application Services (EAS) builds run in the cloud. This project uses **native audio** (`expo-audio`, `@edkimmel/expo-audio-stream`) — use **physical iOS devices** for voice QA (simulator is unreliable for mic/streaming).

**Single place to edit bundle ID:** `app.json` → `expo.ios.bundleIdentifier` and `expo.android.package` (currently **`com.baheemferrell.voxa`**).

---

## 1. Install & log in

```bash
npm install
npx expo install --check   # optional: align peer deps

npm install -g eas-cli
# or: npx eas-cli login

eas login
eas whoami
```

---

## 2. Link the project (first time only)

From the repo root:

```bash
cd /path/to/Voxa
eas init
```

- Creates/links the project on Expo’s servers.
- May add `extra.eas.projectId` to **app.json** (or merge into `app.config.js` if you migrate). **Commit that ID.**

Optional non-interactive config:

```bash
eas build:configure
```

This ensures **eas.json** is recognized and can prompt for platform defaults.

---

## 3. iOS credentials (first iOS build)

EAS will prompt to generate or upload:

- Distribution certificate  
- Provisioning profile  
- Push key (if you add push later)

Use the EAS-managed flow unless your org requires manual certs.

---

## 4. Development build (Expo Dev Client)

Use this for day-to-day coding with native modules (required for the voice stack).

```bash
eas build --profile development --platform ios
```

**Install** the `.ipa` on device (QR / link from EAS dashboard), then:

```bash
npx expo start --dev-client
```

Open the **Voxa** dev client and load the bundle from Metro.

**Android (optional):**

```bash
eas build --profile development --platform android
```

---

## 5. Preview / internal build

**Profile:** `preview` — **internal** distribution (install link / ad hoc style), not App Store TestFlight.

```bash
eas build --profile preview --platform ios
```

Use for wider internal testers who should **not** need Xcode or TestFlight yet.

---

## 6. Production build → TestFlight

**Profile:** `production` — **store** distribution (default for production).

```bash
eas build --profile production --platform ios
```

After the build succeeds:

```bash
eas submit --platform ios --latest
```

Or upload the artifact manually in **Transporter** / App Store Connect.

First-time **App Store Connect**: create the app with bundle ID **`com.baheemferrell.voxa`** (must match `app.json`).

---

## 7. Environment variables (EAS)

Set secrets for **build-time** `EXPO_PUBLIC_*` values (they are inlined in the JS bundle):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxx.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
eas secret:create --scope project --name EXPO_PUBLIC_REALTIME_SESSION_URL --value "https://xxx.supabase.co/functions/v1/realtime-session"
# optional:
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_KEY --value "phc_..."
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_HOST --value "https://us.i.posthog.com"
```

Reference them in **eas.json** if you use `env` blocks per profile, or rely on EAS environment **.env** plugin — for simplicity, many teams use **EAS Secrets** + `app.config` reading `process.env`. With plain **app.json**, ensure your CI/EAS project defines env vars in the build dashboard or via `eas.json`:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_SUPABASE_URL": "@EXPO_PUBLIC_SUPABASE_URL"
  }
}
```

(Use EAS “file” or dashboard secret names as per current Expo docs.)

**Checklist — must be present for a working voice + auth build:**

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Auth + optional DB |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Auth + optional DB |
| `EXPO_PUBLIC_REALTIME_SESSION_URL` | Mint realtime client secret |

---

## 8. Native audio plugin — common issues

| Issue | Mitigation |
|--------|------------|
| **App icons** | `icon.png` and Android `adaptiveIcon.foregroundImage` must be **square** (e.g. 1024×1024). `expo-doctor` fails if they are not. |
| **Expo Go** | Voice uses **custom native code** — use **development** or **production** EAS builds, not Expo Go. |
| **Plugin not applied** | `app.json` must list `@edkimmel/expo-audio-stream/app.plugin.js` and `expo-audio`. Run a **clean** EAS build after changing plugins. |
| **iOS mic denied** | `NSMicrophoneUsageDescription` is set in `app.json`. User must tap **Allow**; if blocked, reset **Settings → Privacy → Microphone**. |
| **Simulator** | **development** profile sets `simulator: false` for iOS — use a **real device** for mic / Realtime. |
| **Stale prebuild** | If you ever run `expo prebuild` locally, don’t mix ad-hoc `ios/` edits with EAS unless you commit the `ios` folder; this repo is **managed** workflow-friendly. |

---

## 9. Versioning & build numbers

| Field | Location | Notes |
|--------|-----------|--------|
| **Marketing version** | `app.json` → `expo.version` (e.g. `1.0.0`) | User-facing version string. Bump when you ship meaningful releases. |
| **iOS build number** | `app.json` → `expo.ios.buildNumber` | Must **increase** for every App Store / TestFlight upload. |
| **Android versionCode** | `app.json` → `expo.android.versionCode` | Integer; increment every Play upload. |
| **EAS autoIncrement** | `eas.json` → `production.autoIncrement: true` | Lets EAS bump iOS build number (requires Apple API key / ASC setup per Expo docs). |

If `autoIncrement` is disabled, bump **`buildNumber`** / **`versionCode`** manually in **app.json** before each store upload.

---

## 10. Profiles summary (`eas.json`)

| Profile | Use |
|---------|-----|
| **development** | Expo Dev Client, internal dist, **no** iOS simulator (device + native audio). |
| **preview** | Internal QA builds without TestFlight. |
| **production** | Store / TestFlight; **autoIncrement** enabled for iOS. |

---

## Quick reference

```bash
eas build --profile development --platform ios
eas build --profile preview --platform ios
eas build --profile production --platform ios
eas submit --platform ios --latest
```

See also: `docs/BETA_QA_CHECKLIST.md`, `docs/TESTFLIGHT.md`, `.env.example`.
