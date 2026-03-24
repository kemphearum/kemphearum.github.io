const { admin, initDb, seedById, truncateMissing } = require('./seed-utils.cjs');

const db = initDb();

const projects = [
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
];

async function seedProjects() {
    console.log('Starting projects seeding process...');

    const idsToKeep = projects.map((p) => p.slug);
    const deletedCount = await truncateMissing(db, 'projects', idsToKeep);
    if (deletedCount > 0) {
        console.log(`Pruned ${deletedCount} orphaned projects.`);
    }

    await seedById(db, 'projects', projects, {
        merge: false,
        idSelector: (project) => project.slug,
        onItem: (project) => console.log(`Successfully seeded project: ${project.title.en}`)
    });
    console.log('Projects seeding process completed.');
}
seedProjects()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Projects seeding failed:', error.message || error);
        process.exit(1);
    });
