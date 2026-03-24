import ProjectService from '../services/ProjectService';
import BlogService from '../services/BlogService';
import ExperienceService from '../services/ExperienceService';

/**
 * High-quality bilingual sample data for Projects, Blog posts, and Experience.
 */
export const SAMPLE_DATA = {
    projects: [
        {
            titleEn: "Modern Real Estate Platform",
            titleKm: "កម្មវិធីអចលនទ្រព្យទំនើប",
            descriptionEn: "A comprehensive real estate listing platform with advanced search and interactive maps.",
            descriptionKm: "កម្មវិធីស្វែងរកអចលនទ្រព្យដែលអនុញ្ញាតឱ្យអ្នកប្រើប្រាស់ស្វែងរក និងមើលទីតាំងយ៉ាងងាយស្រួលនៅលើផែនទី",
            techStack: "React, Firebase, Leaflet, SCSS",
            githubUrl: "https://github.com/example/real-estate",
            liveUrl: "https://example-realestate.web.app",
            slug: "modern-real-estate-platform",
            contentEn: "# About the Project\nThis project focuses on providing a seamless experience for home buyers and sellers.",
            contentKm: "# អំពីគម្រោង\nគម្រោងនេះផ្តោតលើការផ្តល់ជូននូវបទពិសោធន៍ដ៏ល្អបំផុតសម្រាប់អ្នកទិញ និងអ្នកលក់ផ្ទះ។",
            featured: true, visible: true
        },
        {
            titleEn: "AI-Powered Task Manager",
            titleKm: "កម្មវិធីគ្រប់គ្រងភារកិច្ចដោយជំនួយពី AI",
            descriptionEn: "Smart task management tool that prioritizes your work using machine learning algorithms.",
            descriptionKm: "ឧបករណ៍គ្រប់គ្រងការងារវៃឆ្លាតដែលជួយរៀបចំអាទិភាពការងាររបស់អ្នកដោយប្រើប្រាស់បច្ចេកវិទ្យា AI",
            techStack: "Next.js, OpenAI API, Tailwind, PostgreSQL",
            githubUrl: "https://github.com/example/ai-task",
            liveUrl: "https://ai-task-manager.vercel.app",
            slug: "ai-powered-task-manager",
            contentEn: "# Smart Productivity\nLeveraging AI to help you stay focused on what matters most.",
            contentKm: "# ផលិតភាពវៃឆ្លាត\nប្រើប្រាស់ AI ដើម្បីជួយអ្នកឱ្យផ្តោតលើអ្វីដែលសំខាន់បំផុត។",
            featured: false, visible: true
        },
        {
            titleEn: "E-Learning Management System",
            titleKm: "ប្រព័ន្ធគ្រប់គ្រងការសិក្សាតាមអនឡាញ",
            descriptionEn: "A robust LMS for schools and internal corporate training.",
            descriptionKm: "ប្រព័ន្ធគ្រប់គ្រងការសិក្សាដ៏រឹងមាំសម្រាប់សាលារៀន និងការបណ្តុះបណ្តាលក្នុងស្ថាប័ន",
            techStack: "Vue.js, Node.js, Express, MongoDB",
            githubUrl: "https://github.com/example/lms",
            liveUrl: "https://example-lms.com",
            slug: "e-learning-management-system",
            contentEn: "# LMS Dashboard\nFull control over courses, students, and certificates.",
            contentKm: "# ផ្ទាំងគ្រប់គ្រង LMS\nគ្រប់គ្រងវគ្គសិក្សា សិស្ស និងវិញ្ញាបនបត្រយ៉ាងពេញលេញ។",
            featured: true, visible: true
        },
        {
            titleEn: "Cryptocurrency Tracker",
            titleKm: "កម្មវិធីតាមដានរូបិយប័ណ្ណគ្រីបតូ",
            descriptionEn: "Real-time crypto price tracking and portfolio management.",
            descriptionKm: "តាមដានតម្លៃគ្រីបតូតាមពេលវេលាជាក់ស្តែង និងគ្រប់គ្រងផលប័ត្រ",
            techStack: "React Native, Firebase, CoinGecko API",
            githubUrl: "https://github.com/example/crypto",
            liveUrl: "https://crypto-tracker.app",
            slug: "cryptocurrency-tracker",
            contentEn: "# Crypto Insights\nStay updated with the latest market trends.",
            contentKm: "# ការយល់ដឹងអំពីគ្រីបតូ\nទទួលបានបច្ចុប្បន្នភាពជាមួយនិន្នាការទីផ្សារចុងក្រោយបង្អស់។",
            featured: false, visible: true
        },
        {
            titleEn: "Portfolio Website v2",
            titleKm: "គេហទំព័រផលប័ត្រជំនាន់ទី២",
            descriptionEn: "The second iteration of my professional portfolio with modern design.",
            descriptionKm: "ការរចនាគេហទំព័រផលប័ត្រអាជីពរបស់ខ្ញុំជាមួយរចនាប័ទ្មទំនើប",
            techStack: "React, Vite, Framer Motion",
            githubUrl: "https://github.com/example/portfolio-v2",
            liveUrl: "https://portfolio-v2.me",
            slug: "portfolio-website-v2",
            contentEn: "# Personal Brand\nShowcasing my journey and technical expertise.",
            contentKm: "# ម៉ាកយីហោផ្ទាល់ខ្លួន\nបង្ហាញពីដំណើរ និងជំនាញបច្ចេកទេសរបស់ខ្ញុំ។",
            featured: false, visible: true
        },
        {
            titleEn: "Social Media Scheduler",
            titleKm: "កម្មវិធីកំណត់កាលវិភាគបណ្តាញសង្គម",
            descriptionEn: "Automate your social media posts across multiple platforms.",
            descriptionKm: "ស្វ័យប្រវត្តិកម្មនៃការបង្ហោះលើបណ្តាញសង្គមតាមរយៈបណ្តាញផ្សេងៗគ្នា",
            techStack: "Python, Flask, Redis, Celery",
            githubUrl: "https://github.com/example/social-sched",
            liveUrl: "https://social-sched.io",
            slug: "social-media-scheduler",
            contentEn: "# Automation Tools\nSave time by scheduling your content in advance.",
            contentKm: "# ឧបករណ៍ស្វ័យប្រវត្តិកម្ម\nសន្សំសំចៃពេលវេលាដោយកំណត់កាលវិភាគមាតិការបស់អ្នកទុកជាមុន។",
            featured: true, visible: true
        },
        {
            titleEn: "Fitness Tracking Mobile App",
            titleKm: "កម្មវិធីតាមដានសុខភាពលើទូរស័ព្ទ",
            descriptionEn: "Track workouts, meals, and hydration for a healthier lifestyle.",
            descriptionKm: "តាមដានការហាត់ប្រាណ ការទទួលទានអាហារ និងជាតិទឹកដើម្បីសុខភាពល្អ",
            techStack: "Flutter, Dart, Firebase",
            githubUrl: "https://github.com/example/fitness",
            liveUrl: "https://fit-tracker.app",
            slug: "fitness-tracking-mobile-app",
            contentEn: "# Health Journey\nYour companion for reaching your fitness goals.",
            contentKm: "# ដំណើរឆ្ពោះទៅរកសុខភាព\nដៃគូរបស់អ្នកសម្រេចគោលដៅសុខភាព។",
            featured: false, visible: true
        },
        {
            titleEn: "Inventory Management System",
            titleKm: "ប្រព័ន្ធគ្រប់គ្រងសារពើភ័ណ្ឌ",
            descriptionEn: "Manage stock levels and sales for small to medium businesses.",
            descriptionKm: "គ្រប់គ្រងកម្រិតស្តុក និងការលក់សម្រាប់អាជីវកម្មខ្នាតតូច និងមធ្យម",
            techStack: "Angular, C#, .NET Core, SQL Server",
            githubUrl: "https://github.com/example/inventory",
            liveUrl: "https://inventory-pro.com",
            slug: "inventory-management-system",
            contentEn: "# Business Logic\nEfficient inventory tracking to minimize loss.",
            contentKm: "# តক្កវិទ្យាអាជីវកម្ម\nការតាមដានសារពើភ័ណ្ឌប្រកបដោយប្រសិទ្ធភាពដើម្បីកាត់បន្ថយការខាតបង់។",
            featured: true, visible: true
        },
        {
            titleEn: "Chat Application with WebSockets",
            titleKm: "កម្មវិធីជជែកកំសាន្តជាមួយ WebSockets",
            descriptionEn: "Real-time messaging platform with end-to-end encryption.",
            descriptionKm: "វេទិកាផ្ញើសារតាមពេលវេលាជាក់ស្តែងជាមួយការសម្ងាត់ខ្ពស់",
            techStack: "Node.js, Socket.io, React, Redis",
            githubUrl: "https://github.com/example/chat",
            liveUrl: "https://chat-room.app",
            slug: "chat-application-with-websockets",
            contentEn: "# Real-time Comm\nConnect with friends and colleagues instantly.",
            contentKm: "# ការទំនាក់ទំនងភ្លាមៗ\nភ្ជាប់ទំនាក់ទំនងជាមួយមិត្តភក្តិ និងសហការីភ្លាមៗ។",
            featured: false, visible: true
        },
        {
            titleEn: "Music Streaming Dashboard",
            titleKm: "ផ្ទាំងគ្រប់គ្រងការចាក់តន្ត្រី",
            descriptionEn: "A custom UI for music streaming services with personalized themes.",
            descriptionKm: "ចំណុចប្រទាក់អ្នកប្រើសម្រាប់សេវាកម្មចាក់តន្ត្រីជាមួយស្បែកផ្ទាល់ខ្លួន",
            techStack: "TypeScript, Next.js, Spotify API",
            githubUrl: "https://github.com/example/music-ui",
            liveUrl: "https://music-stream.vercel.app",
            slug: "music-streaming-dashboard",
            contentEn: "# Experience Sound\nA premium look for your daily soundtrack.",
            contentKm: "# បទពិសោធន៍សំឡេង\nរូបរាងដ៏ប្រណីតសម្រាប់តន្ត្រីប្រចាំថ្ងៃរបស់អ្នក។",
            featured: false, visible: true
        }
    ],
    posts: [
        {
            titleEn: "Mastering React Hooks",
            titleKm: "ស្ទាត់ជំនាញលើ React Hooks",
            slug: "mastering-react-hooks",
            excerptEn: "A deep dive into useEffect, useMemo, and useCallback.",
            excerptKm: "ការសិក្សាស៊ីជម្រៅអំពី useEffect, useMemo និង useCallback",
            contentEn: "# Hooks Overview\nReact hooks allow you to use state and other features without a class.",
            contentKm: "# ទិដ្ឋភាពទូទៅនៃ Hooks\nReact hooks អនុញ្ញាតឱ្យអ្នកប្រើប្រាស់ state និងមុខងារផ្សេងទៀតដោយមិនចាំបាច់ប្រើ class។",
            tags: "React, JavaScript", featured: true, visible: true
        },
        {
            titleEn: "Introduction to TypeScript",
            titleKm: "ការណែនាំអំពី TypeScript",
            slug: "intro-to-typescript",
            excerptEn: "Why you should use TypeScript for your next project.",
            excerptKm: "ហេតុអ្វីអ្នកគួរប្រើ TypeScript សម្រាប់គម្រោងបន្ទាប់របស់អ្នក",
            contentEn: "# Types Matter\nAdding types to your code prevents many runtime errors.",
            contentKm: "# សារៈសំខាន់នៃប្រភេទ\nការបន្ថែមប្រភេទទៅក្នុងកូដរបស់អ្នកជួយការពារកំហុសជាច្រើននៅពេលដំណើរការ។",
            tags: "TypeScript, WebDev", featured: false, visible: true
        },
        {
            titleEn: "UI/UX Design Principles",
            titleKm: "គោលការណ៍រចនា UI/UX",
            slug: "ui-ux-design-principles",
            excerptEn: "Fundamental principles for creating user-friendly interfaces.",
            excerptKm: "គោលការណ៍គ្រឹះសម្រាប់បង្កើតចំណុចប្រទាក់អ្នកប្រើដែលងាយស្រួលប្រើ",
            contentEn: "# Design First\nUnderstand your users before you start drawing.",
            contentKm: "# ការរចនាជាមុន\nយល់ពីអ្នកប្រើប្រាស់របស់អ្នកមុនពេលអ្នកចាប់ផ្តើមគូរ។",
            tags: "Design, UIUX", featured: true, visible: true
        },
        {
            titleEn: "Serverless with Firebase Functions",
            titleKm: "Serverless ជាមួយ Firebase Functions",
            slug: "serverless-firebase-functions",
            excerptEn: "How to build scalable backends without managing servers.",
            excerptKm: "របៀបបង្កើត backend ដែលអាចពង្រីកបានដោយមិនចាំបាច់គ្រប់គ្រង server",
            contentEn: "# Cloud Functions\nRunning backend code in response to events triggered by Firebase features.",
            contentKm: "# Cloud Functions\nដំណើរការកូដ backend ជាការឆ្លើយតបទៅនឹងព្រឹត្តិការណ៍នានាពី Firebase។",
            tags: "Firebase, Serverless", featured: false, visible: true
        },
        {
            titleEn: "The Power of CSS Grid",
            titleKm: "អំណាចនៃ CSS Grid",
            slug: "power-of-css-grid",
            excerptEn: "Building complex layouts easily with CSS Grid.",
            excerptKm: "បង្កើតប្លង់ស្មុគស្មាញយ៉ាងងាយស្រួលជាមួយ CSS Grid",
            contentEn: "# Grid Layout\nThe most powerful layout system available in CSS.",
            contentKm: "# ប្លង់ Grid\nប្រព័ន្ធប្លង់ដ៏មានឥទ្ធិពលបំផុតដែលមាននៅក្នុង CSS។",
            tags: "CSS, Frontend", featured: false, visible: true
        },
        {
            titleEn: "Testing with Vitest",
            titleKm: "ការសាកល្បងជាមួយ Vitest",
            slug: "testing-with-vitest",
            excerptEn: "Modern unit testing for fast development cycles.",
            excerptKm: "ការសាកល្បងឯកតាទំនើបសម្រាប់វដ្តនៃការអភិវឌ្ឍន៍លឿន",
            contentEn: "# Fast Tests\nBlazing fast unit test framework powered by Vite.",
            contentKm: "# ការតេស្តលឿន\nក្របខ័ណ្ឌសាកល្បងឯកតាដ៏លឿនបំផុតដែលគាំទ្រដោយ Vite។",
            tags: "Testing, Vite", featured: true, visible: true
        },
        {
            titleEn: "Database Schema Design",
            titleKm: "ការរចនា Schema មូលដ្ឋានទ្និន្នន័យ",
            slug: "database-schema-design",
            excerptEn: "Best practices for designing NoSQL and SQL databases.",
            excerptKm: "វិធីសាស្ត្រល្អៗសម្រាប់រចនាមូលដ្ឋានទិន្នន័យ NoSQL និង SQL",
            contentEn: "# Data Structure\nPlanning your data layout for performance and scalability.",
            contentKm: "# រចនាសម្ព័ន្ធទិន្នន័យ\nរៀបចំប្លង់ទិន្នន័យរបស់អ្នកសម្រាប់ប្រសិទ្ធភាព និងពង្រីកបាន។",
            tags: "Database, SQL, NoSQL", featured: false, visible: true
        },
        {
            titleEn: "Responsive Design in 2026",
            titleKm: "ការរចនាដែលឆ្លើយតបគ្រប់ឧបករណ៍ក្នុងឆ្នាំ២០២៦",
            slug: "responsive-design-2026",
            excerptEn: "Adapting to the latest devices and screen sizes.",
            excerptKm: "ការសម្របខ្លួនទៅនឹងឧបករណ៍ និងទំហំអេក្រង់ចុងក្រោយបំផុត",
            contentEn: "# Multi-Device\nUsers are everywhere, from watches to foldable screens.",
            contentKm: "# ឧបករណ៍ច្រើន\nអ្នកប្រើប្រាស់មាននៅគ្រប់ទីកន្លែង ចាប់ពីនាឡិការហូតដល់អេក្រង់បត់។",
            tags: "WebDesign, Mobile", featured: true, visible: true
        },
        {
            titleEn: "Git Flow for Teams",
            titleKm: "លំហូរការងារ Git សម្រាប់ក្រុម",
            slug: "git-flow-for-teams",
            excerptEn: "Using Git effectively for collaborative development.",
            excerptKm: "ប្រើប្រាស់ Git ប្រកបដោយប្រសិទ្ធភាពសម្រាប់ការអភិវឌ្ឍនជាក្រុម",
            contentEn: "# Collaboration\nBranching strategies that help avoid merge conflicts.",
            contentKm: "# កិច្ចសហការ\nយុទ្ធសាស្ត្រប្រើប្រាស់មែកធាងកូដដែលជួយចៀសវាងបញ្ហាពេលបញ្ចូលកូដ។",
            tags: "Git, Collaboration", featured: false, visible: true
        },
        {
            titleEn: "Optimizing Web Performance",
            titleKm: "ការបង្កើនប្រសិទ្ធភាពវិបសាយ",
            slug: "optimizing-web-performance",
            excerptEn: "How to reach 100 on Lighthouse score.",
            excerptKm: "របៀបសម្រេចឱ្យបានពិន្ទុ ១០០ នៅលើ Lighthouse",
            contentEn: "# Speed Optimization\nMinimizing bundle size and optimizing images.",
            contentKm: "# បង្កើនល្បឿន\nកាត់បន្ថយទំហំកូដ និងបង្កើនប្រសិទ្ធភាពរូបភាព។",
            tags: "Performance, WebDev", featured: false, visible: true
        }
    ],
    experience: [
        {
            titleEn: "Senior Full Stack Developer",
            titleKm: "អ្នកអភិវឌ្ឍន៍ Full Stack កម្រិតជាន់ខ្ពស់",
            companyEn: "Tech Innovators Co., Ltd",
            companyKm: "ក្រុមហ៊ុន Tech Innovators Co., Ltd",
            descriptionEn: "Leading multiple projects and mentoring junior developers.",
            descriptionKm: "ដឹកនាំគម្រោងជាច្រើន និងផ្តល់ប្រឹក្សាដល់អ្នកអភិវឌ្ឍន៍ជំនាន់ក្រោយ",
            startDate: "2023-01-01", visible: true
        },
        {
            titleEn: "Web Developer",
            titleKm: "អ្នកអភិវឌ្ឍន៍វិបសាយ",
            companyEn: "Digital Solutions Agency",
            companyKm: "ទីភ្នាក់ងារដំណោះស្រាយឌីជីថល",
            descriptionEn: "Building high-performance e-commerce websites.",
            descriptionKm: "បង្កើតគេហទំព័រលក់ទំនិញដែលមានប្រសិទ្ធភាពខ្ពស់",
            startDate: "2021-06-01", endDate: "2022-12-31", visible: true
        },
        {
            titleEn: "Junior Frontend Developer",
            titleKm: "អ្នកអភិវឌ្ឍន៍ Frontend កម្រិតបឋម",
            companyEn: "Startup Hub",
            companyKm: "ស្ថាប័ន Startup Hub",
            descriptionEn: "Working with React and modern SCSS.",
            descriptionKm: "ធ្វើការជាមួយ React និង SCSS ទំនើប",
            startDate: "2020-01-01", endDate: "2021-05-30", visible: true
        },
        {
            titleEn: "Freelance Software Engineer",
            titleKm: "វិស្វករកម្មវិធីសេរី",
            companyEn: "Self-Employed",
            companyKm: "ធ្វើការផ្ទាល់ខ្លួន",
            descriptionEn: "Delivering custom software solutions for clients.",
            descriptionKm: "ផ្តល់ជូននូវដំណោះស្រាយកម្មវិធីផ្ទាល់ខ្លួនសម្រាប់អតិថិជន",
            startDate: "2019-01-01", endDate: "2019-12-31", visible: true
        },
        {
            titleEn: "IT Intern",
            titleKm: "កម្មសិក្សាការីផ្នែកព័ត៌មានវិទ្យា",
            companyEn: "Large Enterprise",
            companyKm: "សហគ្រាសខ្នាតធំ",
            descriptionEn: "Assisting with hardware and software troubleshooting.",
            descriptionKm: "ជួយការងារដោះស្រាយបញ្ហាផ្នែករឹង និងផ្នែកទន់",
            startDate: "2018-06-01", endDate: "2018-08-31", visible: true
        }
    ]
};

