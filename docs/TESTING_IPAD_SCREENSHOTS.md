# iPad screenshot & local testing

## Safari `expo-platform` error — not a Voxa bug

If iPad **Safari** shows:

```text
Must specify "expo-platform" header or "platform" query parameter
```

you opened the **Metro bundler** directly (e.g. `http://192.168.1.117:8081`). Metro needs to know whether to serve the **iOS**, **Android**, or **web** bundle. Safari does not send that header.

**Do not** paste `192.168.x.x:8081` into Safari to test the native app.

Use one of the paths below instead.

---

## 1. Recommended: TestFlight on iPad (App Store screenshots)

Best for **real product screenshots** and review assets (e.g. 13-inch iPad).

1. Install **TestFlight** on the iPad.
2. Install **Voxa** from TestFlight.
3. **Fully quit** the app (app switcher → swipe up), then **reopen twice** if you recently published an OTA update (second launch applies the new JS bundle).
4. Capture screenshots from the **running app** (Side button + Volume up).

Optional: Profile → Diagnostics → **Screenshot preview** (dev / `EXPO_PUBLIC_SCREENSHOT_MODE=1`) for staged marketing frames — still capture on device or Simulator at the required resolution.

---

## 2. Local dev: Expo Go on iPad

1. On your Mac, from the repo root:

   ```bash
   npx expo start --go -c
   ```

2. On the iPad, install **Expo Go** from the App Store.
3. Open **Expo Go** → **Scan QR code** (or use Camera → Open in Expo Go).
4. Mac and iPad must be on the **same Wi‑Fi**.

**Do not** open the `http://192.168.x.x:8081` link in Safari.

---

## 3. If LAN / QR fails: tunnel mode

```bash
npx expo start --go --tunnel
```

Scan the new QR in Expo Go. Slower, but works when local network blocks device-to-Mac traffic.

---

## 4. Dev client (custom native build)

Requires a **Voxa development build** already installed on the iPad (not Expo Go).

```bash
npx expo start --dev-client -c
```

Scan the QR or open the `com.baheemferrell.voxa://expo-development-client/...` link from the dev client.

---

## 5. iOS Simulator (Mac)

For quick layout checks without a physical iPad:

```bash
npx expo start --go -c
```

Press **`i`** in the Metro terminal to open the **iOS Simulator**. Choose an **iPad Pro 13-inch** (or the size App Store Connect lists) for screenshot dimensions.

---

## 6. When Safari *is* appropriate

- Marketing site: [https://voxxa.netlify.app/](https://voxxa.netlify.app/)
- **Web** bundle only: press **`w`** in the Metro terminal on your Mac (`http://localhost:8081`) — not the native app on iPad.

---

## Quick reference

| Goal | Method |
|------|--------|
| App Store iPad screenshots | TestFlight on physical iPad or iPad Simulator |
| Dev iteration on iPad | Expo Go + QR (`npx expo start --go -c`) |
| Network issues | `npx expo start --go --tunnel` |
| Native modules / dev client | `npx expo start --dev-client -c` + dev build on device |
| ❌ Wrong | Safari → `http://192.168.x.x:8081` |
