/**
 * Firestore Migration Script
 * Copies all data from portfolio-77db2 → phearum-info
 *
 * Usage:
 *   1. Place your service account JSON files in this folder (see README below)
 *   2. node migrate.js
 */

const admin = require('firebase-admin');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const SOURCE_SERVICE_ACCOUNT = require('./sa-source.json');   // phearum-info (Primary)
const TARGET_SERVICE_ACCOUNT = require('./sa-target.json');   // kem-phearum (Secondary)

// Collections to migrate (in order)
const COLLECTIONS = [
    'content',
    'projects',
    'experience',
    'posts',
    'messages',
    'users',
    'rolePermissions',
    'auditLogs',
    'settings',
    'visits',
    'dailyUsage'
];

// Batch size for Firestore writes (max 500)
const BATCH_SIZE = 400;
// ───────────────────────────────────────────────────────────────────────────

// Initialize two separate Firebase apps
const sourceApp = admin.initializeApp(
    { credential: admin.credential.cert(SOURCE_SERVICE_ACCOUNT) },
    'source'
);
const targetApp = admin.initializeApp(
    { credential: admin.credential.cert(TARGET_SERVICE_ACCOUNT) },
    'target'
);

const sourceDb = admin.firestore(sourceApp);
const targetDb = admin.firestore(targetApp);

// ─── HELPERS ───────────────────────────────────────────────────────────────

/**
 * Recursively migrates a collection (and all subcollections) from source to target.
 */
async function migrateCollection(sourcePath, targetPath, depth = 0) {
    const indent = '  '.repeat(depth);
    const sourceRef = sourceDb.collection(sourcePath);
    const snapshot = await sourceRef.get();

    if (snapshot.empty) {
        console.log(`${indent}⚠️  ${sourcePath} — empty, skipping`);
        return;
    }

    console.log(`${indent}📦 ${sourcePath} — ${snapshot.size} documents`);

    // Write in batches
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = targetDb.batch();
        const chunk = docs.slice(i, i + BATCH_SIZE);

        for (const doc of chunk) {
            const targetRef = targetDb.collection(targetPath).doc(doc.id);
            batch.set(targetRef, doc.data());
        }

        await batch.commit();
        console.log(`${indent}  ✅ Written ${Math.min(i + BATCH_SIZE, docs.length)} / ${docs.length}`);
    }

    // Recurse into subcollections
    for (const doc of docs) {
        const subCollections = await sourceDb
            .collection(sourcePath)
            .doc(doc.id)
            .listCollections();

        for (const subCol of subCollections) {
            await migrateCollection(
                `${sourcePath}/${doc.id}/${subCol.id}`,
                `${targetPath}/${doc.id}/${subCol.id}`,
                depth + 1
            );
        }
    }
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🚀 Starting Firestore migration (Primary → Secondary)...');
    console.log('   Source: phearum-info');
    console.log('   Target: kem-phearum\n');

    const start = Date.now();

    for (const collection of COLLECTIONS) {
        try {
            await migrateCollection(collection, collection);
        } catch (err) {
            console.error(`❌ Error migrating ${collection}:`, err.message);
        }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✨ Migration complete in ${elapsed}s`);
    process.exit(0);
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
