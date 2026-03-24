const fs = require('fs');
const path = require('path');

function findImports(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findImports(filePath);
        } else if (file.endsWith('.jsx')) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('Admin.module.scss')) {
                console.log(filePath);
            }
        }
    }
}

findImports('d:/portfolio/src/pages/admin');
