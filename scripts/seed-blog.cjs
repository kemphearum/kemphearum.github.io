const admin = require('firebase-admin');
const serviceAccount = require('../sa-source.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const posts = [
    {
        title: { en: "Mastering React Hooks", km: "ស្ទាត់ជំនាញលើ React Hooks" },
        slug: "mastering-react-hooks",
        excerpt: { en: "A deep dive into useEffect, useMemo, and useCallback.", km: "ការសិក្សាស៊ីជម្រៅអំពី useEffect, useMemo និង useCallback" },
        content: { en: "# Hooks Overview\nReact hooks allow you to use state and other features without a class.", km: "# ទិដ្ឋភាពទូទៅនៃ Hooks\nReact hooks អនុញ្ញាតឱ្យអ្នកប្រើប្រាស់ state និងមុខងារផ្សេងទៀតដោយមិនចាំបាច់ប្រើ class។" },
        tags: ["React", "JavaScript"], featured: true, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        title: { en: "Introduction to TypeScript", km: "ការណែនាំអំពី TypeScript" },
        slug: "intro-to-typescript",
        excerpt: { en: "Why you should use TypeScript for your next project.", km: "ហេតុអ្វីអ្នកគួរប្រើ TypeScript សម្រាប់គម្រោងបន្ទាប់របស់អ្នក" },
        content: { en: "# Types Matter\nAdding types to your code prevents many runtime errors.", km: "# សារៈសំខាន់នៃប្រភេទ\nការបន្ថែមប្រភេទទៅក្នុងកូដរបស់អ្នកជួយការពារកំហុសជាច្រើននៅពេលដំណើរការ។" },
        tags: ["TypeScript", "WebDev"], featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        title: { en: "UI/UX Design Principles", km: "គោលការណ៍រចនា UI/UX" },
        slug: "ui-ux-design-principles",
        excerpt: { en: "Fundamental principles for creating user-friendly interfaces.", km: "គោលការណ៍គ្រឹះសម្រាប់បង្កើតចំណុចប្រទាក់អ្នកប្រើដែលងាយស្រួលប្រើ" },
        content: { en: "# Design First\nUnderstand your users before you start drawing.", km: "# ការរចនាជាមុន\nយល់ពីអ្នកប្រើប្រាស់របស់អ្នកមុនពេលអ្នកចាប់ផ្តើមគូរ។" },
        tags: ["Design", "UIUX"], featured: true, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        title: { en: "Serverless with Firebase Functions", km: "Serverless ជាមួយ Firebase Functions" },
        slug: "serverless-firebase-functions",
        excerpt: { en: "How to build scalable backends without managing servers.", km: "របៀបបង្កើត backend ដែលអាចពង្រីកបានដោយមិនចាំបាច់គ្រប់គ្រង server" },
        content: { en: "# Cloud Functions\nRunning backend code in response to events triggered by Firebase features.", km: "# Cloud Functions\nដំណើរការកូដ backend ជាការឆ្លើយតបទៅនឹងព្រឹត្តិការណ៍នានាពី Firebase។" },
        tags: ["Firebase", "Serverless"], featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        title: { en: "The Power of CSS Grid", km: "អំណាចនៃ CSS Grid" },
        slug: "power-of-css-grid",
        excerpt: { en: "Building complex layouts easily with CSS Grid.", km: "បង្កើតប្លង់ស្មុគស្មាញយ៉ាងងាយស្រួលជាមួយ CSS Grid" },
        content: { en: "# Grid Layout\nThe most powerful layout system available in CSS.", km: "# ប្លង់ Grid\nប្រព័ន្ធប្លង់ដ៏មានឥទ្ធិពលបំផុតដែលមាននៅក្នុង CSS។" },
        tags: ["CSS", "Frontend"], featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        title: { en: "Testing with Vitest", km: "ការសាកល្បងជាមួយ Vitest" },
        slug: "testing-with-vitest",
        excerpt: { en: "Modern unit testing for fast development cycles.", km: "ការសាកល្បងឯកតាទំនើបសម្រាប់វដ្តនៃការអភិវឌ្ឍន៍លឿន" },
        content: { en: "# Fast Tests\nBlazing fast unit test framework powered by Vite.", km: "# ការតេស្តលឿន\nក្របខ័ណ្ឌសាកល្បងឯកតាដ៏លឿនបំផុតដែលគាំទ្រដោយ Vite។" },
        tags: ["Testing", "Vite"], featured: true, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        title: { en: "Database Schema Design", km: "ការរចនា Schema មូលដ្ឋានទិន្នន័យ" },
        slug: "database-schema-design",
        excerpt: { en: "Best practices for designing NoSQL and SQL databases.", km: "វិធីសាស្ត្រល្អៗសម្រាប់រចនាមូលដ្ឋានទិន្នន័យ NoSQL និង SQL" },
        content: { en: "# Data Structure\nPlanning your data layout for performance and scalability.", km: "# រចនាសម្ព័ន្ធទិន្នន័យ\nរៀបចំប្លង់ទិន្នន័យរបស់អ្នកសម្រាប់ប្រសិទ្ធភាព និងពង្រីកបាន។" },
        tags: ["Database", "SQL", "NoSQL"], featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        title: { en: "Responsive Design in 2026", km: "ការរចនាដែលឆ្លើយតបគ្រប់ឧបករណ៍ក្នុងឆ្នាំ២០២៦" },
        slug: "responsive-design-2026",
        excerpt: { en: "Adapting to the latest devices and screen sizes.", km: "ការសម្របខ្លួនទៅនឹងឧបករណ៍ និងទំហំអេក្រង់ចុងក្រោយបំផុត" },
        content: { en: "# Multi-Device\nUsers are everywhere, from watches to foldable screens.", km: "# ឧបករណ៍ច្រើន\nអ្នកប្រើប្រាស់មាននៅគ្រប់ទីកន្លែង ចាប់ពីនាឡិការហូតដល់អេក្រង់បត់។" },
        tags: ["WebDesign", "Mobile"], featured: true, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        title: { en: "Git Flow for Teams", km: "លំហូរការងារ Git សម្រាប់ក្រុម" },
        slug: "git-flow-for-teams",
        excerpt: { en: "Using Git effectively for collaborative development.", km: "ប្រើប្រាស់ Git ប្រកបដោយប្រសិទ្ធភាពសម្រាប់ការអភិវឌ្ឍនជាក្រុម" },
        content: { en: "# Collaboration\nBranching strategies that help avoid merge conflicts.", km: "# កិច្ចសហការ\nយុទ្ធសាស្ត្រប្រើប្រាស់មែកធាងកូដដែលជួយចៀសវាងបញ្ហាពេលបញ្ចូលកូដ។" },
        tags: ["Git", "Collaboration"], featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        title: { en: "Optimizing Web Performance", km: "ការបង្កើនប្រសិទ្ធភាពវិបសាយ" },
        slug: "optimizing-web-performance",
        excerpt: { en: "How to reach 100 on Lighthouse score.", km: "របៀបសម្រេចឱ្យបានពិន្ទុ ១០០ នៅលើ Lighthouse" },
        content: { en: "# Speed Optimization\nMinimizing bundle size and optimizing images.", km: "# បង្កើនល្បឿន\nកាត់បន្ថយទំហំកូដ និងបង្កើនប្រសិទ្ធភាពរូបភាព។" },
        tags: ["Performance", "WebDev"], featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
];

async function seedBlog() {
    console.log('Starting blog posts seeding process...');

    for (const post of posts) {
        try {
            await db.collection('posts').doc(post.slug).set(post);
            console.log(`Successfully seeded post: ${post.title.en}`);
        } catch (error) {
            console.error(`Failed to seed post: ${post.title.en}`, error);
        }
    }

    console.log('Blog posts seeding process completed.');
    process.exit(0);
}

seedBlog();
