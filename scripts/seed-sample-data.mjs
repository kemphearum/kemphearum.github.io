/**
 * Seed representative sample data for every CMS content type so the public site
 * can be verified end-to-end. Zero-cost: writes plain documents to your existing
 * Firestore (no Storage — images are inline SVG data URLs, matching the project's
 * base64-in-Firestore approach).
 *
 * Uses firebase-admin (same dependency as functions/) which bypasses security
 * rules, so run it with credentials:
 *
 *   # Option A — service account file
 *   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccountKey.json   (PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS="...")
 *   node scripts/seed-sample-data.mjs
 *
 *   # Option B — gcloud application-default credentials
 *   gcloud auth application-default login
 *   node scripts/seed-sample-data.mjs --project <your-firebase-project-id>
 *
 * Re-running is safe: documents use fixed ids (sample-*) and are merged.
 */
import admin from 'firebase-admin';

const projectId = (() => {
    const idx = process.argv.indexOf('--project');
    return idx !== -1 ? process.argv[idx + 1] : process.env.FIREBASE_PROJECT_ID;
})();

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    ...(projectId ? { projectId } : {})
});

const db = admin.firestore();
const now = admin.firestore.FieldValue.serverTimestamp();

// Compact inline SVG placeholder (data URL) — stands in for an uploaded image.
const cover = (label, color) =>
    `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" fill="#fff" font-family="Arial" font-size="42" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
    )}`;

const L = (en, km = '') => ({ en, km });

