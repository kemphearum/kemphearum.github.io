const fs = require('fs');

const updateJson = (file, additions) => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    const merge = (target, source) => {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && key in target) {
                Object.assign(source[key], merge(target[key], source[key]));
            }
        }
        Object.assign(target || {}, source);
        return target;
    };

    merge(data, additions);
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
};

const enAdditions = {
    admin: {
        auth: {
            overview: {
                title: 'User Base Overview',
                totalUsers: 'Total Users',
                activeUsers: 'Active Users',
                disabledUsers: 'Disabled Users',
                rolesTitle: 'Role Distribution',
                administrators: 'Administrators',
                editors: 'Editors',
                authors: 'Authors',
                viewers: 'Viewers',
                authProvider: 'Provider',
                currentUser: 'Account',
                currentRole: 'Active Role',
                emailStatus: 'Verification',
                verified: 'Verified',
                unverified: 'Unverified',
                lastLogin: 'Last Login',
                authStatus: 'Status',
                active: 'ACTIVE'
            }
        }
    }
};

const kmAdditions = {
    admin: {
        auth: {
            overview: {
                title: 'ទិដ្ឋភាពទូទៅនៃអ្នកប្រើប្រាស់',
                totalUsers: 'អ្នកប្រើប្រាស់សរុប',
                activeUsers: 'អ្នកប្រើប្រាស់សកម្ម',
                disabledUsers: 'អ្នកប្រើប្រាស់ដែលបានបិទ',
                rolesTitle: 'ការបែងចែកតួនាទី',
                administrators: 'អ្នកគ្រប់គ្រង',
                editors: 'អ្នកកែសម្រួល',
                authors: 'អ្នកនិពន្ធ',
                viewers: 'អ្នកមើល',
                authProvider: 'អ្នកផ្តល់សេវា',
                currentUser: 'គណនី',
                currentRole: 'តួនាទីសកម្ម',
                emailStatus: 'ការផ្ទៀងផ្ទាត់',
                verified: 'បានផ្ទៀងផ្ទាត់',
                unverified: 'មិនទាន់ផ្ទៀងផ្ទាត់',
                lastLogin: 'ចូលប្រើចុងក្រោយ',
                authStatus: 'ស្ថានភាព',
                active: 'សកម្ម'
            }
        }
    }
};

updateJson('src/i18n/en.json', enAdditions);
updateJson('src/i18n/km.json', kmAdditions);
console.log('Updated overview translations successfully.');
