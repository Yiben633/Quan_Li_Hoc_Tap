import assert from 'node:assert/strict';
import test from 'node:test';
import { grantBootstrapAdmin, maskEmail, readBootstrapEmail } from './grant-bootstrap-admin.mjs';

function createPrismaMock() {
  let assigned = false;
  const calls = {
    connect: 0,
    transactions: 0,
    userRoleCreates: 0,
    activityLogCreates: 0,
  };

  const tx = {
    user: {
      findFirst: async () => ({ id: 'user-1', email: 'admin@example.com' }),
    },
    role: {
      upsert: async () => ({ id: 'role-admin', name: 'admin' }),
    },
    userRole: {
      findUnique: async () => assigned ? { userId: 'user-1' } : null,
      create: async () => {
        assigned = true;
        calls.userRoleCreates += 1;
        return { userId: 'user-1', roleId: 'role-admin' };
      },
    },
    activityLog: {
      create: async () => {
        calls.activityLogCreates += 1;
        return { id: `activity-${calls.activityLogCreates}` };
      },
    },
  };

  return {
    calls,
    client: {
      $connect: async () => { calls.connect += 1; },
      $transaction: async (callback, options) => {
        calls.transactions += 1;
        assert.deepEqual(options, { maxWait: 10_000, timeout: 20_000 });
        return callback(tx);
      },
    },
  };
}

test('admin bootstrap is idempotent', async () => {
  const { client, calls } = createPrismaMock();

  const first = await grantBootstrapAdmin(client, 'admin@example.com');
  const second = await grantBootstrapAdmin(client, 'admin@example.com');

  assert.equal(first?.granted, true);
  assert.equal(second?.granted, false);
  assert.equal(calls.transactions, 2);
  assert.equal(calls.userRoleCreates, 1);
  assert.equal(calls.activityLogCreates, 1);
});

test('bootstrap email is normalized, validated and masked', () => {
  assert.equal(readBootstrapEmail({ ADMIN_BOOTSTRAP_EMAIL: ' Admin@Example.com ' }), 'admin@example.com');
  assert.equal(maskEmail('admin@example.com'), 'ad***@example.com');
  assert.throws(() => readBootstrapEmail({}), /ADMIN_BOOTSTRAP_EMAIL is required/);
  assert.throws(() => readBootstrapEmail({ ADMIN_BOOTSTRAP_EMAIL: 'not-an-email' }), /valid email address/);
});
