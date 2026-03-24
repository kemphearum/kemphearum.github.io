const admin = require('firebase-admin');
const serviceAccount = require('../sa-source.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const homeData = {
    greeting: { en: "Hello, I'm", km: "សួស្តី ខ្ញុំគឺ" },
    name: { en: "Kem Phearum", km: "កឹម ភារម្យ" },
    subtitle: { en: "Software Engineer & IT Auditor", km: "វិស្វករកម្មវិធី និង សវនករព័ត៌មានវិទ្យា" },
    description: {
        en: "I build accessible, inclusive products and digital experiences for the web. Specialized in modern frontend frameworks and robust backend architectures, with a strong foundation in IT security and system auditing.",
        km: "ខ្ញុំបង្កើតផលិតផល និងបទពិសោធន៍ឌីជីថលសម្រាប់គេហទំព័រ ដែលងាយស្រួលចូលប្រើ។ មានជំនាញលើ frontend frameworks ទំនើបៗ និងរចនាសម្ព័ន្ធ backend រឹងមាំ ជាមួយនឹងមូលដ្ឋានគ្រឹះផ្នែកសន្តិសុខព័ត៌មានវិទ្យា និងសវនកម្មប្រព័ន្ធ។"
    },
    ctaText: { en: "View My Resume", km: "មើលប្រវត្តិរូបសង្ខេបរបស់ខ្ញុំ" },
    ctaLink: "/#experience",
    profileImageUrl: "https://ui-avatars.com/api/?name=Kem+Phearum&background=6C63FF&color=fff&size=350",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

const aboutData = {
    bio: {
        en: "I am a passionate Software Engineer and IT Auditor based in Phnom Penh, Cambodia. My journey in tech started with a deep curiosity about how systems work safely and efficiently. Today, I balance my time between auditing complex IT infrastructures for financial institutions and building modern, performant web applications.",
        km: "ខ្ញុំជាវិស្វករកម្មវិធី និងសវនករព័ត៌មានវិទ្យា ដែលមានមូលដ្ឋាននៅរាជធានីភ្នំពេញ ប្រទេសកម្ពុជា។ ការធ្វើដំណើររបស់ខ្ញុំក្នុងវិស័យបច្ចេកវិទ្យា ចាប់ផ្តើមពីការចង់ដឹងចង់ឃើញយ៉ាងជ្រាលជ្រៅ អំពីរបៀបដែលប្រព័ន្ធដំណើរការប្រកបដោយសុវត្ថិភាព និងប្រសិទ្ធភាព។ សព្វថ្ងៃនេះ ខ្ញុំធ្វើឱ្យមានតុល្យភាពពេលវេលារវាងការធ្វើសវនកម្មលើហេដ្ឋារចនាសម្ព័ន្ធ IT ស្មុគស្មាញសម្រាប់ស្ថាប័នហិរញ្ញវត្ថុ និងការបង្កើតកម្មវិធីរចនាគេហទំព័រទំនើបៗដ៏ល្អឥតខ្ចោះ។"
    },
    skills: ["React", "Node.js", "Firebase", "IT Audit", "Cybersecurity", "Next.js", "Python", "SQL", "Cloud Architecture", "Agile"],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

const contactData = {
    introText: {
        en: "Although I'm not currently looking for any new opportunities, my inbox is always open. Whether you have a question or just want to say hi, I'll try my best to get back to you!",
        km: "ទោះបីជាបច្ចុប្បន្នខ្ញុំមិនទាន់ស្វែងរកឱកាសការងារថ្មីក៏ដោយ ក៏ប្រអប់សាររបស់ខ្ញុំតែងតែបើកចំហរជានិច្ច។ មិនថាអ្នកមានសំណួរ ឬគ្រាន់តែចង់សួរសុខទុក្ខ ខ្ញុំនឹងព្យាយាមឆ្លើយតបទៅអ្នកវិញឱ្យបានលឿនតាមដែលអាចធ្វើទៅបាន!"
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

async function seedGeneral() {
    console.log("Starting general content (home, about, contact) seeding process...");

    await db.collection('content').doc('home').set(homeData, { merge: true });
    console.log("Successfully seeded 'home' content");

    await db.collection('content').doc('about').set(aboutData, { merge: true });
    console.log("Successfully seeded 'about' content");

    await db.collection('content').doc('contact').set(contactData, { merge: true });
    console.log("Successfully seeded 'contact' content");

    console.log("General content seeding completed.");
    process.exit(0);
}

seedGeneral().catch(err => {
    console.error(err);
    process.exit(1);
});
