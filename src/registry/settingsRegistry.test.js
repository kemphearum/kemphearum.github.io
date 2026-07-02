import { describe, it, expect } from 'vitest';
import { listSettingsSections } from './settingsRegistry';

describe('settingsRegistry', () => {
    it('registers the domain sections with uniform shape', () => {
        const ids = listSettingsSections().map((section) => section.id);
        expect(ids).toEqual(expect.arrayContaining(['seo', 'featureFlags']));
    });

    it('each section exposes a component + i18n keys + icon', () => {
        listSettingsSections().forEach((section) => {
            expect(section.component).toBeTruthy();
            expect(['function', 'object']).toContain(typeof section.component);
            expect(section.labelKey).toMatch(/^admin\.settings\.subTabs\./);
            expect(section.descriptionKey).toBeTruthy();
            expect(section.icon).toBeTruthy();
        });
    });
});
