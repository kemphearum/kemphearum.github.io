const fs = require('fs');
const path = require('path');

const walkDir = (dir, callback) => {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
};

walkDir('src/pages/admin', (filePath) => {
    if (!filePath.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/<Tabs\.Trigger value="en">EN<\/Tabs\.Trigger>/g, `<Tabs.Trigger value="en">{t('admin.common.langEn', 'EN')}</Tabs.Trigger>`);
    content = content.replace(/<Tabs\.Trigger value="km">KM<\/Tabs\.Trigger>/g, `<Tabs.Trigger value="km">{t('admin.common.langKm', 'KM')}</Tabs.Trigger>`);

    // CommandPalette Esc replacement
    content = content.replace(/<kbd className=\{styles\.kbd\}>Esc<\/kbd>/g, `<kbd className={styles.kbd}>{t('admin.search.esc', 'Esc')}</kbd>`);

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
});
