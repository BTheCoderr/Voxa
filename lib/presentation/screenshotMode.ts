import { env } from '@/lib/env';

/** When true, empty states use extra marketing polish (set in EAS / .env for screenshot builds only). */
export function isScreenshotMode(): boolean {
  return env.screenshotMode;
}

/** Internal screenshot gallery — dev builds or EXPO_PUBLIC_SCREENSHOT_MODE=1 only. */
export function canAccessScreenshotPreview(): boolean {
  return __DEV__ || isScreenshotMode();
}
