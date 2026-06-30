import fs from 'fs';
import path from 'path';

const SRC_DIR = 'd:/portfolio/src';
const OUTPUT_FILE = 'audit_strings.json';

// Skip patterns
const EXCLUDE_DIRS = ['assets', 'styles', 'utils', 'hooks', 'firebase', 'lib', 'test'];
const EXCLUDE_FILES = ['.test.', '.spec.', '.css', '.scss'];

// Simple heuristic: Text inside JSX tags that isn't entirely a variable {likeThis} or empty
// e.g., >Some text< or placeholder="Some text"
// We will look for:
// 1. >([^<{}]+)< where the capture group has letters
// 2. (placeholder|label|title|hint)="([^"]*[a-zA-Z][^"]*)"

const regex1 = />([^<{}]+)</g;
const regex2 = /(placeholder|label|title|hint|value)="([^"]*[a-zA-Z][^"]*)"/g;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                results = results.concat(walk(filePath));
            }
        } else {
            if (filePath.endsWith('.jsx') && !EXCLUDE_FILES.some(ex => filePath.includes(ex))) {
                results.push(filePath);
            }
        }
    }
    return results;
}

const files = walk(SRC_DIR);
let matches = [];

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(SRC_DIR, file);

    let match;
    while ((match = regex1.exec(content)) !== null) {
        const text = match[1].trim();
        // Ignore single non-alphabetical characters or mostly symbol strings
        if (text && /[a-zA-Z]/.test(text) && !text.startsWith('import ') && !text.startsWith('export ') && !text.startsWith('className')) {
            matches.push({ file: relativePath, text });
        }
    }

    while ((match = regex2.exec(content)) !== null) {
        const text = match[2].trim();
        if (text && /[a-zA-Z]/.test(text)) {
            matches.push({ file: relativePath, text, attribute: match[1] });
        }
    }
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(matches, null, 2));
console.log(`Audit complete. Found ${matches.length} strings. Results saved to ${OUTPUT_FILE}`);
