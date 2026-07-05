import os
import re

pattern = re.compile(r"t\('([^']+)'")

directories = [
    'src/pages/admin/awards',
    'src/pages/admin/publications',
    'src/pages/admin/education'
]

keys = set()
for directory in directories:
    for root, _, files in os.walk(directory):
        for f in files:
            if f.endswith('.jsx'):
                with open(os.path.join(root, f), 'r', encoding='utf-8') as file:
                    content = file.read()
                    matches = pattern.findall(content)
                    for match in matches:
                        if match.startswith('admin.awards') or match.startswith('admin.publications') or match.startswith('admin.education'):
                            keys.add(match)

for key in sorted(keys):
    print(key)
