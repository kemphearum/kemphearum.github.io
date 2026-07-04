import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const saPath = path.resolve(__dirname, '../sa-backup.json');
    if (fs.existsSync(saPath)) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = saPath;
    }
}

const projectId = (() => {
    const idx = process.argv.indexOf('--project');
    return idx !== -1 ? process.argv[idx + 1] : process.env.FIREBASE_PROJECT_ID;
})();

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    ...(projectId ? { projectId } : {})
});

const db = admin.firestore();

const COLLECTIONS = [
    'settings', 'rolePermissions', 'users', 'projects', 'posts',
    'experience', 'skills', 'certificates', 'education', 'awards',
    'publications', 'speaking', 'content'
];

async function deleteCollection(collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

const run = async () => {
    for (const col of COLLECTIONS) {
        console.log(`Wiping collection: ${col}...`);
        await deleteCollection(col, 100);
    }
    console.log('Done wiping data.');
    process.exit(0);
};

run().catch((err) => { console.error('Wipe failed:', err); process.exit(1); });
