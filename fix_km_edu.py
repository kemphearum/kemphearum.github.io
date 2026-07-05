import json
import os

filepath = 'src/i18n/km.json'

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Ensure admin.education
education = data.setdefault('admin', {}).setdefault('education', {})
education_dict = {
    "workspace": {
        "eyebrow": "ផ្នែកការអប់រំ",
        "title": "កន្លែងគ្រប់គ្រងការអប់រំ",
        "description": "ស្វែងរក គ្រប់គ្រងសញ្ញាបត្រ វិញ្ញាបនបត្រ និងប្រវត្តិការអប់រំរបស់អ្នក។",
        "searchPlaceholder": "ស្វែងរកការអប់រំដោយសញ្ញាបត្រ ឬសាលា...",
        "addNew": "បន្ថែមការអប់រំថ្មី",
        "timelineHint": "ប្រើឆ្នាំច្បាស់លាស់ដើម្បីឱ្យបន្ទាត់ពេលវេលាស្ថិតស្ថេរ។",
        "presentHint": "សម្គាល់សញ្ញាបត្របច្ចុប្បន្ន។"
    },
    "stats": {
        "total": {
            "label": "ការអប់រំសរុប",
            "hint": "ការអប់រំទាំងអស់នៅក្នុងបណ្តុំទិន្នន័យ"
        },
        "visible": {
            "label": "បង្ហាញ",
            "hint": "បង្ហាញនៅក្នុងផ្នែកការអប់រំជាសាធារណៈ"
        },
        "schools": {
            "label": "សាលារៀន",
            "hint": "ស្ថាប័នផ្សេងៗគ្នា"
        }
    },
    "form": {
        "languages": {
            "en": "អង់គ្លេស",
            "km": "ខ្មែរ"
        },
        "sections": {
            "degreeDetails": {
                "title": "ព័ត៌មានលម្អិតសញ្ញាបត្រ",
                "description": "ព័ត៌មានលម្អិតនៃការសិក្សា"
            },
            "timeline": {
                "title": "ពេលវេលា",
                "description": "ឆ្នាំចូល និងបញ្ចប់"
            },
            "visibility": {
                "title": "ការបង្ហាញ",
                "description": "កំណត់ការបង្ហាញលើគេហទំព័រ"
            }
        },
        "fields": {
            "schoolName": "ឈ្មោះសាលា",
            "schoolRequired": "តម្រូវឱ្យមានឈ្មោះសាលា",
            "schoolPlaceholderEn": "ឧ. Royal University of Phnom Penh",
            "schoolPlaceholderKm": "ឧ. សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ",
            "degree": "សញ្ញាបត្រ",
            "degreeRequired": "តម្រូវឱ្យមានសញ្ញាបត្រ",
            "degreePlaceholderEn": "ឧ. Bachelor of Science",
            "degreePlaceholderKm": "ឧ. បរិញ្ញាបត្រវិទ្យាសាស្ត្រ",
            "fieldOfStudy": "មុខជំនាញ",
            "fieldOfStudyPlaceholderEn": "ឧ. Computer Science",
            "fieldOfStudyPlaceholderKm": "ឧ. វិទ្យាសាស្ត្រកុំព្យូទ័រ",
            "startYear": "ឆ្នាំចាប់ផ្តើម",
            "startYearRequired": "តម្រូវឱ្យមានឆ្នាំចាប់ផ្តើម",
            "startYearPlaceholder": "ឧ. 2018",
            "endYear": "ឆ្នាំបញ្ចប់",
            "endYearRequired": "តម្រូវឱ្យមានឆ្នាំបញ្ចប់",
            "endYearPlaceholder": "ឧ. 2022",
            "isCurrent": "កំពុងសិក្សា",
            "entryType": "ប្រភេទ",
            "description": "ការពិពណ៌នា",
            "visibility": "បង្ហាញជាសាធារណៈ",
            "optionVisible": "បង្ហាញ",
            "optionHidden": "លាក់"
        },
        "dialogs": {
            "addTitle": "បន្ថែមការអប់រំ",
            "editTitle": "កែប្រែការអប់រំ",
            "description": "សូមបញ្ចូលព័ត៌មានលម្អិតនៃការអប់រំ។"
        },
        "actions": {
            "save": "រក្សាទុក",
            "saving": "កំពុងរក្សាទុក...",
            "cancel": "បោះបង់"
        }
    },
    "dialogs": {
        "deleteTitle": "លុបការអប់រំឬ?",
        "deleteMessage": "តើអ្នកប្រាកដថាចង់លុបឬទេ?"
    },
    "table": {
        "columns": {
            "degree": "សញ្ញាបត្រ",
            "timeline": "ពេលវេលា",
            "status": "ស្ថានភាព",
            "actions": "សកម្មភាព"
        },
        "degreeMeta": {
            "untitled": "គ្មានសញ្ញាបត្រ",
            "noschool": "គ្មានសាលា"
        },
        "status": {
            "visible": "បង្ហាញ",
            "visibleDesc": "សាធារណៈ",
            "hidden": "លាក់",
            "hiddenDesc": "ឯកជន",
            "isCurrent": "បច្ចុប្បន្ន",
            "completed": "បានបញ្ចប់",
            "current": "កំពុងសិក្សា"
        },
        "noTimeline": "មិនមាន",
        "present": "បច្ចុប្បន្ន",
        "noDescription": "មិនមានការពិពណ៌នា",
        "empty": {
            "title": "មិនទាន់មានទិន្នន័យ",
            "description": "អ្នកអាចបន្ថែមការអប់រំនៅទីនេះ។",
            "action": "បន្ថែមថ្មី"
        }
    },
    "messages": {
        "created": "បានបង្កើតដោយជោគជ័យ",
        "updated": "បានកែប្រែដោយជោគជ័យ",
        "deleted": "បានលុបដោយជោគជ័យ",
        "shownOnHomepage": "បានបង្ហាញនៅលើទំព័រដើម",
        "hiddenOnHomepage": "បានលាក់ពីទំព័រដើម"
    }
}
education.update(education_dict)

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated km.json with full Education structure.")
