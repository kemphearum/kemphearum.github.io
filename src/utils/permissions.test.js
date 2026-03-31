import { describe, it, expect } from 'vitest';
import { isActionAllowed, ACTIONS, MODULES, normalizeRole, isSuperAdminRole } from './permissions';

describe('permissions', () => {
    describe('superadmin', () => {
        it('should allow everything always', () => {
            expect(isActionAllowed(ACTIONS.CREATE, MODULES.BLOG, 'superadmin')).toBe(true);
            expect(isActionAllowed(ACTIONS.DELETE, MODULES.USERS, 'superadmin')).toBe(true);
            expect(isActionAllowed(ACTIONS.DATABASE_ACTIONS, MODULES.DATABASE, 'superadmin')).toBe(true);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.SETTINGS, 'superadmin')).toBe(true);
        });

        it('should normalize legacy aliases to superadmin', () => {
            expect(normalizeRole('owner')).toBe('superadmin');
            expect(isSuperAdminRole('super-admin')).toBe(true);
        });
    });

    describe('admin', () => {
        it('should allow standard content operations by default', () => {
            expect(isActionAllowed(ACTIONS.CREATE, MODULES.BLOG, 'admin')).toBe(true);
            expect(isActionAllowed(ACTIONS.EDIT, MODULES.PROJECTS, 'admin')).toBe(true);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.ANALYTICS, 'admin')).toBe(true);
        });

        it('should deny protected platform modules (Users, Audit)', () => {
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.USERS, 'admin')).toBe(false);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.AUDIT, 'admin')).toBe(false);
        });

        it('should deny settings by default and deny settings mutations for non-superadmin', () => {
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.SETTINGS, 'admin')).toBe(false);
            expect(isActionAllowed(ACTIONS.EDIT, MODULES.SETTINGS, 'admin')).toBe(false);
        });

        it('should strictly follow dynamic rolePermissions if they exist', () => {
            const rolePermissions = { admin: [MODULES.BLOG, MODULES.MESSAGES] };
            // Blog is in the list
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.BLOG, 'admin', rolePermissions)).toBe(true);
            expect(isActionAllowed(ACTIONS.CREATE, MODULES.BLOG, 'admin', rolePermissions)).toBe(true);
            
            // Projects is NOT in the list
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.PROJECTS, 'admin', rolePermissions)).toBe(false);
            expect(isActionAllowed(ACTIONS.EDIT, MODULES.PROJECTS, 'admin', rolePermissions)).toBe(false);
        });

        it('should always allow profile regardless of config', () => {
            const rolePermissions = { admin: [MODULES.BLOG] };
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.PROFILE, 'admin', rolePermissions)).toBe(true);
        });

        it('should allow settings view when explicitly added to dynamic tabs', () => {
            const rolePermissions = { admin: [MODULES.BLOG, MODULES.SETTINGS] };
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.SETTINGS, 'admin', rolePermissions)).toBe(true);
            expect(isActionAllowed(ACTIONS.EDIT, MODULES.SETTINGS, 'admin', rolePermissions)).toBe(false);
        });

        it('should deny database actions but allow standard database edits (like visits)', () => {
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.DATABASE, 'admin')).toBe(true);
            expect(isActionAllowed(ACTIONS.DATABASE_ACTIONS, MODULES.DATABASE, 'admin')).toBe(false);
        });
    });

    describe('editor', () => {
        it('should allow blog and projects by default but deny others', () => {
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.BLOG, 'editor')).toBe(true);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.PROJECTS, 'editor')).toBe(true);
            
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.EXPERIENCE, 'editor')).toBe(false);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.MESSAGES, 'editor')).toBe(false);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.DATABASE, 'editor')).toBe(false);
        });

        it('should NOT allow delete or database actions even on allowed modules', () => {
            expect(isActionAllowed(ACTIONS.DELETE, MODULES.BLOG, 'editor')).toBe(false);
            expect(isActionAllowed(ACTIONS.DATABASE_ACTIONS, MODULES.BLOG, 'editor')).toBe(false);
        });

        it('should respect dynamic configuration if provided', () => {
            const rolePermissions = { editor: [MODULES.PROJECTS] };
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.PROJECTS, 'editor', rolePermissions)).toBe(true);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.BLOG, 'editor', rolePermissions)).toBe(false);
        });
    });

    describe('pending', () => {
        it('should only allow profile', () => {
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.PROFILE, 'pending')).toBe(true);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.BLOG, 'pending')).toBe(false);
        });
    });

    describe('unauthorized', () => {
        it('should return false for unknown roles', () => {
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.BLOG, 'visitor')).toBe(false);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.BLOG, null)).toBe(false);
        });

        it('should let custom roles inherit base capability even when base tab config is narrower', () => {
            const rolePermissions = {
                admin: [MODULES.BLOG],
                reviewer: {
                    baseRole: 'admin',
                    allowedTabs: [MODULES.PROJECTS]
                }
            };

            expect(isActionAllowed(ACTIONS.VIEW, MODULES.PROJECTS, 'reviewer', rolePermissions)).toBe(true);
            expect(isActionAllowed(ACTIONS.EDIT, MODULES.PROJECTS, 'reviewer', rolePermissions)).toBe(true);
            expect(isActionAllowed(ACTIONS.DATABASE_ACTIONS, MODULES.DATABASE, 'reviewer', rolePermissions)).toBe(false);
        });

        it('should enforce explicit dynamic user actions when provided', () => {
            const rolePermissions = {
                manager: {
                    baseRole: 'admin',
                    allowedTabs: [MODULES.USERS],
                    allowedActions: {
                        [MODULES.USERS]: [ACTIONS.EDIT, ACTIONS.DISABLE]
                    }
                }
            };

            expect(isActionAllowed(ACTIONS.VIEW, MODULES.USERS, 'manager', rolePermissions)).toBe(true);
            expect(isActionAllowed(ACTIONS.EDIT, MODULES.USERS, 'manager', rolePermissions)).toBe(true);
            expect(isActionAllowed(ACTIONS.DISABLE, MODULES.USERS, 'manager', rolePermissions)).toBe(true);
            expect(isActionAllowed(ACTIONS.DELETE, MODULES.USERS, 'manager', rolePermissions)).toBe(false);
        });
    });
});