const DATA = {
    projects: [
        {
            id: 'sample-isms',
            title: L('ISO 27001 ISMS Implementation', 'ការអនុវត្ត ISMS ISO 27001'),
            description: L('Built and certified an information security management system covering 93 Annex A controls.', ''),
            content: L('# ISMS Implementation\n\nLed the end-to-end rollout: risk assessment, Statement of Applicability, policies, internal audit, and certification.', ''),
            techStack: ['ISO 27001', 'Risk Management', 'Policy', 'Internal Audit'],
            githubUrl: '', liveUrl: 'https://example.com/isms', slug: 'iso-27001-isms',
            imageUrl: cover('ISMS', '#2f6df6'), featured: true, order: 1
        },
        {
            id: 'sample-soc',
            title: L('Security Operations Dashboard', 'ផ្ទាំងគ្រប់គ្រងប្រតិបត្តិការសន្តិសុខ'),
            description: L('A SIEM-backed dashboard surfacing alerts, incidents, and compliance posture in real time.', ''),
            content: L('# SOC Dashboard\n\nReact + Firestore dashboard aggregating security telemetry.', ''),
            techStack: ['React', 'Firebase', 'SIEM', 'Grafana'],
            githubUrl: 'https://github.com/example/soc', liveUrl: '', slug: 'security-operations-dashboard',
            imageUrl: cover('SOC', '#14b8a6'), featured: false, order: 2
        }
    ],
    posts: [
        {
            id: 'sample-zero-trust',
            title: L('Adopting Zero Trust Architecture', 'ការអនុវត្តស្ថាបត្យកម្ម Zero Trust'),
            excerpt: L('A practical migration path from perimeter security to identity-centric Zero Trust.', ''),
            content: L('# Zero Trust\n\nNever trust, always verify. This post covers identity, device posture, and segmentation.', ''),
            tags: ['Zero Trust', 'Security', 'Architecture'],
            coverImage: cover('Zero Trust', '#7c3aed'), slug: 'adopting-zero-trust', featured: true
        },
        {
            id: 'sample-audit',
            title: L('Preparing for Your First ISO Audit', 'ការត្រៀមសម្រាប់សវនកម្ម ISO ដំបូង'),
            excerpt: L('Checklist and lessons learned from closing audit findings ahead of certification.', ''),
            content: L('# First ISO Audit\n\nEvidence, traceability, and how to close non-conformities efficiently.', ''),
            tags: ['ISO 27001', 'Audit', 'Compliance'],
            coverImage: cover('ISO Audit', '#f59e0b'), slug: 'first-iso-audit', featured: false
        }
    ],
    experience: [
        {
            id: 'sample-exp-1',
            company: L('National ICT Authority', 'អាជ្ញាធរ ICT ជាតិ'),
            role: L('ICT Security & Governance Lead', 'ប្រធានសន្តិសុខ និងអភិបាលកិច្ច ICT'),
            description: L('Led ISMS implementation, risk management, and security policy authorship across the organization.', ''),
            startMonthYear: '2022-01', endMonthYear: '', period: 'Jan 2022 - Present', current: true, order: 1
        },
        {
            id: 'sample-exp-2',
            company: L('FinTech Solutions Ltd', 'ក្រុមហ៊ុន FinTech Solutions'),
            role: L('IT Auditor', 'សវនករ IT'),
            description: L('Performed IT general controls audits and compliance mapping for financial systems.', ''),
            startMonthYear: '2019-06', endMonthYear: '2021-12', period: 'Jun 2019 - Dec 2021', current: false, order: 2
        }
    ],
    skills: [
        { id: 'sample-skill-1', name: L('ISO/IEC 27001'), category: 'Governance', level: 'expert', slug: 'iso-27001', featured: true, order: 1 },
        { id: 'sample-skill-2', name: L('Risk Management'), category: 'Governance', level: 'advanced', slug: 'risk-management', featured: false, order: 2 },
        { id: 'sample-skill-3', name: L('SIEM & Monitoring'), category: 'Security Operations', level: 'advanced', slug: 'siem', featured: false, order: 3 },
        { id: 'sample-skill-4', name: L('React'), category: 'Engineering', level: 'advanced', slug: 'react', featured: false, order: 4 }
    ],
    certificates: [
        {
            id: 'sample-cert-1', name: L('CISSP'), organization: '(ISC)2', issueDate: '2023-05', expiryDate: '2026-05',
            credentialId: 'CISSP-123456', url: 'https://example.com/verify/cissp', slug: 'cissp', featured: true, order: 1
        },
        {
            id: 'sample-cert-2', name: L('ISO 27001 Lead Implementer'), organization: 'PECB', issueDate: '2022-09', expiryDate: '',
            credentialId: 'PECB-7788', url: 'https://example.com/verify/pecb', slug: 'iso-27001-lead-implementer', featured: false, order: 2
        }
    ],
    education: [
        {
            id: 'sample-edu-1',
            school: L('Royal University of Phnom Penh', 'សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ'),
            degree: L('Bachelor of Science', 'បរិញ្ញាបត្រវិទ្យាសាស្ត្រ'),
            fieldOfStudy: L('Computer Science', 'វិទ្យាសាស្ត្រកុំព្យូទ័រ'),
            description: L('Focus on software engineering, algorithms, and cybersecurity fundamentals.', ''),
            startYear: '2015', endYear: '2019', isCurrent: false, visible: true, order: 1
        },
        {
            id: 'sample-edu-2',
            school: L('Institute of Technology of Cambodia', 'វិទ្យាស្ថានបច្ចេកវិទ្យាកម្ពុជា'),
            degree: L('Master of Information Technology', 'បរិញ្ញាបត្រជាន់ខ្ពស់បច្ចេកវិទ្យាព័ត៌មាន'),
            fieldOfStudy: L('Data Science and Security', 'វិទ្យាសាស្ត្រទិន្នន័យ និងសន្តិសុខ'),
            description: L('Advanced research in applied cryptography and network security.', ''),
            startYear: '2020', endYear: '2022', isCurrent: false, visible: true, order: 2
        }
    ]
};

const publishFields = { status: 'published', visible: true, publishedAt: new Date().toISOString() };

const run = async () => {
    let total = 0;
    for (const [collection, docs] of Object.entries(DATA)) {
        for (const { id, ...data } of docs) {
            const isContent = collection === 'projects' || collection === 'posts';
            await db.collection(collection).doc(id).set({
                ...data,
                visible: true,
                featured: data.featured ?? false,
                ...(isContent ? publishFields : {}),
                createdAt: now,
                updatedAt: now
            }, { merge: true });
            total += 1;
        }
        console.log(`Seeded ${docs.length} ${collection}`);
    }
    console.log(`\nDone. ${total} sample documents written. Open the public site to verify.`);
    process.exit(0);
};

run().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
