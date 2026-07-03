const fs = require('fs');

const updateJson = (file, additions) => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    // Deep merge function
    const merge = (target, source) => {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && key in target) {
                Object.assign(source[key], merge(target[key], source[key]));
            }
        }
        Object.assign(target || {}, source);
        return target;
    };

    merge(data, additions);
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
};

const enAdditions = {
    admin: {
        common: {
            langEn: "EN",
            langKm: "KM"
        },
        search: {
            esc: "Esc",
            commandPalette: "Command Palette"
        }
    },
    card: {
        labels: {
            mobile: "Mobile",
            email: "Email",
            website: "Website",
            location: "Location"
        },
        qr: {
            scanToSave: "SCAN TO SAVE",
            myContactInstantly: "my contact instantly"
        },
        tagline: "SECURE TODAY • PROTECT TOMORROW • EMPOWER FUTURE",
        fallbackName: "John Doe",
        fallbackTitle: "Information Security Professional"
    },
    errors: {
        rateLimitMinute: "Too many requests. Please wait a minute.",
        rateLimitDay: "Daily request limit reached. Please try tomorrow."
    }
};

const kmAdditions = {
    admin: {
        common: {
            langEn: "EN",
            langKm: "KM"
        },
        search: {
            esc: "Esc",
            commandPalette: "Command Palette"
        }
    },
    card: {
        labels: {
            mobile: "ទូរស័ព្ទ",
            email: "អ៊ីមែល",
            website: "គេហទំព័រ",
            location: "ទីតាំង"
        },
        qr: {
            scanToSave: "ស្កេនដើម្បីរក្សាទុក",
            myContactInstantly: "ទំនាក់ទំនងរបស់ខ្ញុំភ្លាមៗ"
        },
        tagline: "សុវត្ថិភាពថ្ងៃនេះ • ការពារថ្ងៃស្អែក • ផ្តល់អំណាចទៅអនាគត",
        fallbackName: "John Doe",
        fallbackTitle: "អ្នកជំនាញផ្នែកសន្តិសុខព័ត៌មានវិទ្យា"
    },
    errors: {
        rateLimitMinute: "សំណើច្រើនពេក។ សូមរង់ចាំមួយនាទីសិន។",
        rateLimitDay: "ឈានដល់ដែនកំណត់សំណើប្រចាំថ្ងៃ។ សូមសាកល្បងម្ដងទៀតនៅថ្ងៃស្អែក។"
    }
};

updateJson('src/i18n/en.json', enAdditions);
updateJson('src/i18n/km.json', kmAdditions);
console.log('Updated translation files successfully.');
