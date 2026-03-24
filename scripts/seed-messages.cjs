const { admin, initDb, seedById } = require('./seed-utils.cjs');

const db = initDb();

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
    await seedById(db, 'messages', messages, {
        merge: false,
        idSelector: (message, index) => {
            const emailPart = String(message.email || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            return emailPart ? `${emailPart}-${index + 1}` : `message-${index + 1}`;
        },
        transform: (message) => {
            const payload = { ...message, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
            if (payload.createdAt instanceof Date) {
                payload.createdAt = admin.firestore.Timestamp.fromDate(payload.createdAt);
            }
            return payload;
        },
        onItem: (_, id, index) => console.log(`Successfully seeded message ${index + 1} (${id})`)
    });

    console.log("Messages seeding completed.");
}

seedMessages()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Messages seeding failed:', error.message || error);
        process.exit(1);
    });
