import fs from 'fs';
import path from 'path';

const DIR = 'build/client';

console.log('[Post-Build] Flattening prerendered HTML files for clean URLs...');

function flatten(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const dirPath = path.join(dir, entry.name);
            const indexFile = path.join(dirPath, 'index.html');
            
            // If the directory has an index.html, flatten it to dirName.html
            if (fs.existsSync(indexFile)) {
                const targetFile = dirPath + '.html';
                fs.renameSync(indexFile, targetFile);
                console.log(`[Post-Build] Flattened ${entry.name}/index.html -> ${entry.name}.html`);
                
                // If directory is now empty, remove it
                if (fs.readdirSync(dirPath).length === 0) {
                    fs.rmdirSync(dirPath);
                    console.log(`[Post-Build] Removed empty directory ${entry.name}`);
                } else {
                    console.log(`[Post-Build] Kept directory ${entry.name} because it contains other files (e.g., dynamic nested routes).`);
                    // NOTE: If a directory still exists (e.g. /blog contains /blog/slug), 
                    // GitHub Pages will STILL force a trailing slash on /blog. 
                    // But for leaf nodes like /resume, this perfectly removes the trailing slash.
                }
            }
            
            // Recurse into the directory if it still exists
            if (fs.existsSync(dirPath)) {
                flatten(dirPath);
            }
        }
    }
}

flatten(DIR);
console.log('[Post-Build] Flattening complete.');
