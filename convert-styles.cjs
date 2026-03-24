const fs = require('fs');

function camelToKebab(str) {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

const files = [
  'd:/portfolio/src/pages/admin/users/components/UserDetailDialog.jsx',
  'd:/portfolio/src/pages/admin/users/components/UsersFormDialog.jsx',
  'd:/portfolio/src/pages/admin/users/components/UsersTable.jsx',
  'd:/portfolio/src/pages/admin/users/components/RolePermissionsPanel.jsx',
  'd:/portfolio/src/pages/admin/users/components/UsersToolbar.jsx',
  'd:/portfolio/src/pages/admin/database/components/DatabaseActions.jsx',
  'd:/portfolio/src/pages/admin/database/components/DatabaseStats.jsx',
  'd:/portfolio/src/pages/admin/database/components/RestoreProgress.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import styles from '.*?.module\.scss';\n?/g, '');
  
  content = content.replace(/styles\.([a-zA-Z0-9_]+)/g, (match, p1) => {
    return `"ui-${camelToKebab(p1)}"`;
  });

  // remove redundant interpolations
  content = content.replace(/\$\{?"(ui-[a-z0-9-]+)"\}?/g, '"$1"');
  // cleanup multiple classes in template literals: className={`${"ui-foo"} ${"ui-bar"}`} -> className="ui-foo ui-bar"
  content = content.replace(/ className=\{\`([^`]+)\`\}/g, (match, inner) => {
    let cleaned = inner.replace(/\$?"(ui-[a-z0-9-]+)"/g, '$1');
    cleaned = cleaned.replace(/["']/g, ''); // remove any remaining quotes inside
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return ` className="${cleaned}"`;
  });
  
  // also fix basic concatenation: className={"ui-foo" + " " + "ui-bar"} => className="ui-foo ui-bar"
  content = content.replace(/ className=\{("ui-[a-z0-9-]+"\s*\+\s*" "\s*\+\s*"ui-[a-z0-9-]+")\}/g, (match, inner) => {
      let cleaned = inner.replace(/["+]/g, '').replace(/\s+/g, ' ').trim();
      return ` className="${cleaned}"`;
  });

  fs.writeFileSync(file, content);
});

// Now read the CSS files and append them to _admin-ui.scss
const cssFiles = [
  'd:/portfolio/src/pages/admin/users/UsersTab.module.scss',
  'd:/portfolio/src/pages/admin/database/DatabaseTab.module.scss'
];

let globalScss = fs.readFileSync('d:/portfolio/src/styles/components/_admin-ui.scss', 'utf8');

cssFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    let css = fs.readFileSync(file, 'utf8');
    
    // convert .camelCase to .ui-kebab-case
    css = css.replace(/\.([a-zA-Z0-9_]+)/g, (match, p1) => {
        // ignore already ui- prefixed or specific ones
        if (p1.startsWith('ui-') || p1 === 'active') return match;
        return `.ui-${camelToKebab(p1)}`;
    });
    
    globalScss += `\n\n/* MIGRATED FROM ${file.split('/').pop()} */\n` + css;
    fs.unlinkSync(file); // delete the old file
});

fs.writeFileSync('d:/portfolio/src/styles/components/_admin-ui.scss', globalScss);
console.log('Conversion complete!');
