/**
 * Firestore Migration Script
 * Copies all data from portfolio-77db2 → phearum-info
 *
 * Usage: node migrate.cjs
 */

const admin = require('firebase-admin');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const SOURCE_SERVICE_ACCOUNT = require('./sa-source.json');
const TARGET_SERVICE_ACCOUNT = require('./sa-target.json');

const COLLECTIONS = [
    'content',
    'projects',
    'experience',
    'posts',
    'messages',
    'users',
    'rolePermissions',
    'auditLogs',
];

const BATCH_SIZE = 400;
// ───────────────────────────────────────────────────────────────────────────

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

async function migrateCollection(sourcePath, targetPath, depth = 0) {
    const indent = '  '.repeat(depth);
    const snapshot = await sourceDb.collection(sourcePath).get();

    if (snapshot.empty) {
        console.log(`${indent}⚠️  ${sourcePath} — empty, skipping`);
        return;
    }

    console.log(`${indent}📦 ${sourcePath} — ${snapshot.size} documents`);

    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = targetDb.batch();
        const chunk = docs.slice(i, i + BATCH_SIZE);
        for (const doc of chunk) {
            batch.set(targetDb.collection(targetPath).doc(doc.id), doc.data());
        }
        await batch.commit();
        console.log(`${indent}  ✅ Written ${Math.min(i + BATCH_SIZE, docs.length)} / ${docs.length}`);
    }

    for (const doc of docs) {
        const subCols = await sourceDb.collection(sourcePath).doc(doc.id).listCollections();
        for (const sub of subCols) {
            await migrateCollection(
                `${sourcePath}/${doc.id}/${sub.id}`,
                `${targetPath}/${doc.id}/${sub.id}`,
                depth + 1
            );
        }
    }
}

async function main() {
    console.log('\n🚀 Starting Firestore migration...');
    console.log('   Source: portfolio-77db2');
    console.log('   Target: phearum-info\n');
    const start = Date.now();

    for (const col of COLLECTIONS) {
        try {
            await migrateCollection(col, col);
        } catch (err) {
            console.error(`❌ Error migrating ${col}:`, err.message);
        }
    }

    console.log(`\n✨ Migration complete in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    process.exit(0);
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
