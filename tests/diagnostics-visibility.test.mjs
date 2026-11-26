import assert from 'node:assert/strict';
import { test } from 'node:test';

import { diagnosticsEnabled } from '../lib/diagnostics/visibility.ts';

test('hidden in App Store (production channel) builds', () => {
  assert.equal(diagnosticsEnabled({ isDev: false, channel: 'production' }), false);
});

test('fails closed when no update channel is embedded', () => {
  assert.equal(diagnosticsEnabled({ isDev: false, channel: null }), false);
  assert.equal(diagnosticsEnabled({ isDev: false, channel: '  ' }), false);
});

test('visible in dev, preview, and development builds', () => {
  assert.equal(diagnosticsEnabled({ isDev: true, channel: 'production' }), true);
  assert.equal(diagnosticsEnabled({ isDev: false, channel: 'preview' }), true);
  assert.equal(diagnosticsEnabled({ isDev: false, channel: 'development' }), true);
});

test('explicit EXPO_PUBLIC_SHOW_DIAGNOSTICS=1 override only', () => {
  assert.equal(diagnosticsEnabled({ isDev: false, channel: 'production', override: '1' }), true);
  assert.equal(diagnosticsEnabled({ isDev: false, channel: 'production', override: 'true' }), false);
  assert.equal(diagnosticsEnabled({ isDev: false, channel: 'production', override: '' }), false);
});
