import fs from 'fs';

const enPath = 'src/i18n/en.json';
const kmPath = 'src/i18n/km.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const kmData = JSON.parse(fs.readFileSync(kmPath, 'utf8'));

// Helper to get nested value
const getNestedValue = (obj, key) => key.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj);

function checkMissing(source, target, path = '') {
    let missingCount = 0;
    for (const key in source) {
        const currentPath = path ? `${path}.${key}` : key;
        if (typeof source[key] === 'object' && source[key] !== null) {
            if (typeof target[key] !== 'object' || target[key] === null) {
                console.log(`[MISSING SECTION] ${currentPath}`);
                missingCount++;
            } else {
                missingCount += checkMissing(source[key], target[key], currentPath);
            }
        } else {
            if (target[key] === undefined) {
                console.log(`[MISSING KEY] ${currentPath}`);
                missingCount++;
            }
        }
    }
    return missingCount;
}

console.log('Checking missing keys in km.json:');
const missingInKm = checkMissing(enData, kmData);

console.log('\\nChecking missing keys in en.json:');
const missingInEn = checkMissing(kmData, enData);

if (missingInKm > 0 || missingInEn > 0) {
    console.log(`\\nTranslations validation failed! ${missingInKm} missing in km.json, ${missingInEn} missing in en.json.`);
    process.exit(1);
} else {
    console.log('\\nTranslations validation passed! No missing keys.');
    process.exit(0);
}
