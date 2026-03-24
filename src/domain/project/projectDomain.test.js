import { describe, it, expect } from 'vitest';
import { normalizeProject, validateProject } from './projectDomain';

describe('projectDomain', () => {
    describe('normalizeProject()', () => {
        it('should normalize basic project data', () => {
            const rawData = {
                title: ' My Project ',
                techStack: 'React, Vitest, CSS'
            };
            const result = normalizeProject(rawData);

            expect(result.title).toBe('My Project');
            expect(result.techStack).toEqual(['React', 'Vitest', 'CSS']);
            expect(result.slug).toBe('my-project');
            expect(result.visible).toBe(true);
            expect(result.featured).toBe(false);
        });

        it('should handle techStack array input', () => {
            const rawData = { techStack: ['JavaScript', 'HTML'] };
            const result = normalizeProject(rawData);
            expect(result.techStack).toEqual(['JavaScript', 'HTML']);
        });

        it('should generate slug if missing', () => {
            const result = normalizeProject({ title: 'Hello World' });
            expect(result.slug).toBe('hello-world');
        });

        it('should use provided slug if present', () => {
            const result = normalizeProject({ title: 'A', slug: 'custom-slug' });
            expect(result.slug).toBe('custom-slug');
        });

        it('should handle boolean fields correctly', () => {
            const result = normalizeProject({ visible: false, featured: true });
            expect(result.visible).toBe(false);
            expect(result.featured).toBe(true);
        });

        it('should include imageUrl if provided', () => {
            const result = normalizeProject({ imageUrl: 'http://test.com/img.jpg' });
            expect(result.imageUrl).toBe('http://test.com/img.jpg');
        });
    });

    describe('validateProject()', () => {
        it('should return null for valid data', () => {
            const errors = validateProject({ title: 'Valid Project' });
            expect(errors).toBeNull();
        });

        it('should return error if title is missing', () => {
            const errors = validateProject({ title: '' });
            expect(errors.title).toBe('Title is required');
        });

        it('should return error if title is only whitespace', () => {
            const errors = validateProject({ title: '   ' });
            expect(errors.title).toBe('Title is required');
        });
    });
});
