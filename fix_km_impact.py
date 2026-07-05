import json

filepath = 'src/i18n/km.json'
with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

projects_fields = data.get('admin', {}).get('projects', {}).get('form', {}).get('fields', {})
projects_fields['impact'] = 'ផលប៉ះពាល់'
projects_fields['impactPlaceholder'] = 'ឧ. កាត់បន្ថយហានិភ័យ ២០%'

data['admin']['projects']['form']['fields'] = projects_fields

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated impact in projects fields")
