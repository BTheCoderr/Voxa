import { env } from '@/lib/env';

/** When true, empty states use extra marketing polish (set in EAS / .env for screenshot builds only). */
export function isScreenshotMode(): boolean {
  return env.screenshotMode;
}
