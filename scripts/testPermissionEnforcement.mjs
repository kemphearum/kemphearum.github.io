import PermissionService from '../src/services/auth/PermissionService.js';
import { listFeatures } from '../src/registry/featureRegistry.js';

function runTests() {
    console.log('Starting PermissionService Enforcement Testing...');
    
    const roles = ['superadmin', 'admin', 'editor', 'author', 'viewer'];
    let passed = 0;
    let failed = 0;
    
    // Mock user objects
    const users = {
        'superadmin': { role: 'superadmin', rolePermissions: {} },
        'admin': { role: 'admin', rolePermissions: {} },
        'editor': { role: 'editor', rolePermissions: {} },
        'author': { role: 'author', rolePermissions: {} },
        'viewer': { role: 'viewer', rolePermissions: {} }
    };
    
    for (const feature of listFeatures()) {
        const moduleId = feature.id;
        if (!feature.permissions || !feature.permissions.supportedActions) continue;
        
        for (const action of feature.permissions.supportedActions) {
            for (const role of roles) {
                const user = users[role];
                
                // Determine expected result
                let expected = false;
                if (role === 'superadmin') {
                    expected = true;
                } else if (feature.permissions.defaultPermissions && feature.permissions.defaultPermissions[role]) {
                    expected = feature.permissions.defaultPermissions[role].includes(action);
                }
                
                // Actual result
                const actual = PermissionService.can(user, action, moduleId);
                
                if (actual === expected) {
                    passed++;
                } else {
                    failed++;
                    console.error(`❌ [FAILED] Role: ${role}, Module: ${moduleId}, Action: ${action} - Expected: ${expected}, Actual: ${actual}`);
                }
            }
        }
    }
    
    console.log(`\nResults: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
