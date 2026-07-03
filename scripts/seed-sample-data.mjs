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
 *   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\sa-backup.json   (PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS="...")
 *   node scripts/seed-sample-data.mjs --project kem-phearum
 *
 *   # Option B — gcloud application-default credentials
 *   gcloud auth application-default login
 *   node scripts/seed-sample-data.mjs --project <your-firebase-project-id>
 *
 * Re-running is safe: documents use fixed ids (sample-*) and are merged.
 */
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const saPath = path.resolve(__dirname, '../sa-backup.json');
    if (fs.existsSync(saPath)) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = saPath;
        console.log('✅ Auto-detected sa-backup.json (Development DB)');
    }
}

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
    settings: [
        {
            id: 'global',
            site: {
                title: { en: 'KEM PHEARUM | Portfolio', km: 'កឹម ភារម្យ | ស្នាដៃ' },
                tagline: { en: 'Securing Digital Landscapes', km: 'ធានាសុវត្ថិភាពឌីជីថល' },
                bgStyle: 'plexus',
                bgDensity: 50,
                bgSpeed: 50,
                bgGlowOpacity: 50,
                bgInteractive: true,
                glassOpacity: 0.82,
                glassBlur: 12,
                glassColor: '#0b1527',
                siteStatus: 'testing',
                siteStatusType: 'watermark',
                siteStatusMessage: {
                    en: "We're currently performing scheduled maintenance. Please check back soon.",
                    km: "យើងកំពុងធ្វើការថែទាំប្រព័ន្ធ។ សូមត្រឡប់មកវិញនៅពេលក្រោយ។"
                },
                mirrors: [
                    { name: 'GitHub Pages', url: 'https://kemphearum.github.io/' },
                    { name: 'Vercel Production', url: 'https://phearum-info.vercel.app/' },
                    { name: 'Firebase Primary', url: 'https://phearum-info.web.app/' }
                ]
            },
            seo: {
                metaTitle: 'KEM PHEARUM | Information Security Portfolio',
                metaDescription: 'Information Security & Compliance Portfolio showcasing ISO 27001 implementation, risk management, and security architecture.',
                keywords: 'information security, cybersecurity, ISO 27001, ISMS, risk management, compliance, portfolio',
                ogImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200&h=630',
                twitterHandle: '@kemphearum'
            },
            system: {
                notificationsEnabled: true,
                sidebarPersistent: true
            },
            typography: {
                fontDisplay: 'kantumruy-pro-medium',
                fontHeading: 'kantumruy-pro-medium',
                fontSubheading: 'kantumruy-pro',
                fontLogo: 'kantumruy-pro-medium',
                fontNav: 'kantumruy-pro',
                fontBody: 'battambang',
                fontUI: 'kantumruy-pro',
                fontMono: 'jetbrains-mono',
                fontFooterTitle: 'kantumruy-pro',
                fontFooterLink: 'kantumruy-pro',
                fontFooterText: 'battambang',
                fontFooterBrand: 'kantumruy-pro-medium',
                fontFooterTagline: 'battambang',
                fontAdminBrand: 'kantumruy-pro-medium',
                fontAdminMenu: 'kantumruy-pro',
                fontAdminTab: 'kantumruy-pro'
            }
        }
    ],
    rolePermissions: [
        {
            id: 'admin',
            baseRole: 'admin',
            allowedTabs: ['dashboard', 'projects', 'blog', 'experience', 'skills', 'certificates', 'education', 'messages', 'communication', 'resume', 'awards', 'publications', 'speaking', 'database', 'audit'],
            allowedActions: {}
        },
        {
            id: 'editor',
            baseRole: 'editor',
            allowedTabs: ['dashboard', 'projects', 'blog', 'skills', 'certificates', 'communication'],
            allowedActions: {}
        }
    ],
    users: [
        {
            id: 'bootstrap-superadmin',
            email: 'kem.phearum@gmail.com',
            displayName: 'Kem Phearum',
            role: 'superadmin',
            isActive: true,
            photoURL: ''
        },
        {
            id: 'sample-admin',
            email: 'admin@example.com',
            displayName: 'Admin User',
            role: 'admin',
            isActive: true,
            photoURL: ''
        },
        {
            id: 'sample-editor',
            email: 'editor@example.com',
            displayName: 'Editor User',
            role: 'editor',
            isActive: true,
            photoURL: ''
        }
    ],
    projects: [
        {
            id: 'sample-isms',
            title: L('ISO 27001 ISMS Implementation', 'ការអនុវត្ត ISMS ISO 27001'),
            description: L('Built and certified an information security management system covering 93 Annex A controls.', 'បានបង្កើត និងទទួលបានវិញ្ញាបនបត្រប្រព័ន្ធគ្រប់គ្រងសន្តិសុខព័ត៌មានដែលគ្របដណ្តប់លើ 93 Annex A controls។'),
            content: L('# ISMS Implementation\n\nLed the end-to-end rollout: risk assessment, Statement of Applicability, policies, internal audit, and certification.', '# ការអនុវត្ត ISMS\n\nដឹកនាំការអនុវត្តតាំងពីដើមដល់ចប់៖ ការវាយតម្លៃហានិភ័យ សេចក្តីថ្លែងការណ៍នៃការអនុវត្ត គោលការណ៍ សវនកម្មផ្ទៃក្នុង និងវិញ្ញាបនបត្រ។'),
            techStack: ['ISO 27001', 'Risk Management', 'Policy', 'Internal Audit'],
            githubUrl: '', liveUrl: 'https://example.com/isms', slug: 'iso-27001-isms',
            imageUrl: cover('ISMS', '#2f6df6'), featured: true, order: 1
        },
        {
            id: 'sample-soc',
            title: L('Security Operations Dashboard', 'ផ្ទាំងគ្រប់គ្រងប្រតិបត្តិការសន្តិសុខ'),
            description: L('A SIEM-backed dashboard surfacing alerts, incidents, and compliance posture in real time.', 'ផ្ទាំងគ្រប់គ្រងដែលគាំទ្រដោយ SIEM បង្ហាញពីការជូនដំណឹង ព្រឹត្តិការណ៍ និងស្ថានភាពអនុលោមភាពក្នុងពេលជាក់ស្តែង។'),
            content: L('# SOC Dashboard\n\nReact + Firestore dashboard aggregating security telemetry.', '# ផ្ទាំងគ្រប់គ្រង SOC\n\nផ្ទាំងគ្រប់គ្រង React + Firestore ប្រមូលផ្តុំទិន្នន័យសន្តិសុខ។'),
            techStack: ['React', 'Firebase', 'SIEM', 'Grafana'],
            githubUrl: 'https://github.com/example/soc', liveUrl: '', slug: 'security-operations-dashboard',
            imageUrl: cover('SOC', '#14b8a6'), featured: false, order: 2
        }
    ],
    posts: [
        {
            id: 'sample-zero-trust',
            title: L('Adopting Zero Trust Architecture', 'ការអនុវត្តស្ថាបត្យកម្ម Zero Trust'),
            excerpt: L('A practical migration path from perimeter security to identity-centric Zero Trust.', 'គន្លងផ្លាស់ប្តូរជាក់ស្តែងពីសន្តិសុខបរិវេណ ទៅកាន់ Zero Trust ដែលផ្តោតលើអត្តសញ្ញាណ។'),
            content: L('# Zero Trust\n\nNever trust, always verify. This post covers identity, device posture, and segmentation.', '# Zero Trust\n\nកុំទុកចិត្ត ត្រូវផ្ទៀងផ្ទាត់ជានិច្ច។ អត្ថបទនេះនិយាយអំពីអត្តសញ្ញាណ ស្ថានភាពឧបករណ៍ និងការបែងចែក។'),
            tags: ['Zero Trust', 'Security', 'Architecture'],
            coverImage: cover('Zero Trust', '#7c3aed'), slug: 'adopting-zero-trust', featured: true
        },
        {
            id: 'sample-audit',
            title: L('Preparing for Your First ISO Audit', 'ការត្រៀមសម្រាប់សវនកម្ម ISO ដំបូង'),
            excerpt: L('Checklist and lessons learned from closing audit findings ahead of certification.', 'បញ្ជីត្រួតពិនិត្យ និងមេរៀនដែលទទួលបានពីការបិទចំណុចរកឃើញនៃសវនកម្ម មុនការទទួលបានវិញ្ញាបនបត្រ។'),
            content: L('# First ISO Audit\n\nEvidence, traceability, and how to close non-conformities efficiently.', '# សវនកម្ម ISO លើកដំបូង\n\nភស្តុតាង ការតាមដាន និងរបៀបបិទភាពមិនអនុលោមតាមច្បាប់ប្រកបដោយប្រសិទ្ធភាព។'),
            tags: ['ISO 27001', 'Audit', 'Compliance'],
            coverImage: cover('ISO Audit', '#f59e0b'), slug: 'first-iso-audit', featured: false
        }
    ],
    experience: [
        {
            id: 'sample-exp-1',
            company: L('National ICT Authority', 'អាជ្ញាធរ ICT ជាតិ'),
            role: L('ICT Security & Governance Lead', 'ប្រធានសន្តិសុខ និងអភិបាលកិច្ច ICT'),
            description: L('Led ISMS implementation, risk management, and security policy authorship across the organization.', 'ដឹកនាំការអនុវត្ត ISMS ការគ្រប់គ្រងហានិភ័យ និងការសរសេរគោលការណ៍សន្តិសុខនៅទូទាំងស្ថាប័ន។'),
            startMonthYear: '2022-01', endMonthYear: '', period: 'Jan 2022 - Present', current: true, order: 1
        },
        {
            id: 'sample-exp-2',
            company: L('FinTech Solutions Ltd', 'ក្រុមហ៊ុន FinTech Solutions'),
            role: L('IT Auditor', 'សវនករ IT'),
            description: L('Performed IT general controls audits and compliance mapping for financial systems.', 'អនុវត្តសវនកម្មត្រួតពិនិត្យទូទៅផ្នែកព័ត៌មានវិទ្យា និងការគូសផែនទីអនុលោមភាពសម្រាប់ប្រព័ន្ធហិរញ្ញវត្ថុ។'),
            startMonthYear: '2019-06', endMonthYear: '2021-12', period: 'Jun 2019 - Dec 2021', current: false, order: 2
        }
    ],
    skills: [
        { id: 'sample-skill-1', name: L('ISO/IEC 27001', 'ISO/IEC 27001'), category: 'Governance', level: 'expert', slug: 'iso-27001', featured: true, order: 1 },
        { id: 'sample-skill-2', name: L('Risk Management', 'ការគ្រប់គ្រងហានិភ័យ'), category: 'Governance', level: 'advanced', slug: 'risk-management', featured: false, order: 2 },
        { id: 'sample-skill-3', name: L('SIEM & Monitoring', 'SIEM និងការតាមដាន'), category: 'Security Operations', level: 'advanced', slug: 'siem', featured: false, order: 3 },
        { id: 'sample-skill-4', name: L('React', 'React'), category: 'Engineering', level: 'advanced', slug: 'react', featured: false, order: 4 }
    ],
    certificates: [
        {
            id: 'sample-cert-1', name: L('CISSP', 'CISSP'), organization: '(ISC)2', issueDate: '2023-05', expiryDate: '2026-05',
            credentialId: 'CISSP-123456', url: 'https://example.com/verify/cissp', slug: 'cissp', featured: true, order: 1
        },
        {
            id: 'sample-cert-2', name: L('ISO 27001 Lead Implementer', 'អ្នកអនុវត្តនាំមុខ ISO 27001'), organization: 'PECB', issueDate: '2022-09', expiryDate: '',
            credentialId: 'PECB-7788', url: 'https://example.com/verify/pecb', slug: 'iso-27001-lead-implementer', featured: false, order: 2
        }
    ],
    education: [
        {
            id: 'sample-edu-1',
            school: L('Royal University of Phnom Penh', 'សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ'),
            degree: L('Bachelor of Science', 'បរិញ្ញាបត្រវិទ្យាសាស្ត្រ'),
            fieldOfStudy: L('Computer Science', 'វិទ្យាសាស្ត្រកុំព្យូទ័រ'),
            description: L('Focus on software engineering, algorithms, and cybersecurity fundamentals.', 'ផ្តោតលើវិស្វកម្មផ្នែកទន់ ក្បួនដោះស្រាយ និងមូលដ្ឋានគ្រឹះនៃសន្តិសុខតាមអ៊ីនធឺណិត។'),
            startYear: '2015', endYear: '2019', isCurrent: false, visible: true, order: 1
        },
        {
            id: 'sample-edu-2',
            school: L('Institute of Technology of Cambodia', 'វិទ្យាស្ថានបច្ចេកវិទ្យាកម្ពុជា'),
            degree: L('Master of Information Technology', 'បរិញ្ញាបត្រជាន់ខ្ពស់បច្ចេកវិទ្យាព័ត៌មាន'),
            fieldOfStudy: L('Data Science and Security', 'វិទ្យាសាស្ត្រទិន្នន័យ និងសន្តិសុខ'),
            description: L('Advanced research in applied cryptography and network security.', 'ការស្រាវជ្រាវកម្រិតខ្ពស់ក្នុងការអនុវត្តកូដនីយកម្ម និងសន្តិសុខបណ្តាញ។'),
            startYear: '2020', endYear: '2022', isCurrent: false, visible: true, order: 2
        }
    ],
    awards: [
        {
            id: 'sample-award-1',
            title: L('Cybersecurity Excellence Award', 'ពានរង្វាន់សន្តិសុខបច្ចេកវិទ្យាល្អឯក'),
            organization: L('National Cybersecurity Agency', 'ទីភ្នាក់ងារសន្តិសុខបច្ចេកវិទ្យាជាតិ'),
            description: L('Recognized for outstanding contribution to the national zero-trust architecture initiative.', 'ទទួលបានការទទួលស្គាល់សម្រាប់ការចូលរួមចំណែកយ៉ាងធំធេងដល់គំនិតផ្តួចផ្តើមស្ថាបត្យកម្ម Zero Trust ថ្នាក់ជាតិ។'),
            issueDate: '2023-11', link: '', featured: true, visible: true, order: 1
        }
    ],
    publications: [
        {
            id: 'sample-pub-1',
            title: L('State of Cloud Security in Southeast Asia', 'ស្ថានភាពសន្តិសុខ Cloud នៅអាស៊ីអាគ្នេយ៍'),
            publisher: L('InfoSec Journal', 'ទស្សនាវដ្តី InfoSec'),
            description: L('A comprehensive analysis of cloud adoption trends and associated risk profiles.', 'ការវិភាគគ្រប់ជ្រុងជ្រោយនៃនិន្នាការនៃការប្រើប្រាស់ Cloud និងទម្រង់ហានិភ័យដែលពាក់ព័ន្ធ។'),
            publishDate: '2023-08', link: 'https://example.com/publication', featured: true, visible: true, order: 1
        }
    ],
    speaking: [
        {
            id: 'sample-speak-1',
            title: L('Implementing ISO 27001 in Agile Environments', 'ការអនុវត្ត ISO 27001 ក្នុងបរិស្ថាន Agile'),
            eventName: L('Agile Security Summit 2023', 'សន្និសីទ Agile Security 2023'),
            location: L('Phnom Penh, Cambodia', 'ភ្នំពេញ កម្ពុជា'),
            description: L('Keynote on blending rapid deployment cycles with strict compliance requirements.', 'បទបង្ហាញគន្លឹះស្តីពីការរួមបញ្ចូលគ្នានៃវដ្តនៃការដាក់ឱ្យប្រើប្រាស់រហ័ស ជាមួយនឹងតម្រូវការអនុលោមភាពតឹងរ៉ឹង។'),
            date: '2023-10-15', link: '', featured: true, visible: true, order: 1
        }
    ],
    content: [
        {
            id: 'home',
            greeting: L('Hello, I am', 'សួស្តី ខ្ញុំគឺ'),
            name: L('Phearum', 'ភារម្យ'),
            subtitle: L('Information Security Professional', 'អ្នកជំនាញសន្តិសុខព័ត៌មាន'),
            description: L('I secure systems, manage risks, and guide organizations to compliance. Specializing in ISO 27001 and Zero Trust architectures.', 'ខ្ញុំធានាសុវត្ថិភាពប្រព័ន្ធ គ្រប់គ្រងហានិភ័យ និងណែនាំស្ថាប័នឱ្យអនុលោមតាមច្បាប់។ ឯកទេសផ្នែក ISO 27001 និងស្ថាបត្យកម្ម Zero Trust។'),
            ctaText: L('View My Work', 'មើលស្នាដៃរបស់ខ្ញុំ'),
            ctaLink: '#projects',
            profileImageUrl: 'https://ui-avatars.com/api/?name=Kem+Phearum&background=0b1527&color=fff&size=350'
        },
        {
            id: 'about',
            bio: L('I am a cybersecurity professional with a passion for governance and enterprise risk management. Over the past decade, I have led multiple organizations through rigorous compliance audits and implemented robust security frameworks. My approach blends technical depth with strategic oversight, ensuring that security is an enabler rather than a roadblock.', 'ខ្ញុំជាអ្នកជំនាញសន្តិសុខតាមអ៊ីនធឺណិតដែលមានចំណង់ចំណូលចិត្តលើអភិបាលកិច្ច និងការគ្រប់គ្រងហានិភ័យសហគ្រាស។ ក្នុងរយៈពេលមួយទសវត្សរ៍កន្លងមកនេះ ខ្ញុំបានដឹកនាំស្ថាប័នជាច្រើនឆ្លងកាត់ការធ្វើសវនកម្មអនុលោមភាពយ៉ាងតឹងរ៉ឹង និងបានអនុវត្តក្របខ័ណ្ឌសន្តិសុខយ៉ាងរឹងមាំ។ អភិក្រមរបស់ខ្ញុំរួមបញ្ចូលនូវចំណេះដឹងបច្ចេកទេសជ្រៅជ្រះជាមួយនឹងការត្រួតពិនិត្យជាយុទ្ធសាស្ត្រ ដើម្បីធានាថាសន្តិសុខគឺជាកត្តាជំរុញ មិនមែនជាឧបសគ្គនោះទេ។'),
            skills: [
                L('ISO 27001', 'ISO 27001'),
                L('Risk Management', 'ការគ្រប់គ្រងហានិភ័យ'),
                L('Security Audits', 'សវនកម្មសន្តិសុខ'),
                L('Zero Trust', 'Zero Trust'),
                L('SIEM', 'SIEM'),
                L('Cloud Security', 'សន្តិសុខ Cloud')
            ]
        },
        {
            id: 'profileInfo',
            summary: L('A seasoned information security professional with a decade of experience focused on enterprise risk management, compliance, and securing critical infrastructure. Proven track record of guiding organizations to ISO 27001 certification and implementing Zero Trust architectures.', 'អ្នកជំនាញផ្នែកសន្តិសុខព័ត៌មានដែលមានបទពិសោធន៍ជាងមួយទសវត្សរ៍ ផ្តោតលើការគ្រប់គ្រងហានិភ័យសហគ្រាស ការអនុលោមតាមច្បាប់ និងការធានាសុវត្ថិភាពហេដ្ឋារចនាសម្ព័ន្ធសំខាន់ៗ។ មានប្រវត្តិជោគជ័យក្នុងការណែនាំស្ថាប័នឱ្យទទួលបានវិញ្ញាបនបត្រ ISO 27001 និងការអនុវត្តស្ថាបត្យកម្ម Zero Trust។'),
            currentRole: L('ISMS Manager & Lead Auditor', 'អ្នកគ្រប់គ្រង ISMS និងសវនករនាំមុខ'),
            location: L('Phnom Penh, Cambodia (Remote-friendly)', 'ភ្នំពេញ កម្ពុជា (អាចធ្វើការពីចម្ងាយបាន)'),
            clearance: L('Security Cleared', 'បានពិនិត្យប្រវត្តិរូបសន្តិសុខ'),
            resumeHeadline: L('Securing systems, guiding compliance, and mitigating enterprise risk.', 'ការធានាសុវត្ថិភាពប្រព័ន្ធ ការណែនាំការអនុលោមតាមច្បាប់ និងការកាត់បន្ថយហានិភ័យសហគ្រាស។'),
            yearsExperienceOverride: '',
            workTypes: [L('Full-time', 'ពេញម៉ោង'), L('Contract', 'កិច្ចសន្យា'), L('Remote', 'ពីចម្ងាយ')],
            languages: [L('English (Fluent)', 'អង់គ្លេស (ស្ទាត់ជំនាញ)'), L('Khmer (Native)', 'ខ្មែរ (ភាសាកំណើត)')],
            industries: [L('Banking & Finance', 'ធនាគារ និងហិរញ្ញវត្ថុ'), L('Government', 'រដ្ឋាភិបាល'), L('Fintech', 'Fintech')],
            accomplishments: [
                L('Led ISO 27001 certification across 3 regional offices in 9 months', 'បានដឹកនាំការទទួលបានវិញ្ញាបនបត្រ ISO 27001 នៅទូទាំងការិយាល័យប្រចាំតំបន់ចំនួន ៣ ក្នុងរយៈពេល ៩ ខែ'),
                L('Closed 18 major audit findings and matured security posture by 40%', 'បានបិទចំណុចរកឃើញសំខាន់ៗចំនួន 18 ពីសវនកម្ម និងធ្វើឱ្យស្ថានភាពសន្តិសុខប្រសើរឡើង 40%'),
                L('Architected zero-trust rollout for 5,000+ endpoints', 'បានរៀបចំស្ថាបត្យកម្ម Zero Trust សម្រាប់ឧបករណ៍ជាង 5,000')
            ],
            oss: [
                L('Maintainer of open-source security audit toolkit', 'អ្នកថែរក្សាឧបករណ៍សវនកម្មសន្តិសុខកូដបើកចំហ'),
                L('Contributor to OWASP top 10 guides', 'អ្នកចូលរួមចំណែកដល់ការណែនាំកំពូលទាំង 10 របស់ OWASP')
            ],
            community: [
                L('Mentor at local cybersecurity bootcamps', 'អ្នកណែនាំនៅជំរុំបណ្តុះបណ្តាលសន្តិសុខតាមអ៊ីនធឺណិតក្នុងស្រុក'),
                L('Speaker at regional InfoSec conferences', 'វាគ្មិននៅសន្និសីទ InfoSec ថ្នាក់តំបន់')
            ]
        },
        {
            id: 'contact',
            email: 'hello@example.com',
            secondaryEmail: 'security@example.com',
            phone: '+855 12 345 678',
            telegramUsername: 'phearum_sec',
            telegramUrl: 'https://t.me/phearum_sec',
            telegramEnabled: true,
            telegramQrCodeImage: '',
            whatsapp: '+855 12 345 678',
            linkedin: 'https://linkedin.com/in/phearum',
            github: 'https://github.com/kemphearum',
            twitter: 'https://x.com/phearum_sec',
            website: 'https://kemphearum.github.io',
            availabilityStatus: 'open',
            availabilityMessage: L('I am open to discussing new opportunities.', 'ខ្ញុំបើកចំហរសម្រាប់ការពិភាក្សាអំពីឱកាសការងារថ្មីៗ។'),
            preferredContact: ['Email', 'Telegram'],
            responseTime: L('Within 24 hours', 'ក្នុងរយៈពេល 24 ម៉ោង'),
            officeHours: L('9 AM - 6 PM (ICT)', 'ម៉ោង 9 ព្រឹក - 6 ល្ងាច (ម៉ោងនៅកម្ពុជា)'),
            timeZone: 'Asia/Phnom_Penh (GMT+7)',
            introText: L('Feel free to reach out for consultations, speaking engagements, or full-time roles.', 'សូមស្វាគមន៍ក្នុងការទាក់ទងសម្រាប់ការប្រឹក្សាយោបល់ ការចូលរួមធ្វើបទបង្ហាញ ឬការងារពេញម៉ោង។')
        },
        {
            id: 'resume',
            pdfBase64: '',
            version: 'v2026.1',
            title: L('Information Security Resume', 'ប្រវត្តិរូបសង្ខេបផ្នែកសន្តិសុខព័ត៌មាន'),
            description: L('Comprehensive overview of my experience in ISMS implementation and IT auditing.', 'ទិដ្ឋភាពទូទៅនៃបទពិសោធន៍របស់ខ្ញុំក្នុងការអនុវត្ត ISMS និងសវនកម្ម IT។'),
            publicDownloadEnabled: true,
            printRouteEnabled: true
        }
    ]
};

const publishFields = { status: 'published', visible: true, publishedAt: new Date().toISOString() };

const run = async () => {
    let total = 0;
    for (const [collection, docs] of Object.entries(DATA)) {
        for (const { id, ...data } of docs) {
            const isContent = collection === 'projects' || collection === 'posts';
            const isSystem = collection === 'settings' || collection === 'rolePermissions' || collection === 'users';
            
            const payload = isSystem ? {
                ...data,
                createdAt: now,
                updatedAt: now
            } : {
                ...data,
                visible: data.visible ?? true,
                featured: data.featured ?? false,
                ...(isContent ? publishFields : {}),
                createdAt: now,
                updatedAt: now
            };
            
            await db.collection(collection).doc(id).set(payload, { merge: true });
            total += 1;
        }
        console.log(`Seeded ${docs.length} ${collection}`);
    }
    console.log(`\nDone. ${total} sample documents written. Open the public site to verify.`);
    process.exit(0);
};

run().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
