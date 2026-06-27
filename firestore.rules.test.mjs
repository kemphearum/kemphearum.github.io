/**
 * Firestore Security Rules tests — proves the server-side RBAC enforcement
 * added in firestore.rules (security review F-01/F-03/F-10).
 *
 * REQUIREMENTS (cannot run without these):
 *   1. Java 11+ installed (Firestore emulator runtime).
 *   2. npm i -D @firebase/rules-unit-testing
 *   3. Run via the emulator:  firebase emulators:exec --only firestore "node --test firestore.rules.test.mjs"
 *      (or set FIRESTORE_EMULATOR_HOST and run `node --test firestore.rules.test.mjs`)
 *
 * These tests are written but were NOT executed in the review environment
 * (no Java/emulator available there). Run them in CI before deploying rules.
 */
import { readFileSync } from 'node:fs';
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

let env;

const PROJECT_ID = 'phearum-info-rules-test';

// Seed a user doc + (optionally) a role-keyed rolePermissions doc using a
// privileged context that bypasses rules.
async function seed(uid, role, { isActive = true } = {}, rolePerm = null) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', uid), { email: `${uid}@x.com`, role, isActive });
    if (rolePerm) {
      await setDoc(doc(db, 'rolePermissions', role), { role, ...rolePerm });
    }
    await setDoc(doc(db, 'posts', 'seed-post'), { title: 'seed' });
    await setDoc(doc(db, 'messages', 'seed-msg'), { name: 'a', email: 'a@x.com', message: 'hi' });
  });
}

function authed(uid, email) {
  return env.authenticatedContext(uid, { email: email || `${uid}@x.com` }).firestore();
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') }
  });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

test('F-01: restricted custom role (no perm doc) CANNOT write posts', async () => {
  await seed('u1', 'reviewer'); // custom role, no rolePermissions doc
  const db = authed('u1');
  await assertFails(setDoc(doc(db, 'posts', 'p1'), { title: 'x' }));
});

test('F-01: custom role granted blog CAN write posts; CANNOT write projects', async () => {
  await seed('u2', 'contributor', {}, {
    baseRole: 'editor',
    allowedTabs: ['blog'],
    allowedActions: { blog: ['create', 'edit', 'delete'] }
  });
  const db = authed('u2');
  await assertSucceeds(setDoc(doc(db, 'posts', 'p2'), { title: 'x' }));
  await assertFails(setDoc(doc(db, 'projects', 'pr2'), { title: 'x' }));
});

test('F-01: built-in editor CAN write posts/projects but NOT experience', async () => {
  await seed('u3', 'editor');
  const db = authed('u3');
  await assertSucceeds(setDoc(doc(db, 'posts', 'p3'), { title: 'x' }));
  await assertSucceeds(setDoc(doc(db, 'projects', 'pr3'), { title: 'x' }));
  await assertFails(setDoc(doc(db, 'experience', 'e3'), { title: 'x' }));
});

test('F-01: superadmin can write everything', async () => {
  await seed('u4', 'superadmin');
  const db = authed('u4');
  await assertSucceeds(setDoc(doc(db, 'experience', 'e4'), { title: 'x' }));
});

test('F-01: built-in editor CANNOT write skills or certificates', async () => {
  await seed('u3sc', 'editor');
  const db = authed('u3sc');
  await assertFails(setDoc(doc(db, 'skills', 's1'), { name: 'x' }));
  await assertFails(setDoc(doc(db, 'certificates', 'c1'), { name: 'x' }));
});

test('F-01: superadmin can write skills and certificates', async () => {
  await seed('u4sc', 'superadmin');
  const db = authed('u4sc');
  await assertSucceeds(setDoc(doc(db, 'skills', 's2'), { name: 'x' }));
  await assertSucceeds(setDoc(doc(db, 'certificates', 'c2'), { name: 'x' }));
});

test('F-01/F-08: non-messages role CANNOT read messages; admin CAN', async () => {
  await seed('u5', 'editor');
  await assertFails(getDoc(doc(authed('u5'), 'messages', 'seed-msg')));
  await seed('u6', 'admin');
  await assertSucceeds(getDoc(doc(authed('u6'), 'messages', 'seed-msg')));
});

test('F-03: audit log create REQUIRES matching email and valid schema', async () => {
  await seed('u7', 'pending');
  const db = authed('u7', 'u7@x.com');
  // Spoofing another user's email -> denied
  await assertFails(setDoc(doc(db, 'auditLogs', 'a1'), {
    email: 'victim@x.com', status: 'success', ipAddress: '', country: '', city: '',
    userAgent: '', deviceType: '', sessionId: '', details: {}, reason: null, timestamp: new Date()
  }));
  // Own email + valid schema -> allowed
  await assertSucceeds(setDoc(doc(db, 'auditLogs', 'a2'), {
    email: 'u7@x.com', status: 'success', ipAddress: '', country: '', city: '',
    userAgent: '', deviceType: '', sessionId: '', details: {}, reason: null, timestamp: new Date()
  }));
});

test('F-03: audit logs are immutable (no update)', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'auditLogs', 'a3'), { email: 'u8@x.com', status: 'success' });
  });
  await seed('u8', 'superadmin');
  await assertFails(setDoc(doc(authed('u8', 'u8@x.com'), 'auditLogs', 'a3'), { status: 'failure' }));
});

test('F-10: pending user CANNOT read rolePermissions; staff CAN', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'rolePermissions', 'editor'), { role: 'editor', allowedTabs: [] });
  });
  await seed('u9', 'pending');
  await assertFails(getDoc(doc(authed('u9'), 'rolePermissions', 'editor')));
  await seed('u10', 'editor');
  await assertSucceeds(getDoc(doc(authed('u10'), 'rolePermissions', 'editor')));
});
