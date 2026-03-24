const { execSync } = require('child_process');
const admin = require('firebase-admin');
const serviceAccount = require('../sa-source.json');
const path = require('path');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const COLLECTIONS = [
    'posts',
    'projects',
    'experience',
    'content',
    'messages',
    // 'settings', <-- Excluded to preserve audit/role/system settings
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

async function deleteCollection(collectionPath, batchSize = 500) {
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.orderBy('__name__').limit(batchSize).get();

    if (snapshot.size === 0) return;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    await deleteCollection(collectionPath, batchSize);
}

async function runSeedAll() {
    console.log("====================================================");
    console.log("🚀 MASTER SEED: BURN & REBUILD");
    console.log("====================================================");
    
    // STEP 1: TRUNCATE
    console.log("\n🛑 PHASE 1: TRUNCATING COLLECTIONS...");
    for (const collectionName of COLLECTIONS) {
        process.stdout.write(`   Truncating ${collectionName}... `);
        try {
            await deleteCollection(collectionName);
            console.log("✅");
        } catch (error) {
            console.log("❌");
            console.error(`      Error: ${error.message}`);
        }
    }

    // STEP 2: SEED
    console.log("\n🌱 PHASE 2: SEEDING NEW DATA...");
    for (const scriptName of SEED_SCRIPTS) {
        console.log(`\n--- Running ${scriptName} ---`);
        try {
            // We use inherit to see the output of the sub-scripts
            execSync(`node scripts/${scriptName}`, { stdio: 'inherit' });
            console.log(`✅ ${scriptName} completed.`);
        } catch (error) {
            console.error(`❌ ${scriptName} failed.`);
        }
    }

    console.log("\n====================================================");
    console.log("🎉 MASTER SEED COMPLETED SUCCESSFULLY!");
    console.log("====================================================");
    process.exit(0);
}

runSeedAll().catch(err => {
    console.error(err);
    process.exit(1);
});
