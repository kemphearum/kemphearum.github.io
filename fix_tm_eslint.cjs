const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/admin/database/components/CollectionExplorerDialog.jsx',
    'src/pages/admin/database/components/CsvImportExportDialog.jsx',
    'src/pages/admin/database/components/DatabaseActions.jsx',
    'src/pages/admin/database/components/DatabaseActivityPanel.jsx',
    'src/pages/admin/database/components/DatabaseAssetAnalytics.jsx',
    'src/pages/admin/database/components/DatabaseHealthCheck.jsx',
    'src/pages/admin/database/components/DatabaseMonitoringPanel.jsx'
];

for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Only replace if tm isn't already defined
    if (!content.includes('const tm = ')) {
        // Find const { t } = useTranslation(); and replace it
        // Some might have different indentation
        content = content.replace(
            /const\s+{\s*t\s*}\s*=\s*useTranslation\(\);/g,
            "const { t } = useTranslation();\n    const tm = (key, params = {}) => t(`admin.database.${key}`, params);"
        );
        
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`Skipped ${filePath} (already has tm)`);
    }
}
