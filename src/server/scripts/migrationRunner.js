/* global process */
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Import domain normalizers
import { normalizeProject } from '../../domain/project/projectDomain.js';
import { normalizeExperience } from '../../domain/experience/experienceDomain.js';
import { normalizeSkill } from '../../domain/skill/skillDomain.js';
import { normalizeCertificate } from '../../domain/certificate/certificateDomain.js';
import { normalizeEducation } from '../../domain/education/educationDomain.js';
import { normalizePost } from '../../domain/blog/blogDomain.js';

// Parse service account from env, similar to firebaseAdmin.js
const parseServiceAccount = () => {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON in environment. Please set it.');
    }

    const parsed = JSON.parse(raw);
    if (parsed.private_key) {
        parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n');
    }
    return parsed;
};

// Initialize Firebase Admin
const initDb = () => {
    if (!getApps().length) {
        const serviceAccount = parseServiceAccount();
        initializeApp({ credential: cert(serviceAccount) });
    }
    return getFirestore();
};

const COLLECTIONS = [
    { name: 'projects', normalizer: normalizeProject },
    { name: 'experience', normalizer: normalizeExperience },
    { name: 'skills', normalizer: normalizeSkill },
    { name: 'certificates', normalizer: normalizeCertificate },
    { name: 'education', normalizer: normalizeEducation },
    { name: 'posts', normalizer: normalizePost }
];

const runMigration = async () => {
    console.log('Starting schema normalization migration...');
    const db = initDb();

    let totalUpdated = 0;

    for (const { name, normalizer } of COLLECTIONS) {
        console.log(`\nProcessing collection: ${name}`);
        const snapshot = await db.collection(name).get();
        
        let batch = db.batch();
        let batchCount = 0;
        let colUpdated = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Apply domain normalization
            const normalizedData = normalizer(data);
            
            // Detect if fields were changed or dropped (shallow comparison of keys/values)
            // Or we just forcefully rewrite everything to ensure strict schema adherence
            
            // To ensure strict schema, we merge normalized data, but since we want to drop unknown fields,
            // we should technically replace the document or specify exact fields.
            // But Firestore `set` with `merge: false` replaces the whole document, which might drop system fields like `createdAt`.
            // So we explicitly copy `createdAt`, `updatedAt`, `createdBy`, `updatedBy` if they exist.
            
            const systemFields = {};
            if (data.createdAt) systemFields.createdAt = data.createdAt;
            if (data.updatedAt) systemFields.updatedAt = data.updatedAt;
            if (data.createdBy) systemFields.createdBy = data.createdBy;
            if (data.updatedBy) systemFields.updatedBy = data.updatedBy;
            
            const finalData = { ...normalizedData, ...systemFields };
            
            const docRef = db.collection(name).doc(doc.id);
            batch.set(docRef, finalData, { merge: false }); // merge: false drops unknown fields
            
            batchCount++;
            colUpdated++;

            if (batchCount === 500) {
                await batch.commit();
                batch = db.batch();
                batchCount = 0;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        console.log(`Finished ${name}: Updated ${colUpdated} documents.`);
        totalUpdated += colUpdated;
    }

    console.log(`\nMigration complete. Total documents normalized: ${totalUpdated}`);
};

// Run the script
runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
