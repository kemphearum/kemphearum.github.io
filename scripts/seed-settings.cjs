const { admin, initDb } = require('./seed-utils.cjs');

const db = initDb();

const settingsGlobal = {
    site: {
        pageTitle: {
            en: "KEM PHEARUM | Portfolio",
            km: "កឹម ភារម្យ | ផតថលីយ៉ូ"
        },
        pageDescription: {
            en: "ICT Security & IT Audit Professional based in Phnom Penh, Cambodia.",
            km: "អ្នកជំនាញ ICT Security និង IT Audit ដែលមានមូលដ្ឋាននៅរាជធានីភ្នំពេញ ប្រទេសកម្ពុជា។"
        },
        pageFaviconUrl: "/vite.svg", // Default vite icon or custom
        footerText: {
            en: "© 2026 KEM PHEARUM. Built with React & Firebase.",
            km: "រក្សាសិទ្ធិឆ្នាំ 2026 ដោយ កឹម ភារម្យ។ បង្កើតឡើងដោយ React និង Firebase។"
        },
        logoText: "PHEARUM",
        logoHighlight: "KEM",
        tagline: {
            en: "ICT Security & IT Audit Professional",
            km: "អ្នកជំនាញ ICT Security និង IT Audit"
        },
        mirrors: [
            { name: 'GitHub Pages', url: 'https://kemphearum.github.io/' },
            { name: 'Vercel Mirror', url: 'https://phearum-info.vercel.app/' },
            { name: 'Firebase Primary', url: 'https://phearum-info.web.app/' },
            { name: 'Firebase Mirror', url: 'https://kem-phearum.web.app/' }
        ],
        glassOpacity: 0.82,
        glassBlur: 12,
        glassColor: '#0b1527'
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
    await Promise.all([
        db.collection('settings').doc('global').set(settingsGlobal, { merge: false }),
        db.collection('settings').doc('metadata').set({ typography: typographyMetadata }, { merge: false })
    ]);
    console.log("Successfully seeded 'settings/global' and 'settings/metadata' content");

    console.log("Settings seeding completed.");
}

seedSettings()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Settings seeding failed:', error.message || error);
        process.exit(1);
    });
