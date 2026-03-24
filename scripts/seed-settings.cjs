const admin = require('firebase-admin');
const serviceAccount = require('../sa-source.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const settingsGlobal = {
    site: {
        pageTitle: { 
            en: "Kem Phearum | Portfolio", 
            km: "កែម ភារម្យ | ផតថលីយ៉ូ" 
        },
        pageDescription: { 
            en: "ICT Security & IT Audit Professional based in Phnom Penh, Cambodia.", 
            km: "អ្នកជំនាញ ICT Security និង IT Audit ដែលមានមូលដ្ឋាននៅរាជធានីភ្នំពេញ ប្រទេសកម្ពុជា។" 
        },
        pageFaviconUrl: "/vite.svg", // Default vite icon or custom
        footerText: { 
            en: "© 2026 Kem Phearum. Built with React & Firebase.", 
            km: "រក្សាសិទ្ធិឆ្នាំ 2026 ដោយ កែម ភារម្យ។ បង្កើតឡើងដោយ React និង Firebase។" 
        },
        logoText: "Phearum",
        logoHighlight: "Kem ",
        tagline: { 
            en: "ICT Security & IT Audit Professional", 
            km: "អ្នកជំនាញ ICT Security និង IT Audit" 
        },
        mirrors: [
            { name: 'GitHub Pages', url: 'https://kemphearum.github.io/' },
            { name: 'Vercel Mirror', url: 'https://phearum-info.vercel.app/' },
            { name: 'Firebase Primary', url: 'https://phearum-info.web.app/' },
            { name: 'Firebase Mirror', url: 'https://kem-phearum.web.app/' }
        ]
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

const typographyMetadata = {
    fontOptions: [
        { value: 'inter', label: 'Inter' },
        { value: 'kantumruy-pro', label: 'Kantumruy Pro' },
        { value: 'battambang', label: 'Battambang' },
        { value: 'jetbrains-mono', label: 'JetBrains Mono' }
    ],
    activePreset: 'modern-minimal'
};

async function seedSettings() {
    console.log("Starting settings seeding process...");
    
    await db.collection('settings').doc('global').set(settingsGlobal, { merge: true });
    console.log("Successfully seeded 'settings/global' content");

    await db.collection('settings').doc('metadata').set({ typography: typographyMetadata }, { merge: true });
    console.log("Successfully seeded 'settings/metadata' (typography) content");

    console.log("Settings seeding completed.");
    process.exit(0);
}

seedSettings().catch(err => {
    console.error(err);
    process.exit(1);
});
