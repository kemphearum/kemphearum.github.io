const { initDb } = require('./seed-utils.cjs');

const db = initDb();

async function checkGeneralContent() {
    console.log("Checking general content...");
    const [home, about, contact, settings] = await Promise.all([
        db.collection('content').doc('home').get(),
        db.collection('content').doc('about').get(),
        db.collection('content').doc('contact').get(),
        db.collection('settings').doc('global').get()
    ]);

    console.log("HOME:", JSON.stringify(home.data(), null, 2));
    console.log("ABOUT:", JSON.stringify(about.data(), null, 2));
    console.log("CONTACT:", JSON.stringify(contact.data(), null, 2));
    console.log("SETTINGS:", JSON.stringify(settings.data()?.site, null, 2));
}

checkGeneralContent()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('General content check failed:', error.message || error);
        process.exit(1);
    });
