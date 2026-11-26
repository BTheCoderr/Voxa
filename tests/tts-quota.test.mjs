import assert from 'node:assert/strict';
import { test } from 'node:test';

import { consumeTtsQuota } from '../supabase/functions/elevenlabs-tts/quota.ts';

const input = { userId: 'u', usageDate: '2026-11-26', chars: 120, maxRequests: 60, maxChars: 15000 };

test('passes limits through to the RPC and allows on true', async () => {
  let seen;
  const decision = await consumeTtsQuota(async (args) => {
    seen = args;
    return { data: true, error: null };
  }, input);
  assert.equal(decision, 'allowed');
  assert.deepEqual(seen, { p_user_id: 'u', p_usage_date: '2026-11-26', p_chars: 120, p_max_requests: 60, p_max_chars: 15000 });
});

test('limited when the RPC refuses the reservation', async () => {
  assert.equal(await consumeTtsQuota(async () => ({ data: false, error: null }), input), 'limited');
});

test('unmigrated (allowed with a warning) only when the RPC does not exist', async () => {
  assert.equal(await consumeTtsQuota(async () => ({ data: null, error: { code: 'PGRST202' } }), input), 'unmigrated');
  assert.equal(await consumeTtsQuota(async () => ({ data: null, error: { code: '42883' } }), input), 'unmigrated');
});

test('fails closed on any other storage problem', async () => {
  assert.equal(await consumeTtsQuota(async () => ({ data: null, error: { code: '42501' } }), input), 'unavailable');
  assert.equal(await consumeTtsQuota(async () => ({ data: 'yes', error: null }), input), 'unavailable');
  assert.equal(await consumeTtsQuota(async () => { throw new Error('network'); }, input), 'unavailable');
});
