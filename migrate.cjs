/* eslint-disable no-console */
const admin = require("firebase-admin");

const BATCH_LIMIT = 450;

function parseServiceAccount(rawValue, envName) {
  if (!rawValue) {
    throw new Error(`Missing required environment variable: ${envName}`);
  }

  const normalized = String(rawValue).trim();

  try {
    const parsed = JSON.parse(normalized);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed;
  } catch {
    try {
      const decoded = Buffer.from(normalized, "base64").toString("utf8");
      const parsed = JSON.parse(decoded);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
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
  return `${projectId || "unknown-project"}-${role}`;
}

async function flushBatch(state) {
  if (state.pendingWrites === 0) {
    return;
  }
  await state.batch.commit();
  state.batch = state.db.batch();
  state.pendingWrites = 0;
}

async function queueWrite(state, docRef, data) {
  state.batch.set(docRef, data, { merge: false });
  state.pendingWrites += 1;
  state.totalDocs += 1;

  if (state.pendingWrites >= BATCH_LIMIT) {
    await flushBatch(state);
  }
}

async function copyCollection(sourceCollectionRef, targetDb, state) {
  const sourceDocs = await sourceCollectionRef.listDocuments();
  if (sourceDocs.length === 0) {
    return;
  }

  for (const sourceDocRef of sourceDocs) {
    const sourceDocSnapshot = await sourceDocRef.get();
    if (!sourceDocSnapshot.exists) {
      continue;
    }

    const targetDocRef = targetDb.doc(sourceDocRef.path);
    await queueWrite(state, targetDocRef, sourceDocSnapshot.data());

    const subcollections = await sourceDocRef.listCollections();
    for (const subcollection of subcollections) {
      await copyCollection(subcollection, targetDb, state);
    }
  }
}

async function run() {
  const sourceSa = parseServiceAccount(process.env.SA_SOURCE, "SA_SOURCE");
  const targetSa = parseServiceAccount(process.env.SA_TARGET, "SA_TARGET");

  const sourceApp = admin.initializeApp(
    { credential: admin.credential.cert(sourceSa) },
    appNameFor(sourceSa.project_id, "source")
  );
  const targetApp = admin.initializeApp(
    { credential: admin.credential.cert(targetSa) },
    appNameFor(targetSa.project_id, "target")
  );

  const sourceDb = sourceApp.firestore();
  const targetDb = targetApp.firestore();

  const state = {
    db: targetDb,
    batch: targetDb.batch(),
    pendingWrites: 0,
    totalDocs: 0,
  };

  const rootCollections = await sourceDb.listCollections();
  console.log(
    `Starting sync from ${sourceSa.project_id} to ${targetSa.project_id}. Root collections: ${rootCollections.length}`
  );

  for (const collection of rootCollections) {
    console.log(`Syncing collection: ${collection.path}`);
    await copyCollection(collection, targetDb, state);
  }

  await flushBatch(state);
  console.log(`Sync completed successfully. Documents copied: ${state.totalDocs}`);
}

run().catch((error) => {
  console.error("Sync failed:", error);
  process.exitCode = 1;
});
