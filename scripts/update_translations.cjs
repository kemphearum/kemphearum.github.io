const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8'));
const km = JSON.parse(fs.readFileSync('src/i18n/km.json', 'utf8'));

// Permissions
const permissionsEN = {
    "title": "Enterprise Permission Matrix",
    "unsavedChanges": "Unsaved changes",
    "resetDefault": "Reset Default",
    "saveChanges": "Save Changes",
    "resetConfirm": "Are you sure you want to reset this role to its default permissions? All unsaved changes will be lost.",
    "copyConfirm": "Are you sure you want to copy permissions from {{source}}? This will overwrite your current unsaved changes for {{target}}.",
    "discardConfirm": "You have unsaved changes. Discard and switch roles?",
    "copyFrom": "Copy from...",
    "filterFeatures": "Filter features...",
    "unauthorizedTitle": "Unauthorized",
    "unauthorizedDesc": "Only superadministrators can modify the system Permission Matrix.",
    "featureModule": "Feature Module",
    "modules": "Modules",
    "addRole": "+ Add Role",
    "addRolePrompt": "Enter new role name (e.g. moderator, guest):",
    "addRoleError": "Role name must be lowercase and contain no spaces.",
    "roleExists": "Role already exists.",
    "saveSuccess": "Permissions for {{role}} saved.",
    "saveError": "Failed to save permissions",
    "matrix": {
        "view": "View",
        "create": "Create",
        "edit": "Edit",
        "delete": "Delete",
        "publish": "Publish",
        "archive": "Archive",
        "export": "Export",
        "configure": "Configure",
        "view_history": "View History",
        "approve": "Approve",
        "restore": "Restore",
        "import": "Import",
        "manage": "Manage"
    }
};

const permissionsKM = {
    "title": "ម៉ាទ្រីសការអនុញ្ញាតសហគ្រាស",
    "unsavedChanges": "ការផ្លាស់ប្តូរដែលមិនបានរក្សាទុក",
    "resetDefault": "កំណត់ទៅលំនាំដើម",
    "saveChanges": "រក្សាទុក",
    "resetConfirm": "តើអ្នកប្រាកដជាចង់កំណត់តួនាទីនេះទៅការអនុញ្ញាតលំនាំដើមរបស់វាវិញទេ? ការផ្លាស់ប្តូរដែលមិនបានរក្សាទុកទាំងអស់នឹងបាត់បង់។",
    "copyConfirm": "តើអ្នកប្រាកដជាចង់ចម្លងការអនុញ្ញាតពី {{source}} ទេ? វានឹងជំនួសការផ្លាស់ប្តូរដែលមិនបានរក្សាទុកបច្ចុប្បន្នរបស់អ្នកសម្រាប់ {{target}}។",
    "discardConfirm": "អ្នកមានការផ្លាស់ប្តូរដែលមិនបានរក្សាទុក។ បោះបង់ និងប្តូរតួនាទី?",
    "copyFrom": "ចម្លងពី...",
    "filterFeatures": "ចម្រោះលក្ខណៈពិសេស...",
    "unauthorizedTitle": "មិនមានការអនុញ្ញាត",
    "unauthorizedDesc": "មានតែអភិបាលកំពូលប៉ុណ្ណោះដែលអាចកែប្រែម៉ាទ្រីសការអនុញ្ញាតប្រព័ន្ធបាន។",
    "featureModule": "ម៉ូឌុលលក្ខណៈពិសេស",
    "modules": "ម៉ូឌុល",
    "addRole": "+ បន្ថែមតួនាទី",
    "addRolePrompt": "បញ្ចូលឈ្មោះតួនាទីថ្មី (ឧទាហរណ៍៖ moderator, guest)៖",
    "addRoleError": "ឈ្មោះតួនាទីត្រូវតែជាអក្សរតូច និងមិនមានដកឃ្លា។",
    "roleExists": "តួនាទីមានរួចហើយ។",
    "saveSuccess": "ការអនុញ្ញាតសម្រាប់ {{role}} ត្រូវបានរក្សាទុក។",
    "saveError": "បរាជ័យក្នុងការរក្សាទុកការអនុញ្ញាត",
    "matrix": {
        "view": "មើល",
        "create": "បង្កើត",
        "edit": "កែសម្រួល",
        "delete": "លុប",
        "publish": "បោះពុម្ព",
        "archive": "ទុកក្នុងប័ណ្ណសារ",
        "export": "នាំចេញ",
        "configure": "កំណត់រចនាសម្ព័ន្ធ",
        "view_history": "មើលប្រវត្តិ",
        "approve": "អនុម័ត",
        "restore": "ស្តារ",
        "import": "នាំចូល",
        "manage": "គ្រប់គ្រង"
    }
};

