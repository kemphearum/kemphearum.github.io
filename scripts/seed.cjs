const admin = require('firebase-admin');
const serviceAccount = require('../sa-source.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const SAMPLE_DATA = {
    projects: [
        {
            title: { en: "Modern Real Estate Platform", km: "កម្មវិធីអចលនទ្រព្យទំនើប" },
            description: { en: "A comprehensive real estate listing platform with advanced search and interactive maps.", km: "កម្មវិធីស្វែងរកអចលនទ្រព្យដែលអនុញ្ញាតឱ្យអ្នកប្រើប្រាស់ស្វែងរក និងមើលទីតាំងយ៉ាងងាយស្រួលនៅលើផែនទី" },
            techStack: ["React", "Firebase", "Leaflet", "SCSS"],
            githubUrl: "https://github.com/example/real-estate",
            liveUrl: "https://example-realestate.web.app",
            slug: "modern-real-estate-platform",
            content: { en: "# About the Project\nThis project focuses on providing a seamless experience for home buyers and sellers.", km: "# អំពីគម្រោង\nគម្រោងនេះផ្តោតលើការផ្តល់ជូននូវបទពិសោធន៍ដ៏ល្អបំផុតសម្រាប់អ្នកទិញ និងអ្នកលក់ផ្ទះ។" },
            featured: true, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "AI-Powered Task Manager", km: "កម្មវិធីគ្រប់គ្រងភារកិច្ចដោយជំនួយពី AI" },
            description: { en: "Smart task management tool that prioritizes your work using machine learning algorithms.", km: "ឧបករណ៍គ្រប់គ្រងការងារវៃឆ្លាតដែលជួយរៀបចំអាទិភាពការងាររបស់អ្នកដោយប្រើប្រាស់បច្ចេកវិទ្យា AI" },
            techStack: ["Next.js", "OpenAI API", "Tailwind", "PostgreSQL"],
            githubUrl: "https://github.com/example/ai-task",
            liveUrl: "https://ai-task-manager.vercel.app",
            slug: "ai-powered-task-manager",
            content: { en: "# Smart Productivity\nLeveraging AI to help you stay focused on what matters most.", km: "# ផលិតភាពវៃឆ្លាត\nប្រើប្រាស់ AI ដើម្បីជួយអ្នកឱ្យផ្តោតលើអ្វីដែលសំខាន់បំផុត។" },
            featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "E-Learning Management System", km: "ប្រព័ន្ធគ្រប់គ្រងការសិក្សាតាមអនឡាញ" },
            description: { en: "A robust LMS for schools and internal corporate training.", km: "ប្រព័ន្ធគ្រប់គ្រងការសិក្សាដ៏រឹងមាំសម្រាប់សាលារៀន និងការបណ្តុះបណ្តាលក្នុងស្ថាប័ន" },
            techStack: ["Vue.js", "Node.js", "Express", "MongoDB"],
            githubUrl: "https://github.com/example/lms",
            liveUrl: "https://example-lms.com",
            slug: "e-learning-management-system",
            content: { en: "# LMS Dashboard\nFull control over courses, students, and certificates.", km: "# ផ្ទាំងគ្រប់គ្រង LMS\nគ្រប់គ្រងវគ្គសិក្សា សិស្ស និងវិញ្ញាបនបត្រយ៉ាងពេញលេញ។" },
            featured: true, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "Cryptocurrency Tracker", km: "កម្មវិធីតាមដានរូបិយប័ណ្ណគ្រីបតូ" },
            description: { en: "Real-time crypto price tracking and portfolio management.", km: "តាមដានតម្លៃគ្រីបតូតាមពេលវេលាជាក់ស្តែង និងគ្រប់គ្រងផលប័ត្រ" },
            techStack: ["React Native", "Firebase", "CoinGecko API"],
            githubUrl: "https://github.com/example/crypto",
            liveUrl: "https://crypto-tracker.app",
            slug: "cryptocurrency-tracker",
            content: { en: "# Crypto Insights\nStay updated with the latest market trends.", km: "# ការយល់ដឹងអំពីគ្រីបតូ\nទទួលបានបច្ចុប្បន្នភាពជាមួយនិន្នាការទីផ្សារចុងក្រោយបង្អស់។" },
            featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "Portfolio Website v2", km: "គេហទំព័រផលប័ត្រជំនាន់ទី២" },
            description: { en: "The second iteration of my professional portfolio with modern design.", km: "ការរចនាគេហទំព័រផលប័ត្រអាជីពរបស់ខ្ញុំជាមួយរចនាប័ទ្មទំនើប" },
            techStack: ["React", "Vite", "Framer Motion"],
            githubUrl: "https://github.com/example/portfolio-v2",
            liveUrl: "https://portfolio-v2.me",
            slug: "portfolio-website-v2",
            content: { en: "# Personal Brand\nShowcasing my journey and technical expertise.", km: "# ម៉ាកយីហោផ្ទាល់ខ្លួន\nបង្ហាញពីដំណើរ និងជំនាញបច្ចេកទេសរបស់ខ្ញុំ។" },
            featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "Social Media Scheduler", km: "កម្មវិធីកំណត់កាលវិភាគបណ្តាញសង្គម" },
            description: { en: "Automate your social media posts across multiple platforms.", km: "ស្វ័យប្រវត្តិកម្មនៃការបង្ហោះលើបណ្តាញសង្គមតាមរយៈបណ្តាញផ្សេងៗគ្នា" },
            techStack: ["Python", "Flask", "Redis", "Celery"],
            githubUrl: "https://github.com/example/social-sched",
            liveUrl: "https://social-sched.io",
            slug: "social-media-scheduler",
            content: { en: "# Automation Tools\nSave time by scheduling your content in advance.", km: "# ឧបករណ៍ស្វ័យប្រវត្តិកម្ម\nសន្សំសំចៃពេលវេលាដោយកំណត់កាលវិភាគមាតិការបស់អ្នកទុកជាមុន។" },
            featured: true, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "Fitness Tracking Mobile App", km: "កម្មវិធីតាមដានសុខភាពលើទូរស័ព្ទ" },
            description: { en: "Track workouts, meals, and hydration for a healthier lifestyle.", km: "តាមដានការហាត់ប្រាណ ការទទួលទានអាហារ និងជាតិទឹកដើម្បីសុខភាពល្អ" },
            techStack: ["Flutter", "Dart", "Firebase"],
            githubUrl: "https://github.com/example/fitness",
            liveUrl: "https://fit-tracker.app",
            slug: "fitness-tracking-mobile-app",
            content: { en: "# Health Journey\nYour companion for reaching your fitness goals.", km: "# ដំណើរឆ្ពោះទៅរកសុខភាព\nដៃគូរបស់អ្នកសម្រេចគោលដៅសុខភាព។" },
            featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "Inventory Management System", km: "ប្រព័ន្ធគ្រប់គ្រងសារពើភ័ណ្ឌ" },
            description: { en: "Manage stock levels and sales for small to medium businesses.", km: "គ្រប់គ្រងកម្រិតស្តុក និងការលក់សម្រាប់អាជីវកម្មខ្នាតតូច និងមធ្យម" },
            techStack: ["Angular", "C#", ".NET Core", "SQL Server"],
            githubUrl: "https://github.com/example/inventory",
            liveUrl: "https://inventory-pro.com",
            slug: "inventory-management-system",
            content: { en: "# Business Logic\nEfficient inventory tracking to minimize loss.", km: "# តក្កវិទ្យាអាជីវកម្ម\nការតាមដានសារពើភ័ណ្ឌប្រកបដោយប្រសិទ្ធភាពដើម្បីកាត់បន្ថយការខាតបង់។" },
            featured: true, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "Chat Application with WebSockets", km: "កម្មវិធីជជែកកំសាន្តជាមួយ WebSockets" },
            description: { en: "Real-time messaging platform with end-to-end encryption.", km: "វេទិកាផ្ញើសារតាមពេលវេលាជាក់ស្តែងជាមួយការសម្ងាត់ខ្ពស់" },
            techStack: ["Node.js", "Socket.io", "React", "Redis"],
            githubUrl: "https://github.com/example/chat",
            liveUrl: "https://chat-room.app",
            slug: "chat-application-with-websockets",
            content: { en: "# Real-time Comm\nConnect with friends and colleagues instantly.", km: "# ការទំនាក់ទំនងភ្លាមៗ\nភ្ជាប់ទំនាក់ទំនងជាមួយមិត្តភក្តិ និងសហការីភ្លាមៗ។" },
            featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "Music Streaming Dashboard", km: "ផ្ទាំងគ្រប់គ្រងការចាក់តន្ត្រី" },
            description: { en: "A custom UI for music streaming services with personalized themes.", km: "ចំណុចប្រទាក់អ្នកប្រើសម្រាប់សេវាកម្មចាក់តន្ត្រីជាមួយស្បែកផ្ទាល់ខ្លួន" },
            techStack: ["TypeScript", "Next.js", "Spotify API"],
            githubUrl: "https://github.com/example/music-ui",
            liveUrl: "https://music-stream.vercel.app",
            slug: "music-streaming-dashboard",
            content: { en: "# Experience Sound\nA premium look for your daily soundtrack.", km: "# បទពិសោធន៍សំឡេង\nរូបរាងដ៏ប្រណីតសម្រាប់តន្ត្រីប្រចាំថ្ងៃរបស់អ្នក។" },
            featured: false, visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
    ],
    posts: [
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
    ],
    experience: [
        {
            title: { en: "Senior Full Stack Developer", km: "អ្នកអភិវឌ្ឍន៍ Full Stack កម្រិតជាន់ខ្ពស់" },
            company: { en: "Tech Innovators Co., Ltd", km: "ក្រុមហ៊ុន Tech Innovators Co., Ltd" },
            description: { en: "Leading multiple projects and mentoring junior developers.", km: "ដឹកនាំគម្រោងជាច្រើន និងផ្តល់ប្រឹក្សាដល់អ្នកអភិវឌ្ឍន៍ជំនាន់ក្រោយ" },
            startDate: "2023-01-01", visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "Web Developer", km: "អ្នកអភិវឌ្ឍន៍វិបសាយ" },
            company: { en: "Digital Solutions Agency", km: "ទីភ្នាក់ងារដំណោះស្រាយឌីជីថល" },
            description: { en: "Building high-performance e-commerce websites.", km: "បង្កើតគេហទំព័រលក់ទំនិញដែលមានប្រសិទ្ធភាពខ្ពស់" },
            startDate: "2021-06-01", endDate: "2022-12-31", visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "Junior Frontend Developer", km: "អ្នកអភិវឌ្ឍន៍ Frontend កម្រិតបឋម" },
            company: { en: "Startup Hub", km: "ស្ថាប័ន Startup Hub" },
            description: { en: "Working with React and modern SCSS.", km: "ធ្វើការជាមួយ React និង SCSS ទំនើប" },
            startDate: "2020-01-01", endDate: "2021-05-30", visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "Freelance Software Engineer", km: "វិស្វករកម្មវិធីសេរី" },
            company: { en: "Self-Employed", km: "ធ្វើការផ្ទាល់ខ្លួន" },
            description: { en: "Delivering custom software solutions for clients.", km: "ផ្តល់ជូននូវដំណោះស្រាយកម្មវិធីផ្ទាល់ខ្លួនសម្រាប់អតិថិជន" },
            startDate: "2019-01-01", endDate: "2019-12-31", visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            title: { en: "IT Intern", km: "កម្មសិក្សាការីផ្នែកព័ត៌មានវិទ្យា" },
            company: { en: "Large Enterprise", km: "សហគ្រាសខ្នាតធំ" },
            description: { en: "Assisting with hardware and software troubleshooting.", km: "ជួយការងារដោះស្រាយបញ្ហាផ្នែករឹង និងផ្នែកទន់" },
            startDate: "2018-06-01", endDate: "2018-08-31", visible: true, createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
    ]
};

