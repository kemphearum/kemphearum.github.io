import json

def update_km_json():
    path = 'src/i18n/km.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'awards' in data.get('admin', {}):
        data['admin']['awards']['stats']['total'] = 'ពានរង្វាន់សរុប'
    
    if 'publications' in data.get('admin', {}):
        data['admin']['publications']['stats']['total'] = 'ការបោះពុម្ពផ្សាយសរុប'
        
    if 'speaking' in data.get('admin', {}):
        data['admin']['speaking']['stats']['total'] = 'ព្រឹត្តិការណ៍សរុប'
        
    if 'analytics' not in data['admin']:
        data['admin']['analytics'] = {}
        
    data['admin']['analytics']['settings'] = {
        "title": "ការកំណត់វិភាគ",
        "dataRetention": {
            "title": "ការរក្សាទុកទិន្នន័យ",
            "period": "រយៈពេលរក្សាទុក (ថ្ងៃ)",
            "note": "ទិន្នន័យចាស់ៗនឹងត្រូវបានលុបដោយស្វ័យប្រវត្តិដើម្បីសន្សំទំហំ។",
            "days": "{{count}} ថ្ងៃ"
        },
        "tracking": {
            "title": "ចំណូលចិត្តតាមដាន",
            "visitor": {
                "label": "តាមដានអ្នកទស្សនា",
                "desc": "កត់ត្រាការចូលមើលទំព័រ។"
            },
            "anonymize": {
                "label": "លាក់ IP",
                "desc": "បិទបាំង IP មុនពេលរក្សាទុក។"
            },
            "search": {
                "label": "តាមដានការស្វែងរក",
                "desc": "កត់ត្រាពាក្យស្វែងរក។"
            },
            "download": {
                "label": "តាមដានការទាញយក",
                "desc": "កត់ត្រាការទាញយកឯកសារ។"
            }
        }
    }
    
    # Add force logout note
    if 'userManagement' not in data['admin']:
        data['admin']['userManagement'] = {}
    if 'activeSessions' not in data['admin']['userManagement']:
        data['admin']['userManagement']['activeSessions'] = {}
    data['admin']['userManagement']['activeSessions']['forceLogoutNote'] = 'ចំណាំ៖ ការបង្ខំឲ្យចាកចេញ ទាមទារឲ្យមាន backend ដែលអាចទុកចិត្តបាន (Firebase Admin SDK ឬ Cloud Functions) ហើយវាមិនមាននៅក្នុងទម្រង់ Zero-Cost ទេ។'

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def update_en_json():
    path = 'src/i18n/en.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if 'userManagement' not in data['admin']:
        data['admin']['userManagement'] = {}
    if 'activeSessions' not in data['admin']['userManagement']:
        data['admin']['userManagement']['activeSessions'] = {}
    data['admin']['userManagement']['activeSessions']['forceLogoutNote'] = 'Note: Force Logout requires a trusted backend (Firebase Admin SDK or Cloud Functions) and is unavailable in Zero-Cost mode.'

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

update_km_json()
update_en_json()
print("Done")
