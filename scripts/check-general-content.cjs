const admin = require('firebase-admin');
const serviceAccount = require('../sa-source.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkGeneralContent() {
    console.log("Checking general content...");
    const home = await db.collection('content').doc('home').get();
    const about = await db.collection('content').doc('about').get();
    const contact = await db.collection('content').doc('contact').get();
    const settings = await db.collection('settings').doc('global').get();

    console.log("HOME:", JSON.stringify(home.data(), null, 2));
    console.log("ABOUT:", JSON.stringify(about.data(), null, 2));
    console.log("CONTACT:", JSON.stringify(contact.data(), null, 2));
    console.log("SETTINGS:", JSON.stringify(settings.data()?.site, null, 2));
    process.exit(0);
}

checkGeneralContent().catch(err => {
    console.error(err);
    process.exit(1);
});
