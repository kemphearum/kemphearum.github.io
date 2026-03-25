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

const RETRYABLE_ERROR_CODES = new Set([4, 8, 10, 14, 'deadline-exceeded', 'resource-exhausted', 'aborted', 'unavailable']);
const DEFAULT_MAX_ATTEMPTS = Number(process.env.SEED_RETRY_MAX_ATTEMPTS || 7);
const DEFAULT_BASE_DELAY_MS = Number(process.env.SEED_RETRY_BASE_DELAY_MS || 1000);
const DEFAULT_MAX_DELAY_MS = Number(process.env.SEED_RETRY_MAX_DELAY_MS || 20000);
const TRUNCATE_PAUSE_MS = Number(process.env.SEED_TRUNCATE_PAUSE_MS || 250);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function isQuotaError(error) {
    const message = String(error?.message || '').toLowerCase();
    return (
        error?.code === 8
        || error?.code === 'resource-exhausted'
        || message.includes('resource_exhausted')
        || message.includes('quota exceeded')
    );
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

async function deleteDocumentRecursive(docRef) {
    const subcollections = await withRetry(() => docRef.listCollections(), `list subcollections for ${docRef.path}`);
    for (const sub of subcollections) {
        await deleteCollectionRecursive(sub);
    }
    await withRetry(() => docRef.delete(), `delete ${docRef.path}`);
}

async function deleteCollectionRecursive(collectionRef, batchSize = 100) {
    while (true) {
        const snapshot = await withRetry(
            () => collectionRef.orderBy('__name__').limit(batchSize).get(),
            `scan ${collectionRef.path}`
        );
        if (snapshot.empty) break;

        for (const docSnap of snapshot.docs) {
            await deleteDocumentRecursive(docSnap.ref);
        }

        if (TRUNCATE_PAUSE_MS > 0) {
            await sleep(TRUNCATE_PAUSE_MS);
        }
    }
}

async function truncateCollectionByName(collectionName) {
    const collectionRef = db.collection(collectionName);

    if (typeof db.recursiveDelete === 'function') {
        const bulkWriter = typeof db.bulkWriter === 'function' ? db.bulkWriter() : null;

        if (bulkWriter && typeof bulkWriter.onWriteError === 'function') {
            bulkWriter.onWriteError((error) => (
                isRetryableError(error) && error.failedAttempts < DEFAULT_MAX_ATTEMPTS
            ));
        }

        try {
            await withRetry(
                () => (bulkWriter ? db.recursiveDelete(collectionRef, bulkWriter) : db.recursiveDelete(collectionRef)),
                `recursive delete ${collectionName}`
            );
            return;
        } finally {
            if (bulkWriter) {
                await bulkWriter.close().catch(() => {});
            }
        }
    }

    // Fallback for older Firestore Admin SDKs.
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
        ? (await withRetry(() => db.listCollections(), 'list top-level collections')).map((collectionRef) => collectionRef.id).sort()
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

        if (TRUNCATE_PAUSE_MS > 0) {
            await sleep(TRUNCATE_PAUSE_MS);
        }
    }

    if (truncateErrors.length) {
        const quotaFailure = truncateErrors.find((item) => isQuotaError(item.error));
        if (quotaFailure) {
            throw new Error(
                `Quota exceeded while truncating "${quotaFailure.collectionName}". ` +
                'Retry later after Firestore quota resets, or run standard reset first.'
            );
        }

        const first = truncateErrors[0];
        throw new Error(`Truncate failed for ${truncateErrors.length} collection(s). First failure: ${first.collectionName} -> ${first.error.message}`);
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
        if (isQuotaError(error)) {
            console.error('Tip: Free-tier quota resets daily. Until reset, write/delete operations may fail with RESOURCE_EXHAUSTED.');
        }
        process.exit(1);
    });