/**
 * Seeds sample data into Firestore.
 * @param {string} userRole - Role of the current user
 * @param {function} trackWrite - Activity tracking callback
 * @returns {Promise<Object>} Results of the operation
 */
export const seedSampleData = async (userRole, trackWrite) => {
    const results = {
        projects: { created: 0, failed: 0 },
        posts: { created: 0, failed: 0 },
        experience: { created: 0, failed: 0 }
    };

    // Seed Projects
    for (const project of SAMPLE_DATA.projects) {
        try {
            await ProjectService.saveProject(userRole, project, project.imageUrl || '', trackWrite);
            results.projects.created++;
        } catch (error) {
            console.error(`Failed to seed project: ${project.titleEn}`, error);
            results.projects.failed++;
        }
    }

    // Seed Posts
    for (const post of SAMPLE_DATA.posts) {
        try {
            await BlogService.savePost(userRole, post, trackWrite);
            results.posts.created++;
        } catch (error) {
            console.error(`Failed to seed post: ${post.titleEn}`, error);
            results.posts.failed++;
        }
    }

    // Seed Experience
    for (const exp of SAMPLE_DATA.experience) {
        try {
            await ExperienceService.saveExperience(userRole, exp, trackWrite);
            results.experience.created++;
        } catch (error) {
            console.error(`Failed to seed experience: ${exp.companyEn}`, error);
            results.experience.failed++;
        }
    }

    return results;
};
