const { initDb } = require('./seed-utils.cjs');

const db = initDb();

async function fetchExperience() {
    console.log("Fetching all experience records...");
    const snapshot = await db.collection('experience').get();
    const experiences = [];
    
    snapshot.forEach(doc => {
        experiences.push({ id: doc.id, ...doc.data() });
    });
    experiences.sort((a, b) => {
        if (Number.isFinite(a.order) && Number.isFinite(b.order)) {
            return a.order - b.order;
        }
        return String(a.id).localeCompare(String(b.id));
    });

    console.log(JSON.stringify(experiences, null, 2));
}

fetchExperience()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fetch experience failed:', error.message || error);
        process.exit(1);
    });
