import { describe, it, expect } from 'vitest';
import { listContentTypes, getContentType, isContentType } from './contentTypeRegistry';
import { NAV_GROUPS, getNavItem } from './navRegistry';

describe('contentTypeRegistry', () => {
    it('registers the core content types', () => {
        const keys = listContentTypes().map((t) => t.key);
        expect(keys).toEqual(expect.arrayContaining(['projects', 'blog', 'experience']));
    });

    it('resolves a descriptor with the required fields', () => {
        const blog = getContentType('blog');
        expect(blog).toMatchObject({ key: 'blog', module: 'blog', navGroup: 'site_content', labelKey: 'admin.tabs.blog' });
        expect(typeof blog.load).toBe('function');
        expect(blog.icon).toBeTruthy();
    });

    it('distinguishes content types from special tabs', () => {
        expect(isContentType('blog')).toBe(true);
        expect(isContentType('projects')).toBe(true);
        expect(isContentType('dashboard')).toBe(false);
        expect(isContentType('settings')).toBe(false);
    });

    it('returns null for unknown keys', () => {
        expect(getContentType('nope')).toBeNull();
    });
});

describe('navRegistry', () => {
    it('resolves special tabs', () => {
        const dashboard = getNavItem('dashboard');
        expect(dashboard).toMatchObject({ key: 'dashboard', labelKey: 'admin.tabs.dashboard' });
        expect(dashboard.icon).toBeTruthy();
    });

    it('resolves content-type tabs from the content registry', () => {
        const blog = getNavItem('blog');
        expect(blog).toMatchObject({ key: 'blog', labelKey: 'admin.tabs.blog' });
        expect(blog.icon).toBeTruthy();
    });

    it('flags the messages badge binding', () => {
        expect(getNavItem('messages').badgeKey).toBe('unreadMessagesCount');
    });

    it('returns null for unknown keys', () => {
        expect(getNavItem('nope')).toBeNull();
    });

    it('every nav group key resolves', () => {
        NAV_GROUPS.forEach((group) => {
            group.keys.forEach((key) => {
                expect(getNavItem(key), `nav key "${key}"`).not.toBeNull();
            });
        });
    });
});
