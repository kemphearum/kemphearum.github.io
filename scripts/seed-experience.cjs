const admin = require('firebase-admin');
const serviceAccount = require('../sa-source.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const experiences = [
    {
        slug: "visionfund-cambodia-it-audit-officer",
        company: { en: "VisionFund Cambodia", km: "វីសិនហ្វាន ខេមបូឌា" },
        role: { en: "IT Internal Audit Officer", km: "មន្ត្រីសវនកម្មផ្ទៃក្នុងផ្នែកព័ត៌មានវិទ្យា" },
        description: { 
            en: "Develop and execute audit objectives/procedures to assess controls for new or existing IT assets/systems/processes.\nServe as auditor-in-charge of audit engagements.\nConduct data extraction, analysis, security reviews utilizing software tools.", 
            km: "រៀបចំ និងអនុវត្តគោលបំណង/នីតិវិធីសវនកម្ម ដើម្បីវាយតម្លៃការគ្រប់គ្រងលើទ្រព្យសកម្ម/ប្រព័ន្ធ/ដំណើរការព័ត៌មានវិទ្យាថ្មី ឬដែលមានស្រាប់។\nបម្រើការជាសវនករទទួលបន្ទុកលើការងារសវនកម្ម។\nអនុវត្តការទាញយកទិន្នន័យ ការវិភាគ និងការពិនិត្យសន្តិសុខដោយប្រើប្រាស់ឧបករណ៍កម្មវិធី។" 
        },
        period: "Mar, 2018 - Sep, 2018",
        startMonthYear: "2018-03",
        endMonthYear: "2018-09",
        visible: true,
        order: 6
    },
    {
        slug: "cambodia-post-bank-senior-audit-officer",
        company: { en: "Cambodia Post Bank Plc.", km: "ធនាគារ ប្រៃសណីយ៍កម្ពុជា ភីអិលស៊ី" },
        role: { en: "Senior Internal Audit Officer", km: "មន្ត្រីសវនកម្មផ្ទៃក្នុងជាន់ខ្ពស់" },
        description: { 
            en: "Assist the Head of Internal Audit in preparing the annual audit plan.\nPerform audit such as IT, Credit, Operation, Opening Account & AML.\nUpdate audit programs and audit checklists.\nDevelop audit methodology, audit programs and testing procedures.", 
            km: "ជួយប្រធានផ្នែកសវនកម្មផ្ទៃក្នុងក្នុងការរៀបចំផែនការសវនកម្មប្រចាំឆ្នាំ។\nអនុវត្តសវនកម្មដូចជា ផ្នែកព័ត៌មានវិទ្យា ឥណទាន ប្រតិបត្តិការ ការបើកគណនី និង AML។\nធ្វើបច្ចុប្បន្នភាពកម្មវិធីសវនកម្ម និងបញ្ជីផ្ទៀងផ្ទាត់សវនកម្ម។\nបង្កើតវិធីសាស្ត្រសវនកម្ម កម្មវិធីសវនកម្ម និងនីតិវិធីធ្វើតេស្ត។" 
        },
        period: "Jan, 2016 - Feb, 2018",
        startMonthYear: "2016-01",
        endMonthYear: "2018-02",
        visible: true,
        order: 7
    },
    {
        slug: "prasac-is-audit-manager",
        company: { en: "Prasac Microfinance Institution Plc.", km: "គ្រឹះស្ថានមីក្រូហិរញ្ញវត្ថុ ប្រាសាក់ ភីអិលស៊ី" },
        role: { en: "Manager of Information System Audit Unit", km: "អ្នកគ្រប់គ្រងអង្គភាពសវនកម្មប្រព័ន្ធព័ត៌មាន" },
        description: { 
            en: "Be a team leader in conducting IT audit at Head Office, Regional and Branches.\nReview Prasac's IT Regulation and Compliance Audit, E-Banking, Security Management Audit, etc.\nBe a project leader for Audit System Development and Innovation.\nDevelop and update IT Audit Manual, Audit Program, IT Audit Universe.\nAssign IS Auditor to conduct audit by areas or branches.", 
            km: "ធ្វើជាប្រធានក្រុមក្នុងការដឹកនាំសវនកម្មព័ត៌មានវិទ្យានៅការិយាល័យកណ្តាល តំបន់ និងសាខា។\nពិនិត្យមើលបទប្បញ្ញត្តិព័ត៌មានវិទ្យារបស់ប្រាសាក់ និងសវនកម្មអនុលោមភាព, E-Banking, សវនកម្មគ្រប់គ្រងសន្តិសុខ ជាដើម។\nធ្វើជាប្រធានគម្រោងសម្រាប់ការអភិវឌ្ឍប្រព័ន្ធសវនកម្ម និងការច្នៃប្រឌិត។\nបង្កើត និងធ្វើបច្ចុប្បន្នភាពសៀវភៅណែនាំសវនកម្មព័ត៌មានវិទ្យា កម្មវិធីសវនកម្ម និង IT Audit Universe។\nចាត់តាំងសវនករប្រព័ន្ធព័ត៌មានដើម្បីអនុវត្តសវនកម្មតាមតំបន់ ឬសាខា។" 
        },
        period: "Feb, 2020 - Feb, 2022",
        startMonthYear: "2020-02",
        endMonthYear: "2022-02",
        visible: true,
        order: 2
    },
    {
        slug: "prasac-senior-is-auditor",
        company: { en: "Prasac Microfinance Institution Plc.", km: "គ្រឹះស្ថានមីក្រូហិរញ្ញវត្ថុ ប្រាសាក់ ភីអិលស៊ី" },
        role: { en: "Senior Information System Auditor", km: "សវនករប្រព័ន្ធព័ត៌មានជាន់ខ្ពស់" },
        description: { 
            en: "Conducted information system audits and compliance checks.", 
            km: "បានអនុវត្តសវនកម្មប្រព័ន្ធព័ត៌មាន និងការត្រួតពិនិត្យអនុលោមភាព។" 
        },
        period: "Oct, 2018 - Mar, 2019",
        startMonthYear: "2018-10",
        endMonthYear: "2019-03",
        visible: true,
        order: 5
    },
    {
        slug: "wing-bank-it-audit-manager",
        company: { en: "Wing Bank (Cambodia) Plc.", km: "ធនាគារ វីង (ខេមបូឌា) ភីអិលស៊ី" },
        role: { en: "IT Audit Manager", km: "អ្នកគ្រប់គ្រងសវនកម្មព័ត៌មានវិទ្យា" },
        description: { 
            en: "Assist Head of Internal Audit in preparing and execution of annual IT audit plan and strategy.\nReview WING IT governance, policy, system and process and identify risk areas.\nDevelop audit program and working paper for IT audit.", 
            km: "ជួយប្រធានផ្នែកសវនកម្មផ្ទៃក្នុងក្នុងការរៀបចំ និងអនុវត្តផែនការ និងយុទ្ធសាស្ត្រសវនកម្មព័ត៌មានវិទ្យាប្រចាំឆ្នាំ។\nពិនិត្យមើលអភិបាលកិច្ចព័ត៌មានវិទ្យា គោលនយោបាយ ប្រព័ន្ធ និងដំណើរការរបស់ WING និងកំណត់តំបន់ហានិភ័យ។\nបង្កើតកម្មវិធីសវនកម្ម និងឯកសារការងារសម្រាប់សវនកម្មព័ត៌មានវិទ្យា។" 
        },
        period: "Feb, 2022 - Apr 2022",
        startMonthYear: "2022-02",
        endMonthYear: "2022-04",
        visible: true,
        order: 1
    },
    {
        slug: "prasac-deputy-is-audit-manager",
        company: { en: "Prasac Microfinance Institution Plc.", km: "គ្រឹះស្ថានមីក្រូហិរញ្ញវត្ថុ ប្រាសាក់ ភីអិលស៊ី" },
        role: { en: "Deputy Manager of Information System Audit Unit", km: "អនុអ្នកគ្រប់គ្រងអង្គភាពសវនកម្មប្រព័ន្ធព័ត៌មាន" },
        description: { 
            en: "Supervising, overseeing and executing IT audits.\nLeading and delivering their allocated audit assignment.\nFormulate recommendations regarding control deficiencies.", 
            km: "ត្រួតពិនិត្យ មើលការខុសត្រូវ និងអនុវត្តសវនកម្មព័ត៌មានវិទ្យា។\nដឹកនាំ និងប្រគល់ភារកិច្ចសវនកម្មដែលបានបែងចែកឱ្យពួកគាត់។\nបង្កើតអនុសាសន៍ទាក់ទងនឹងកង្វះខាតនៃការគ្រប់គ្រង។" 
        },
        period: "Apr, 2019 - Jul, 2020",
        startMonthYear: "2019-04",
        endMonthYear: "2020-07",
        visible: true,
        order: 3
    },
    {
        slug: "senior-full-stack-developer",
        company: { en: "Tech Innovators Co., Ltd", km: "ក្រុមហ៊ុន Tech Innovators Co., Ltd" },
        role: { en: "Senior Full Stack Developer", km: "អ្នកអភិវឌ្ឍន៍ Full Stack កម្រិតជាន់ខ្ពស់" },
        description: { en: "Leading multiple projects and mentoring junior developers.", km: "ដឹកនាំគម្រោងជាច្រើន និងផ្តល់ប្រឹក្សាដល់អ្នកអភិវឌ្ឍន៍ជំនាន់ក្រោយ" },
        startDate: "2023-01-01",
        current: true,
        visible: true,
        order: 0
    },
    {
        slug: "web-developer-digital",
        company: { en: "Digital Solutions Agency", km: "ទីភ្នាក់ងារដំណោះស្រាយឌីជីថល" },
        role: { en: "Web Developer", km: "អ្នកអភិវឌ្ឍន៍វិបសាយ" },
        description: { en: "Building high-performance e-commerce websites.", km: "បង្កើតគេហទំព័រលក់ទំនិញដែលមានប្រសិទ្ធភាពខ្ពស់" },
        startDate: "2021-06-01",
        endDate: "2022-12-31",
        visible: true,
        order: 4
    },
    {
        slug: "startup-hub-junior-frontend-developer",
        company: { en: "Startup Hub", km: "ស្ថាប័ន Startup Hub" },
        role: { en: "Junior Frontend Developer", km: "អ្នកអភិវឌ្ឍន៍ Frontend កម្រិតបឋម" },
        description: { en: "Working with React and modern SCSS.", km: "ធ្វើការជាមួយ React និង SCSS ទំនើប" },
        startDate: "2020-01-01",
        endDate: "2021-05-30",
        visible: true,
        order: 8
    },
    {
        slug: "self-employed-freelance-software-engineer",
        company: { en: "Self-Employed", km: "ធ្វើការផ្ទាល់ខ្លួន" },
        role: { en: "Freelance Software Engineer", km: "វិស្វករកម្មវិធីសេរី" },
        description: { en: "Delivering custom software solutions for clients.", km: "ផ្តល់ជូននូវដំណោះស្រាយកម្មវិធីផ្ទាល់ខ្លួនសម្រាប់អតិថិជន" },
        startDate: "2019-01-01",
        endDate: "2019-12-31",
        visible: true,
        order: 9
    },
    {
        slug: "large-enterprise-it-intern",
        company: { en: "Large Enterprise", km: "សហគ្រាសខ្នាតធំ" },
        role: { en: "IT Intern", km: "កម្មសិក្សាការីផ្នែកព័ត៌មានវិទ្យា" },
        description: { en: "Assisting with hardware and software troubleshooting.", km: "ជួយការងារដោះស្រាយបញ្ហាផ្នែករឹង និងផ្នែកទន់" },
        startDate: "2018-06-01",
        endDate: "2018-08-31",
        visible: true,
        order: 10
    }
];

async function seedExperience() {
    console.log("Starting experience seeding process...");
    for (const exp of experiences) {
        const { slug, ...data } = exp;
        await db.collection('experience').doc(slug).set({
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`Successfully seeded experience: ${slug}`);
    }
    console.log("Experience seeding completed.");
    process.exit(0);
}

seedExperience().catch(err => {
    console.error(err);
    process.exit(1);
});
