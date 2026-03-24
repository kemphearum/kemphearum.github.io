const admin = require('firebase-admin');
const serviceAccount = require('../sa-source.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function fetchExperience() {
    console.log("Fetching all experience records...");
    const snapshot = await db.collection('experience').get();
    const experiences = [];
    
    snapshot.forEach(doc => {
        experiences.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(JSON.stringify(experiences, null, 2));
    process.exit(0);
}

fetchExperience().catch(err => {
    console.error(err);
    process.exit(1);
});
