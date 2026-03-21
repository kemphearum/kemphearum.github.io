import re
import os

def transform_scss(content):
    content = re.sub(r':global\((.*?)\)', r'\1', content)
    content = content.replace(':global', '')
    output = []
    lines = content.split('\n')
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('@'):
            output.append(line)
            continue
        if ':' in line and '{' not in line:
             if re.match(r'^\s*[\w-]+\s*:', line):
                 output.append(line)
                 continue
        new_line = re.sub(r'(?<!\d)\.(?!ui-)([a-zA-Z][\w-]*)', r'.ui-\1', line)
        output.append(new_line)
    return '\n'.join(output)

files_to_merge = [
    r'd:\portfolio\src\pages\admin\components\AdminLayout.module.scss',
    r'd:\portfolio\src\pages\admin\components\Sidebar.module.scss',
    r'd:\portfolio\src\pages\admin\components\Header.module.scss'
]
output_path = r'd:\portfolio\src\styles\admin.scss'

with open(output_path, 'a', encoding='utf-8') as outfile:
    for fpath in files_to_merge:
        with open(fpath, 'r', encoding='utf-8') as infile:
            content = infile.read()
        transformed = transform_scss(content)
        outfile.write(f"\n\n// MERGED FROM {os.path.basename(fpath)}\n")
        outfile.write(transformed)

print(f"Merged {len(files_to_merge)} files into {output_path}")
