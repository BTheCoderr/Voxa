import assert from 'node:assert/strict';
import { test } from 'node:test';

import { keysToClearOnAccountDelete } from '../lib/auth/localAccountData.ts';

test('clears Voxa practice data but keeps onboarding and non-Voxa keys', () => {
  const keys = [
    '@voxa/progress/v1/xp',
    '@voxa/progress/v1/streak',
    '@voxa/coach-plan/v1',
    '@voxa/preferences/v1/levels',
    '@voxa/retention/v1/dismissed',
    '@voxa/onboarding/v1/complete',
    'sb-nsgrmaygwzdiyiijgpvd-auth-token',
    'posthog_distinct_id',
  ];
  assert.deepEqual(keysToClearOnAccountDelete(keys), [
    '@voxa/progress/v1/xp',
    '@voxa/progress/v1/streak',
    '@voxa/coach-plan/v1',
    '@voxa/preferences/v1/levels',
    '@voxa/retention/v1/dismissed',
  ]);
});

test('every AsyncStorage key used by the app is under the cleared prefix', async () => {
  const { readFile, readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const root = new URL('../lib/', import.meta.url).pathname;
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
    }
  }
  await walk(root);
  const keyLiterals = [];
  for (const file of files) {
    const src = await readFile(file, 'utf8');
    if (!src.includes('AsyncStorage')) continue;
    for (const m of src.matchAll(/const [A-Z_]*KEY[A-Z_]* = '([^']+)'/g)) keyLiterals.push(m[1]);
  }
  assert.ok(keyLiterals.length >= 5, 'expected to discover storage keys');
  for (const key of keyLiterals) {
    assert.ok(key.startsWith('@voxa/'), `${key} would survive account deletion`);
  }
});
