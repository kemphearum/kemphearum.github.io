import json
import os

filepath = 'src/i18n/km.json'

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Ensure admin.awards
awards = data.setdefault('admin', {}).setdefault('awards', {})
awards_dict = {
    "workspace": {
        "eyebrow": "ពានរង្វាន់",
        "title": "កន្លែងគ្រប់គ្រងពានរង្វាន់",
        "description": "គ្រប់គ្រងពានរង្វាន់និងការទទួលស្គាល់របស់អ្នក។"
    },
    "toolbar": {
        "search": "ស្វែងរកពានរង្វាន់...",
        "add": "បន្ថែមពានរង្វាន់"
    },
    "stats": {
        "total": {
            "label": "ពានរង្វាន់សរុប",
            "hint": "ទាំងអស់"
        }
    },
    "form": {
        "languages": {
            "en": "អង់គ្លេស",
            "km": "ខ្មែរ"
        },
        "sections": {
            "details": "ព័ត៌មានលម្អិត"
        },
        "fields": {
            "title": "ចំណងជើង",
            "titleRequired": "តម្រូវឱ្យមានចំណងជើង",
            "titlePlaceholder": "ឧ. Best Security Policy",
            "organization": "ស្ថាប័ន",
            "organizationPlaceholder": "ឧ. ISC2",
            "description": "ការពិពណ៌នា",
            "descriptionPlaceholder": "ការពិពណ៌នាខ្លី (ស្រេចចិត្ត)",
            "issueDate": "កាលបរិច្ឆេទចេញ",
            "link": "តំណផ្ទៀងផ្ទាត់"
        },
        "hints": {
            "visible": "អាចមើលឃើញ",
            "featured": "លេចធ្លោ"
        }
    },
    "dialogs": {
        "createTitle": "បន្ថែមពានរង្វាន់",
        "editTitle": "កែប្រែពានរង្វាន់",
        "deleteTitle": "លុបឬ?",
        "deleteMessage": "តើអ្នកប្រាកដថាចង់លុបឬទេ?",
        "deleteManyTitle": "លុបឬ?",
        "deleteManyMessage": "តើអ្នកប្រាកដថាចង់លុបទាំងនេះឬទេ?"
    },
    "table": {
        "untitled": "គ្មានចំណងជើង",
        "columns": {
            "title": "ចំណងជើង"
        },
        "empty": {
            "title": "មិនទាន់មានពានរង្វាន់",
            "description": "បន្ថែមពានរង្វាន់ដំបូងរបស់អ្នក។",
            "action": "បន្ថែមពានរង្វាន់"
        }
    },
    "bulk": {
        "selected": "បានជ្រើស",
        "showSelected": "បង្ហាញដែលជ្រើស",
        "hideSelected": "លាក់ដែលជ្រើស",
        "featureSelected": "ដាក់លេចធ្លោ",
        "unfeatureSelected": "ដកលេចធ្លោ",
        "deleteSelected": "លុបដែលជ្រើស"
    },
    "messages": {
        "created": "បានបង្កើត",
        "updated": "បានកែប្រែ",
        "deleted": "បានលុប",
        "deletedMany": "បានលុបច្រើន",
        "shown": "កំពុងបង្ហាញ",
        "shownMany": "បានបង្ហាញច្រើន",
        "hidden": "បានលាក់",
        "hiddenMany": "បានលាក់ច្រើន",
        "featured": "បានដាក់លេចធ្លោ",
        "featuredMany": "បានដាក់លេចធ្លោច្រើន",
        "unfeatured": "បានដកលេចធ្លោ",
        "unfeaturedMany": "បានដកលេចធ្លោច្រើន"
    }
}
awards.update(awards_dict)

# Ensure admin.publications
publications = data.setdefault('admin', {}).setdefault('publications', {})
publications_dict = {
    "workspace": {
        "eyebrow": "ការបោះពុម្ពផ្សាយ",
        "title": "កន្លែងគ្រប់គ្រងការបោះពុម្ពផ្សាយ",
        "description": "គ្រប់គ្រងអត្ថបទបោះពុម្ពរបស់អ្នក។"
    },
    "toolbar": {
        "search": "ស្វែងរកការបោះពុម្ពផ្សាយ...",
        "add": "បន្ថែមការបោះពុម្ពផ្សាយ"
    },
    "stats": {
        "total": {
            "label": "ការបោះពុម្ពសរុប",
            "hint": "ទាំងអស់"
        }
    },
    "form": {
        "languages": {
            "en": "អង់គ្លេស",
            "km": "ខ្មែរ"
        },
        "sections": {
            "details": "ព័ត៌មានលម្អិត"
        },
        "fields": {
            "title": "ចំណងជើង",
            "titleRequired": "តម្រូវឱ្យមានចំណងជើង",
            "titlePlaceholder": "ឧ. Guide to ISO 27001",
            "publisher": "អ្នកបោះពុម្ពផ្សាយ",
            "publisherPlaceholder": "ឧ. ISACA Journal",
            "description": "ការពិពណ៌នា",
            "descriptionPlaceholder": "សេចក្តីសង្ខេបនៃការបោះពុម្ពផ្សាយ...",
            "publishDate": "កាលបរិច្ឆេទបោះពុម្ព",
            "link": "តំណផ្ទៀងផ្ទាត់"
        },
        "hints": {
            "visible": "អាចមើលឃើញ",
            "featured": "លេចធ្លោ"
        }
    },
    "dialogs": {
        "createTitle": "បន្ថែមការបោះពុម្ពផ្សាយ",
        "editTitle": "កែប្រែការបោះពុម្ពផ្សាយ",
        "deleteTitle": "លុបឬ?",
        "deleteMessage": "តើអ្នកប្រាកដថាចង់លុបឬទេ?",
        "deleteManyTitle": "លុបឬ?",
        "deleteManyMessage": "តើអ្នកប្រាកដថាចង់លុបទាំងនេះឬទេ?"
    },
    "table": {
        "untitled": "គ្មានចំណងជើង",
        "columns": {
            "title": "ចំណងជើង"
        },
        "empty": {
            "title": "មិនទាន់មានការបោះពុម្ពផ្សាយ",
            "description": "បន្ថែមការបោះពុម្ពផ្សាយដំបូងរបស់អ្នក។",
            "action": "បន្ថែមការបោះពុម្ពផ្សាយ"
        }
    },
    "bulk": {
        "selected": "បានជ្រើស",
        "showSelected": "បង្ហាញដែលជ្រើស",
        "hideSelected": "លាក់ដែលជ្រើស",
        "featureSelected": "ដាក់លេចធ្លោ",
        "unfeatureSelected": "ដកលេចធ្លោ",
        "deleteSelected": "លុបដែលជ្រើស"
    },
    "messages": {
        "created": "បានបង្កើត",
        "updated": "បានកែប្រែ",
        "deleted": "បានលុប",
        "deletedMany": "បានលុបច្រើន",
        "shown": "កំពុងបង្ហាញ",
        "shownMany": "បានបង្ហាញច្រើន",
        "hidden": "បានលាក់",
        "hiddenMany": "បានលាក់ច្រើន",
        "featured": "បានដាក់លេចធ្លោ",
        "featuredMany": "បានដាក់លេចធ្លោច្រើន",
        "unfeatured": "បានដកលេចធ្លោ",
        "unfeaturedMany": "បានដកលេចធ្លោច្រើន"
    }
}
publications.update(publications_dict)

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated km.json with full Awards and Publications structure.")
