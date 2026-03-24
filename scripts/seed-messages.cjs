const admin = require('firebase-admin');
const serviceAccount = require('../sa-source.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const messages = [
    {
        name: "Sopheap Chan",
        email: "sopheap.c@example.com",
        message: "Hello Phearum! I'm really impressed by your portfolio and IT auditing background. Are you currently open to consultation work for a local fintech startup?",
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        name: "David Smith",
        email: "david.smith@techinnovators.com",
        message: "Hi, I noticed your extensive experience with both React and Cybersecurity. That's a rare combination! We have an open Senior Security Engineer position and would love to chat.",
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
        name: "Ratanak Sok",
        email: "ratanak.sok99@gmail.com",
        message: "សួស្តីបង! ខ្ញុំគឺជានិស្សិតឆ្នាំទី៣ ផ្នែកវិទ្យាសាស្ត្រកុំព្យូទ័រ។ ខ្ញុំចង់សុំយោបល់បងបន្តិចអំពីការរៀបចំខ្លួនដើម្បីក្លាយជាអ្នក IT Audit ដ៏ពូកែម្នាក់។ តើមានសៀវភៅ ឬវគ្គសិក្សាណាដែលបងណែនាំទេ?",
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    },
    {
        name: "Sarah Jenkins",
        email: "s.jenkins@creativeagency.net",
        message: "Just dropping by to say that the UI of your portfolio is absolutely stunning. The animations are so smooth, and the bilingual support is implemented perfectly. Great job!",
        isRead: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    },
    {
        name: "Vichea Meng",
        email: "vichea.meng@cambodiabank.com.kh",
        message: "Dear Kem Phearum, we are reviewing our internal IT compliance protocols and would value an external perspective. Would you be available for a 30-minute introductory call next week?",
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
];

async function seedMessages() {
    console.log("Starting messages seeding process...");
    
    for (let i = 0; i < messages.length; i++) {
        await db.collection('messages').add(messages[i]);
        console.log(`Successfully seeded message ${i + 1}`);
    }

    console.log("Messages seeding completed.");
    process.exit(0);
}

seedMessages().catch(err => {
    console.error(err);
    process.exit(1);
});
