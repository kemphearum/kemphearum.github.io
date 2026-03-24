const { spawnSync } = require('child_process');
const path = require('path');
const { initDb } = require('./seed-utils.cjs');

const db = initDb();

const COLLECTIONS = [
    'posts',
    'projects',
    'experience',
    'content',
    'messages',
    // Intentionally preserve settings and roles/users by default.
    'auditLogs',
    'visits',
    'dailyUsage'
];

const SEED_SCRIPTS = [
    'seed-projects.cjs',
    'seed-blog.cjs',
    'seed-experience.cjs',
    'seed-general.cjs',
    'seed-settings.cjs',
    'seed-messages.cjs'
];

async function deleteDocumentRecursive(docRef) {
    const subcollections = await docRef.listCollections();
    for (const sub of subcollections) {
        await deleteCollectionRecursive(sub);
    }
    await docRef.delete();
}

async function deleteCollectionRecursive(collectionRef, batchSize = 100) {
    while (true) {
        const snapshot = await collectionRef.orderBy('__name__').limit(batchSize).get();
        if (snapshot.empty) break;

        for (const docSnap of snapshot.docs) {
            await deleteDocumentRecursive(docSnap.ref);
        }
    }
}

async function truncateCollectionByName(collectionName) {
    const collectionRef = db.collection(collectionName);
    await deleteCollectionRecursive(collectionRef);
}

function runChildScript(scriptName) {
    const scriptPath = path.join(__dirname, scriptName);
    const result = spawnSync(process.execPath, [scriptPath], {
        stdio: 'inherit',
        shell: false
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(`${scriptName} exited with code ${result.status}`);
    }
}

async function runSeedAll() {
    console.log('====================================================');
    console.log('MASTER SEED: CLEAN + REBUILD');
    console.log('====================================================');

    console.log('\n[1/2] Truncating selected collections...');
    const truncateErrors = [];

    for (const collectionName of COLLECTIONS) {
        process.stdout.write(`   - ${collectionName}: `);
        try {
            await truncateCollectionByName(collectionName);
            console.log('OK');
        } catch (error) {
            console.log('FAILED');
            truncateErrors.push({ collectionName, error });
            console.error(`     ${error.message}`);
        }
    }

    if (truncateErrors.length) {
        throw new Error(`Truncate failed for ${truncateErrors.length} collection(s).`);
    }

    console.log('\n[2/2] Running seed scripts...');
    const seedErrors = [];

    for (const scriptName of SEED_SCRIPTS) {
        console.log(`\n--- ${scriptName} ---`);
        try {
            runChildScript(scriptName);
            console.log(`OK: ${scriptName}`);
        } catch (error) {
            seedErrors.push({ scriptName, error });
            console.error(`FAILED: ${scriptName}`);
            console.error(`  ${error.message}`);
        }
    }

    if (seedErrors.length) {
        throw new Error(`Seeding failed for ${seedErrors.length} script(s).`);
    }

    console.log('\n====================================================');
    console.log('MASTER SEED COMPLETED');
    console.log('====================================================');
}

runSeedAll()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\nMASTER SEED FAILED');
        console.error(error.message || error);
        process.exit(1);
    });