async function seed() {
    console.log('Starting expanded seeding process...');

    // Seed Projects
    for (const project of SAMPLE_DATA.projects) {
        try {
            await db.collection('projects').doc(project.slug).set(project);
            console.log(`Successfully seeded project: ${project.title.en}`);
        } catch (error) {
            console.error(`Failed to seed project: ${project.title.en}`, error);
        }
    }

    // Seed Posts
    for (const post of SAMPLE_DATA.posts) {
        try {
            await db.collection('posts').doc(post.slug).set(post);
            console.log(`Successfully seeded post: ${post.title.en}`);
        } catch (error) {
            console.error(`Failed to seed post: ${post.title.en}`, error);
        }
    }

    // Seed Experience
    // For experience, we don't have a slug, so we'll use a unique ID derived from company and title
    for (const exp of SAMPLE_DATA.experience) {
        try {
            const expId = `${exp.company.en.replace(/\s+/g, '-').toLowerCase()}-${exp.title.en.replace(/\s+/g, '-').toLowerCase()}`;
            await db.collection('experience').doc(expId).set(exp);
            console.log(`Successfully seeded experience: ${exp.company.en} - ${exp.title.en}`);
        } catch (error) {
            console.error(`Failed to seed experience: ${exp.title.en}`, error);
        }
    }

    console.log('Expanded seeding process completed.');
    process.exit(0);
}

seed();
