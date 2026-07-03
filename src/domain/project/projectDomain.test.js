import { describe, it, expect } from 'vitest';
import { normalizeProject, validateProject } from './projectDomain';

describe('projectDomain', () => {
    describe('normalizeProject', () => {
        it('normalizes standard project data correctly', () => {
            const rawData = {
                titleEn: 'Test Project',
                titleKm: 'គម្រោងសាកល្បង',
                descriptionEn: 'A test project',
                techStack: 'React, Vite, Firebase',
                githubUrl: ' https://github.com/test ',
                status: 'published'
            };

            const result = normalizeProject(rawData);

            expect(result.title.en).toBe('Test Project');
            expect(result.title.km).toBe('គម្រោងសាកល្បង');
            expect(result.techStack).toEqual(['React', 'Vite', 'Firebase']);
            expect(result.githubUrl).toBe('https://github.com/test');
            expect(result.slug).toBe('test-project');
            expect(result.status).toBe('published');
            expect(result.featured).toBe(false);
            expect(result.galleryUrls).toEqual([]);
        });

        it('handles array inputs for techStack and galleryUrls', () => {
            const rawData = {
                titleEn: 'Project 2',
                techStack: ['Node', 'Express', 'Node'], // tests deduplication
                galleryUrls: ['url1', 'url2', '']
            };

            const result = normalizeProject(rawData);

            expect(result.techStack).toEqual(['Node', 'Express']);
            expect(result.galleryUrls).toEqual(['url1', 'url2']);
        });

        it('handles missing fields gracefully', () => {
            const result = normalizeProject({});
            expect(result.title.en).toBe('Untitled Project');
            expect(result.slug).toBe('untitled-project');
            expect(result.techStack).toEqual([]);
        });
        
        it('includes imageUrl if provided', () => {
            const result = normalizeProject({ imageUrl: 'test.png' });
            expect(result.imageUrl).toBe('test.png');
        });
    });

    describe('validateProject', () => {
        it('returns errors if titleEn is missing', () => {
            const errors = validateProject({ title: { km: 'Test' } });
            expect(errors).toEqual({ titleEn: 'English title is required' });
        });

        it('returns null if validation passes', () => {
            const errors = validateProject({ title: { en: 'Test Project' } });
            expect(errors).toBeNull();
        });
    });
});
