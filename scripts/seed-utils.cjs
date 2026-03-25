const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const BATCH_LIMIT = 450;

function resolveServiceAccountPath() {
    const fromEnv = process.env.SA_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const candidate = fromEnv
        ? path.resolve(process.cwd(), fromEnv)
        : path.resolve(__dirname, '..', 'sa-source.json');

    if (!fs.existsSync(candidate)) {
        throw new Error(
            `Service account file not found at "${candidate}". ` +
            'Set SA_FILE or GOOGLE_APPLICATION_CREDENTIALS to a valid JSON path.'
        );
    }

    return candidate;
}

function initDb() {
    if (!admin.apps.length) {
        const serviceAccountPath = resolveServiceAccountPath();
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    return admin.firestore();
}

function chunk(array, size = BATCH_LIMIT) {
    const chunks = [];
    for (let index = 0; index < array.length; index += size) {
        chunks.push(array.slice(index, index + size));
    }
    return chunks;
}

async function seedById(db, collectionName, rows, options = {}) {
    const {
        merge = true,
        idSelector = (row) => row.slug,
        transform = (row) => row,
        onItem = null
    } = options;

    const failures = [];
    const prepared = rows.map((row, index) => ({
        id: idSelector(row, index),
        row,
        index
    }));

    const invalid = prepared.filter((entry) => !entry.id || typeof entry.id !== 'string');
    if (invalid.length) {
        throw new Error(`${collectionName}: ${invalid.length} rows are missing a valid document ID.`);
    }

    for (const subset of chunk(prepared)) {
        const batch = db.batch();
        const subsetFailures = [];

        subset.forEach((entry) => {
            try {
                const payload = transform(entry.row, entry.index);
                batch.set(db.collection(collectionName).doc(entry.id), payload, { merge });
            } catch (error) {
                failures.push({ id: entry.id, error });
                subsetFailures.push({ id: entry.id, error });
            }
        });

        if (subsetFailures.length) {
            const first = subsetFailures[0];
            throw new Error(`${collectionName}: failed to prepare payload for ${first.id}: ${first.error.message}`);
        }

        await batch.commit();
        subset.forEach((entry) => {
            if (onItem) onItem(entry.row, entry.id, entry.index);
        });
    }

    if (failures.length) {
        const first = failures[0];
        throw new Error(`${collectionName}: ${failures.length} rows failed while preparing batch. First: ${first.id} -> ${first.error.message}`);
    }

    return prepared.length;
}

function toDate(value) {
    if (value instanceof Date) return value;
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function truncateMissing(db, collectionName, idList) {
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.orderBy('__name__').get();
    
    if (snapshot.empty) return 0;

    let deletedCount = 0;
    const idsToKeep = new Set(idList);
    const deleteDocumentRecursive = async (docRef) => {
        const subcollections = await docRef.listCollections();
        for (const sub of subcollections) {
            const subSnap = await sub.get();
            for (const subDoc of subSnap.docs) {
                await deleteDocumentRecursive(subDoc.ref);
            }
        }
        await docRef.delete();
    };

    for (const doc of snapshot.docs) {
        if (!idsToKeep.has(doc.id)) {
            await deleteDocumentRecursive(doc.ref);
            deletedCount++;
        }
    }

    return deletedCount;
}

module.exports = {
    admin,
    BATCH_LIMIT,
    initDb,
    seedById,
    truncateMissing,
    toDate
};
