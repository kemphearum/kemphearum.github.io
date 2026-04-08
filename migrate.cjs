/* eslint-disable no-console */
const admin = require('firebase-admin');

const BATCH_LIMIT = Number(process.env.MIGRATE_BATCH_LIMIT || 250);
const COMMIT_PAUSE_MS = Number(process.env.MIGRATE_COMMIT_PAUSE_MS || 150);
const PAGE_SIZE = Number(process.env.MIGRATE_PAGE_SIZE || 200);
const DEFAULT_MAX_ATTEMPTS = Number(process.env.MIGRATE_RETRY_MAX_ATTEMPTS || 7);
const DEFAULT_BASE_DELAY_MS = Number(process.env.MIGRATE_RETRY_BASE_DELAY_MS || 1000);
const DEFAULT_MAX_DELAY_MS = Number(process.env.MIGRATE_RETRY_MAX_DELAY_MS || 20000);

const RETRYABLE_ERROR_CODES = new Set([4, 8, 10, 14, 'aborted', 'deadline-exceeded', 'resource-exhausted', 'unavailable']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseServiceAccount(rawValue, envName) {
  if (!rawValue) {
    throw new Error(`Missing required environment variable: ${envName}`);
  }

  const normalized = String(rawValue).trim();

  try {
    const parsed = JSON.parse(normalized);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch {
    try {
      const decoded = Buffer.from(normalized, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed;
    } catch {
      throw new Error(
        `Invalid ${envName}. Expected JSON or base64-encoded JSON service account key.`
      );
    }
  }
}

function appNameFor(projectId, role) {
  return `${projectId || 'unknown-project'}-${role}`;
}

function isRetryableError(error) {
  const code = error?.code;
  const message = String(error?.message || '').toLowerCase();

  if (RETRYABLE_ERROR_CODES.has(code)) return true;
  if (message.includes('deadline exceeded')) return true;
  if (message.includes('resource_exhausted')) return true;
  if (message.includes('quota exceeded')) return true;
  if (message.includes('unavailable')) return true;
  if (message.includes('aborted')) return true;

  return false;
}

async function withRetry(task, label, options = {}) {
  const maxAttempts = Number(options.maxAttempts || DEFAULT_MAX_ATTEMPTS);
  const baseDelayMs = Number(options.baseDelayMs || DEFAULT_BASE_DELAY_MS);
  const maxDelayMs = Number(options.maxDelayMs || DEFAULT_MAX_DELAY_MS);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await task();
    } catch (error) {
      const retryable = isRetryableError(error);
      const isLastAttempt = attempt >= maxAttempts;

      if (!retryable || isLastAttempt) {
        throw error;
      }

      const expDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      const jitter = Math.round(expDelay * 0.25 * Math.random());
      const waitMs = expDelay + jitter;
      console.warn(`     retry ${attempt}/${maxAttempts} for ${label} after ${waitMs}ms (${error.message})`);
      await sleep(waitMs);
    }
  }
}

async function flushBatch(state) {
  if (state.pendingWrites === 0) {
    return;
  }

  await withRetry(() => state.batch.commit(), 'commit batch');
  state.batch = state.db.batch();
  state.pendingWrites = 0;

  if (COMMIT_PAUSE_MS > 0) {
    await sleep(COMMIT_PAUSE_MS);
  }
}

async function queueWrite(state, docRef, data) {
  state.batch.set(docRef, data, { merge: false });
  state.pendingWrites += 1;
  state.totalDocs += 1;

  if (state.pendingWrites >= BATCH_LIMIT) {
    await flushBatch(state);
  }
}

async function copyCollection(sourceCollectionRef, state) {
  let lastDoc = null;

  while (true) {
    const query = lastDoc
      ? sourceCollectionRef.orderBy(admin.firestore.FieldPath.documentId()).startAfter(lastDoc).limit(PAGE_SIZE)
      : sourceCollectionRef.orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE_SIZE);
    const snapshot = await withRetry(() => query.get(), `read ${sourceCollectionRef.path}`);

    if (snapshot.empty) {
      return;
    }

    for (const sourceDocSnapshot of snapshot.docs) {
      const targetDocRef = state.db.doc(sourceDocSnapshot.ref.path);
      await queueWrite(state, targetDocRef, sourceDocSnapshot.data());

      const subcollections = await withRetry(() => sourceDocSnapshot.ref.listCollections(), `list subcollections for ${sourceDocSnapshot.ref.path}`);
      for (const subcollection of subcollections) {
        await copyCollection(subcollection, state);
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }
}

async function run() {
  const sourceSa = parseServiceAccount(process.env.SA_SOURCE || process.env.SA_SOURCE_JSON, 'SA_SOURCE');
  const targetSa = parseServiceAccount(process.env.SA_TARGET || process.env.SA_TARGET_JSON, 'SA_TARGET');

  const sourceApp = admin.initializeApp(
    { credential: admin.credential.cert(sourceSa) },
    appNameFor(sourceSa.project_id, 'source')
  );
  const targetApp = admin.initializeApp(
    { credential: admin.credential.cert(targetSa) },
    appNameFor(targetSa.project_id, 'target')
  );

  const sourceDb = sourceApp.firestore();
  const targetDb = targetApp.firestore();

  const state = {
    db: targetDb,
    batch: targetDb.batch(),
    pendingWrites: 0,
    totalDocs: 0,
  };

  const rootCollections = await withRetry(() => sourceDb.listCollections(), 'list root collections');
  console.log(
    `Starting sync from ${sourceSa.project_id} to ${targetSa.project_id}. Root collections: ${rootCollections.length}`
  );

  for (const collection of rootCollections) {
    console.log(`Syncing collection: ${collection.path}`);
    await copyCollection(collection, state);
  }

  await flushBatch(state);
  console.log(`Sync completed successfully. Documents copied: ${state.totalDocs}`);
}

run().catch((error) => {
  console.error('Sync failed:', error);
  process.exitCode = 1;
});
