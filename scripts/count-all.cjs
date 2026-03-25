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
    'dailyUsage',
    'users',
    'rolePermissions'
];

async function countAll() {
    console.log('--- FIRESTORE DOCUMENT COUNTS ---');
    for (const name of COLLECTIONS) {
        try {
            const snapshot = await db.collection(name).count().get();
            console.log(`${name.padEnd(16)}: ${snapshot.data().count}`);
        } catch (e) {
            console.log(`${name.padEnd(16)}: ERROR (${e.message})`);
        }
    }
}

countAll().catch(console.error);
