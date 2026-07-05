import os
import re

files_with_errors = [
    'CollectionExplorerDialog.jsx',
    'CsvImportExportDialog.jsx',
    'DatabaseActions.jsx',
    'DatabaseActivityPanel.jsx',
    'DatabaseAssetAnalytics.jsx',
    'DatabaseHealthCheck.jsx',
    'DatabaseMonitoringPanel.jsx',
    'DatabaseStats.jsx'
]

base_dir = 'src/pages/admin/database/components'

import_statement = "import { useTranslation } from '../../../../hooks/useTranslation';\n"

for filename in files_with_errors:
    filepath = os.path.join(base_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add import statement if it doesn't exist
    if 'useTranslation' not in content:
        # Find the last import statement
        import_match = list(re.finditer(r'^import .*?;?\n', content, flags=re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            insert_pos = last_import.end()
            content = content[:insert_pos] + import_statement + content[insert_pos:]
        else:
            content = import_statement + content

    # 2. Add `const { t } = useTranslation(); const tm = (key, params = {}) => t(`admin.database.${key}`, params);`
    # inside the component definition.
    # Find the component definition (e.g. `const CollectionExplorerDialog = ({...}) => {`)
    comp_def_match = re.search(r'const\s+' + filename.replace('.jsx', '') + r'\s*=\s*\([^)]*\)\s*=>\s*\{', content)
    if not comp_def_match:
        # try function definition `function Component(...) {`
        comp_def_match = re.search(r'function\s+' + filename.replace('.jsx', '') + r'\s*\([^)]*\)\s*\{', content)

    if comp_def_match:
        insert_pos = comp_def_match.end()
        # check if useTranslation is already called
        if 'useTranslation()' not in content[insert_pos:insert_pos+200]:
            hook_code = "\n    const { t } = useTranslation();\n    const tm = (key, params = {}) => t(`admin.database.${key}`, params);\n"
            content = content[:insert_pos] + hook_code + content[insert_pos:]
        elif 'const tm =' not in content[insert_pos:insert_pos+300]:
            # if t is extracted but tm is not defined
            t_match = re.search(r'const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\);', content[insert_pos:])
            if t_match:
                t_insert_pos = insert_pos + t_match.end()
                tm_code = "\n    const tm = (key, params = {}) => t(`admin.database.${key}`, params);\n"
                content = content[:t_insert_pos] + tm_code + content[t_insert_pos:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed ESLint errors")
