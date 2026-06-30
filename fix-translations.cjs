const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/i18n/en.json'));
const km = JSON.parse(fs.readFileSync('src/i18n/km.json'));

en.admin.common.table.status = 'Status';
en.admin.common.table.actions = 'Actions';

km.admin.common.table.status = 'ស្ថានភាព';
km.admin.common.table.actions = 'សកម្មភាព';

fs.writeFileSync('src/i18n/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('src/i18n/km.json', JSON.stringify(km, null, 2));

const fixFile = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/t\('admin\.common\.stats\.published',\s*'Published'\)/g, "t('admin.common.stats.published.label', 'Published')");
  content = content.replace(/t\('admin\.common\.stats\.featured',\s*'Featured'\)/g, "t('admin.common.stats.featured.label', 'Featured')");
  content = content.replace(/t\('admin\.common\.status',\s*'Status'\)/g, "t('admin.common.table.status', 'Status')");
  content = content.replace(/t\('admin\.common\.actions',\s*'Actions'\)/g, "t('admin.common.table.actions', 'Actions')");
  
  fs.writeFileSync(path, content);
};

const components = [
  'src/pages/admin/awards/AwardTab.jsx',
  'src/pages/admin/publications/PublicationTab.jsx',
  'src/pages/admin/speaking/SpeakingTab.jsx',
  'src/pages/admin/awards/components/AwardsTable.jsx',
  'src/pages/admin/publications/components/PublicationsTable.jsx',
  'src/pages/admin/speaking/components/SpeakingTable.jsx',
  'src/pages/admin/awards/components/AwardFormDialog.jsx',
  'src/pages/admin/publications/components/PublicationFormDialog.jsx',
  'src/pages/admin/speaking/components/SpeakingFormDialog.jsx'
];

components.forEach(c => {
  if (fs.existsSync(c)) {
    fixFile(c);
  }
});
console.log('Fixed JSX and JSON files!');