// Roles
const rolesEN = {
    "title": "System Roles",
    "archNote": "Architecture Note:",
    "archDesc": "The system supports extending base roles with custom permissions via the Permission Matrix. The roles below are the default System Roles.",
    "users": "Users",
    "admin": {
        "name": "Administrator",
        "description": "Full access to all system features including database management, audit logs, and authentication settings. Cannot perform super-admin specific destructive actions."
    },
    "editor": {
        "name": "Editor",
        "description": "Can manage all content across the application (projects, blog, experience, etc.) but cannot access system settings, database management, or user authentication panels."
    },
    "author": {
        "name": "Author",
        "description": "Can create and edit their own content, but may be restricted from publishing or editing other users' content. (Customizable via Permissions Matrix)"
    },
    "viewer": {
        "name": "Viewer",
        "description": "Read-only access to the admin dashboard and content modules. Cannot create, edit, or delete data."
    }
};

const rolesKM = {
    "title": "តួនាទីប្រព័ន្ធ",
    "archNote": "កំណត់សម្គាល់ស្ថាបត្យកម្ម៖",
    "archDesc": "ប្រព័ន្ធគាំទ្រការពង្រីកតួនាទីមូលដ្ឋានជាមួយនឹងការអនុញ្ញាតផ្ទាល់ខ្លួនតាមរយៈម៉ាទ្រីសការអនុញ្ញាត។ តួនាទីខាងក្រោមគឺជាតួនាទីប្រព័ន្ធលំនាំដើម។",
    "users": "អ្នកប្រើប្រាស់",
    "admin": {
        "name": "អ្នកគ្រប់គ្រង",
        "description": "មានសិទ្ធិចូលដំណើរការគ្រប់លក្ខណៈពិសេសប្រព័ន្ធ រួមទាំងការគ្រប់គ្រងមូលដ្ឋានទិន្នន័យ កំណត់ហេតុសវនកម្ម និងការកំណត់ការផ្ទៀងផ្ទាត់។ មិនអាចអនុវត្តសកម្មភាពបំផ្លិចបំផ្លាញជាក់លាក់របស់អភិបាលកំពូលបានទេ។"
    },
    "editor": {
        "name": "អ្នកកែសម្រួល",
        "description": "អាចគ្រប់គ្រងមាតិកាទាំងអស់នៅលើកម្មវិធី (គម្រោង, ប្លុក, បទពិសោធន៍ ជាដើម) ប៉ុន្តែមិនអាចចូលដំណើរការការកំណត់ប្រព័ន្ធ ការគ្រប់គ្រងមូលដ្ឋានទិន្នន័យ ឬផ្ទាំងការផ្ទៀងផ្ទាត់អ្នកប្រើប្រាស់បានទេ។"
    },
    "author": {
        "name": "អ្នកនិពន្ធ",
        "description": "អាចបង្កើត និងកែសម្រួលមាតិការបស់ពួកគេផ្ទាល់ ប៉ុន្តែប្រហែលជាត្រូវបានរឹតត្បិតពីការបោះពុម្ព ឬកែសម្រួលមាតិការបស់អ្នកប្រើផ្សេងទៀត។ (អាចប្ដូរតាមបំណងតាមរយៈម៉ាទ្រីសការអនុញ្ញាត)"
    },
    "viewer": {
        "name": "អ្នកទស្សនា",
        "description": "មានសិទ្ធិត្រឹមតែអានផ្ទាំងគ្រប់គ្រងអភិបាល និងម៉ូឌុលមាតិកា។ មិនអាចបង្កើត កែសម្រួល ឬលុបទិន្នន័យបានទេ។"
    }
};

if (!en.admin.auth) en.admin.auth = {};
if (!km.admin.auth) km.admin.auth = {};

en.admin.auth.permissions = permissionsEN;
km.admin.auth.permissions = permissionsKM;

en.admin.auth.roles = rolesEN;
km.admin.auth.roles = rolesKM;

fs.writeFileSync('src/i18n/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('src/i18n/km.json', JSON.stringify(km, null, 2));

console.log("Translations updated");
