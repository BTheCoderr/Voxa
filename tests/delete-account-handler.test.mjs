import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  USER_OWNED_TABLES,
  createDeleteAccountHandler,
  isMissingTableError,
} from '../supabase/functions/delete-account/handler.ts';

const URL = 'https://example.supabase.co/functions/v1/delete-account';

function request({ method = 'POST', token = 'valid-token', body = { confirmation: 'DELETE' } } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request(URL, {
    method,
    headers,
    body: method === 'POST' || method === 'PUT' ? JSON.stringify(body) : undefined,
  });
}

function fakeDeps(overrides = {}) {
  const calls = { deleteRows: [], deleteAuthUser: [] };
  const deps = {
    getUserIdFromToken: async (token) => (token === 'valid-token' ? 'user-1' : null),
    deleteRows: async (table, column, userId) => {
      calls.deleteRows.push({ table, column, userId });
      return null;
    },
    deleteAuthUser: async (userId) => {
      calls.deleteAuthUser.push(userId);
      return null;
    },
    ...overrides,
  };
  return { deps, calls };
}

test('deletes every user-owned table, then the auth user', async () => {
  const { deps, calls } = fakeDeps();
  const res = await createDeleteAccountHandler(deps)(request());
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { deleted: true });
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(
    calls.deleteRows.map((c) => c.table),
    USER_OWNED_TABLES.map((t) => t.table),
  );
  assert.ok(calls.deleteRows.every((c) => c.userId === 'user-1'));
  assert.deepEqual(calls.deleteAuthUser, ['user-1']);
});

test('covers every user-scoped table created by migrations', async () => {
  const { readFile, readdir } = await import('node:fs/promises');
  const dir = new globalThis.URL('../supabase/migrations/', import.meta.url);
  const created = new Set();
  for (const name of await readdir(dir)) {
    const sql = await readFile(new globalThis.URL(name, dir), 'utf8');
    for (const m of sql.matchAll(/create table (?:if not exists )?public\.(\w+)\s*\(([\s\S]*?)\n\);/gi)) {
      if (/\buser_id uuid\b|references auth\.users/i.test(m[2])) created.add(m[1]);
    }
  }
  assert.ok(created.size >= 8, `expected to discover user tables, found ${[...created]}`);
  const covered = new Set(USER_OWNED_TABLES.map((t) => t.table));
  for (const table of created) assert.ok(covered.has(table), `${table} is not deleted by delete-account`);
});

test('profiles are matched on id, everything else on user_id', () => {
  for (const { table, userColumn } of USER_OWNED_TABLES) {
    assert.equal(userColumn, table === 'profiles' ? 'id' : 'user_id', table);
  }
  assert.equal(USER_OWNED_TABLES.at(-1).table, 'profiles', 'profiles must be deleted last');
});

test('rejects missing bearer token without touching data', async () => {
  const { deps, calls } = fakeDeps();
  const res = await createDeleteAccountHandler(deps)(request({ token: null }));
  assert.equal(res.status, 401);
  assert.equal(calls.deleteRows.length + calls.deleteAuthUser.length, 0);
});

test('rejects invalid or expired session', async () => {
  const { deps, calls } = fakeDeps();
  const res = await createDeleteAccountHandler(deps)(request({ token: 'expired' }));
  assert.equal(res.status, 401);
  assert.equal((await res.json()).code, 'unauthorized');
  assert.equal(calls.deleteRows.length, 0);
});

test('treats a throwing token lookup as unauthorized', async () => {
  const { deps } = fakeDeps({
    getUserIdFromToken: async () => {
      throw new Error('network');
    },
  });
  const res = await createDeleteAccountHandler(deps)(request());
  assert.equal(res.status, 401);
});

test('requires explicit DELETE confirmation', async () => {
  for (const body of [{}, { confirmation: 'delete' }, { confirmation: true }, null]) {
    const { deps, calls } = fakeDeps();
    const res = await createDeleteAccountHandler(deps)(request({ body }));
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.equal((await res.json()).code, 'confirmation_required');
    assert.equal(calls.deleteRows.length, 0);
  }
});

test('rejects non-POST methods and answers CORS preflight', async () => {
  const { deps } = fakeDeps();
  const handle = createDeleteAccountHandler(deps);
  assert.equal((await handle(request({ method: 'GET' }))).status, 405);
  const preflight = await handle(request({ method: 'OPTIONS' }));
  assert.equal(preflight.status, 200);
  assert.match(preflight.headers.get('Access-Control-Allow-Headers'), /authorization/);
});

test('skips tables that do not exist in this project', async () => {
  const { deps, calls } = fakeDeps({
    deleteRows: async (table) =>
      table === 'realtime_session_usage' ? { code: 'PGRST205', message: 'Could not find the table' } : null,
  });
  const res = await createDeleteAccountHandler(deps)(request());
  assert.equal(res.status, 200);
  assert.deepEqual(calls.deleteAuthUser, ['user-1']);
});

test('stops before deleting the auth user if a row delete fails (so the user can retry)', async () => {
  const logs = [];
  const { deps, calls } = fakeDeps({
    deleteRows: async (table) => (table === 'conversations' ? { code: '42501', message: 'permission denied' } : null),
    log: (entry) => logs.push(entry),
  });
  const res = await createDeleteAccountHandler(deps)(request());
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.equal(body.code, 'delete_rows_failed');
  assert.doesNotMatch(body.error, /permission denied/, 'internal DB errors are not leaked');
  assert.equal(calls.deleteAuthUser.length, 0);
  assert.deepEqual(logs, [{ event: 'delete_account_rows_failed', table: 'conversations', code: '42501' }]);
});

test('reports auth deletion failure', async () => {
  const { deps } = fakeDeps({ deleteAuthUser: async () => 'boom' });
  const res = await createDeleteAccountHandler(deps)(request());
  assert.equal(res.status, 500);
  assert.equal((await res.json()).code, 'delete_auth_failed');
});

test('logs never include the user id or token', async () => {
  const logs = [];
  const { deps } = fakeDeps({ log: (entry) => logs.push(JSON.stringify(entry)) });
  await createDeleteAccountHandler(deps)(request());
  assert.ok(logs.length > 0);
  for (const line of logs) {
    assert.doesNotMatch(line, /user-1|valid-token/);
  }
});

test('isMissingTableError recognises Postgres and PostgREST codes only', () => {
  assert.equal(isMissingTableError(null), false);
  assert.equal(isMissingTableError({ code: '42P01' }), true);
  assert.equal(isMissingTableError({ code: 'PGRST205' }), true);
  assert.equal(isMissingTableError({ message: 'relation "x" does not exist' }), true);
  assert.equal(isMissingTableError({ code: '42501', message: 'permission denied' }), false);
});
