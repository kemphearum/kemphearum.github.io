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
    'settings',
    'auditLogs',
    'visits',
    'dailyUsage'
];

const HARD_RESET_COLLECTIONS = [
    'users',
    'rolePermissions'
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
    const fullResetEnabled = process.argv.includes('--full-reset') || process.env.FULL_RESET === '1';
    const hardResetEnabled = process.argv.includes('--hard-reset') || process.env.HARD_RESET === '1';
    const collectionsToTruncate = fullResetEnabled
        ? (await db.listCollections()).map((collectionRef) => collectionRef.id).sort()
        : (hardResetEnabled ? [...COLLECTIONS, ...HARD_RESET_COLLECTIONS] : COLLECTIONS);

    console.log('====================================================');
    console.log('MASTER SEED: CLEAN + REBUILD');
    console.log('====================================================');
    if (fullResetEnabled) {
        console.log('Mode: FULL RESET (all top-level collections)');
    } else if (hardResetEnabled) {
        console.log('Mode: HARD RESET (includes users/rolePermissions)');
    } else {
        console.log('Mode: STANDARD RESET');
    }
    console.log(`Collections scheduled for truncation: ${collectionsToTruncate.length}`);

    console.log('\n[1/2] Truncating selected collections...');
    const truncateErrors = [];

    for (const collectionName of collectionsToTruncate) {
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

    if (!fullResetEnabled && !hardResetEnabled) {
        console.log('\nNote: users and rolePermissions are preserved. Use --hard-reset (or HARD_RESET=1) to wipe them.');
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
