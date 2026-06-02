import { isScreenshotMode } from '@/lib/presentation/screenshotMode';

/** Live voice teasers, premium rows, immersive shell — dev and screenshot builds only (hidden in App Store production). */
export function showUnreleasedFeatures(): boolean {
  return __DEV__ || isScreenshotMode();
}
