import { describe, it, expect } from 'vitest';
import { normalizePost, validatePost } from './blogDomain';

describe('blogDomain', () => {
    describe('normalizePost', () => {
        it('normalizes standard post data correctly', () => {
            const rawData = {
                titleEn: 'Test Post',
                titleKm: 'អត្ថបទសាកល្បង',
                excerptEn: 'A test excerpt',
                contentEn: 'Test content',
                tags: 'React, Vite, Firebase',
                status: 'published',
                views: 5
            };

            const result = normalizePost(rawData);

            expect(result.title.en).toBe('Test Post');
            expect(result.title.km).toBe('អត្ថបទសាកល្បង');
            expect(result.excerpt.en).toBe('A test excerpt');
            expect(result.content.en).toBe('Test content');
            expect(result.tags).toEqual(['React', 'Vite', 'Firebase']);
            expect(result.slug).toBe('test-post');
            expect(result.status).toBe('published');
            expect(result.featured).toBe(false);
            expect(result.views).toBe(5);
        });

        it('handles array inputs for tags', () => {
            const rawData = {
                titleEn: 'Post 2',
                tags: ['Node', 'Express', 'Node'] // tests deduplication
            };

            const result = normalizePost(rawData);

            expect(result.tags).toEqual(['Node', 'Express']);
        });

        it('handles missing fields gracefully', () => {
            const result = normalizePost({});
            expect(result.title.en).toBe('Untitled Post');
            expect(result.slug).toBe('untitled-post');
            expect(result.tags).toEqual([]);
            expect(result.views).toBe(0);
        });
        
        it('includes coverImage if provided', () => {
            const result = normalizePost({ coverImage: 'test.png' });
            expect(result.coverImage).toBe('test.png');
        });
    });

    describe('validatePost', () => {
        it('returns errors if titleEn or contentEn are missing', () => {
            const errors = validatePost({ title: { km: 'Test' }, content: { km: 'Content' } });
            expect(errors).toEqual({ titleEn: 'English title is required', contentEn: 'English content is required' });
        });

        it('returns null if validation passes', () => {
            const errors = validatePost({ title: { en: 'Test Post' }, content: { en: 'Content' } });
            expect(errors).toBeNull();
        });
    });
});
