import os
import json
import re

components_dir = 'src/pages/admin/database'
en_json_path = 'src/i18n/en.json'
km_json_path = 'src/i18n/km.json'

with open(en_json_path, 'r', encoding='utf-8') as f:
    en_json = json.load(f)
with open(km_json_path, 'r', encoding='utf-8') as f:
    km_json = json.load(f)

en_db = en_json.get('admin', {}).get('database', {})
km_db = km_json.get('admin', {}).get('database', {})

# Find all t('admin.database.something.something') and tm('something.something')
keys_found = set()
pattern = re.compile(r"t(?:m)?\(['\"]admin\.database\.([\w\.]+)['\"]")
pattern2 = re.compile(r"tm\(['\"]([\w\.]+)['\"]")

for root, _, files in os.walk(components_dir):
    for file in files:
        if file.endswith('.jsx'):
            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                content = f.read()
                matches = pattern.findall(content)
                for match in matches:
                    keys_found.add(match)
                matches2 = pattern2.findall(content)
                for match in matches2:
                    if not match.startswith('ui.') and not match.startswith('common.') and not match.startswith('validation.'):
                        keys_found.add(match)

def get_nested(d, key_path):
    keys = key_path.split('.')
    val = d
    for k in keys:
        if isinstance(val, dict):
            val = val.get(k)
        else:
            return None
    return val

missing_in_en = []
missing_in_km = []

for key in sorted(keys_found):
    if get_nested(en_db, key) is None:
        missing_in_en.append(key)
    if get_nested(km_db, key) is None:
        missing_in_km.append(key)

print("Missing in EN:")
for k in missing_in_en:
    print("  " + k)

print("\nMissing in KM:")
for k in missing_in_km:
    print("  " + k)
