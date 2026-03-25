import { describe, it, expect } from 'vitest';
import { isActionAllowed, ACTIONS, MODULES, normalizeRole, isSuperAdminRole } from './permissions';

describe('permissions', () => {
    describe('superadmin', () => {
        it('should allow everything', () => {
            expect(isActionAllowed(ACTIONS.CREATE, MODULES.BLOG, 'superadmin')).toBe(true);
            expect(isActionAllowed(ACTIONS.DELETE, MODULES.DATABASE, 'superadmin')).toBe(true);
            expect(isActionAllowed(ACTIONS.DATABASE_ACTIONS, MODULES.DATABASE, 'superadmin')).toBe(true);
        });

        it('should normalize legacy aliases to superadmin', () => {
            expect(normalizeRole('owner')).toBe('superadmin');
            expect(normalizeRole('super_admin')).toBe('superadmin');
            expect(isSuperAdminRole('super-admin')).toBe(true);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.AUDIT, 'Owner')).toBe(true);
        });
    });

    describe('admin', () => {
        it('should allow everything (default systemic)', () => {
            expect(isActionAllowed(ACTIONS.CREATE, MODULES.PROJECTS, 'admin')).toBe(true);
            expect(isActionAllowed(ACTIONS.DELETE, MODULES.USERS, 'admin')).toBe(true);
        });
    });

    describe('editor', () => {
        it('should NOT allow delete', () => {
            expect(isActionAllowed(ACTIONS.DELETE, MODULES.BLOG, 'editor')).toBe(false);
        });

        it('should NOT allow database actions', () => {
            expect(isActionAllowed(ACTIONS.DATABASE_ACTIONS, MODULES.DATABASE, 'editor')).toBe(false);
        });

        it('should NOT allow access to sensitive modules', () => {
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.USERS, 'editor')).toBe(false);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.DATABASE, 'editor')).toBe(false);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.AUDIT, 'editor')).toBe(false);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.SETTINGS, 'editor')).toBe(false);
        });

        it('should allow view/create/edit on content modules', () => {
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.BLOG, 'editor')).toBe(true);
            expect(isActionAllowed(ACTIONS.CREATE, MODULES.PROJECTS, 'editor')).toBe(true);
            expect(isActionAllowed(ACTIONS.EDIT, MODULES.EXPERIENCE, 'editor')).toBe(true);
        });
    });

    describe('pending', () => {
        it('should ONLY allow viewing profile', () => {
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.PROFILE, 'pending')).toBe(true);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.BLOG, 'pending')).toBe(false);
            expect(isActionAllowed(ACTIONS.CREATE, MODULES.PROFILE, 'pending')).toBe(false);
        });
    });

    describe('unauthorized', () => {
        it('should return false for null/unknown roles', () => {
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.BLOG, null)).toBe(false);
            expect(isActionAllowed(ACTIONS.VIEW, MODULES.BLOG, 'visitor')).toBe(false);
        });
    });
});
