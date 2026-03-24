import { describe, it, expect } from 'vitest';
import { normalizePost, validatePost } from './blogDomain';

describe('blogDomain', () => {
    describe('normalizePost()', () => {
        it('should normalize basic blog post data', () => {
            const rawData = {
                title: ' My Post ',
                tags: 'React, Testing, CSS'
            };
            const result = normalizePost(rawData);

            expect(result.title).toEqual({ en: 'My Post', km: '' });
            expect(result.tags).toEqual(['React', 'Testing', 'CSS']);
            expect(result.slug).toBe('my-post');
            expect(result.visible).toBe(true);
            expect(result.featured).toBe(false);
        });

        it('should handle tags array input', () => {
            const rawData = { tags: ['Post', 'Write'] };
            const result = normalizePost(rawData);
            expect(result.tags).toEqual(['Post', 'Write']);
        });

        it('should generate slug if missing', () => {
            const result = normalizePost({ title: 'Blog Entry' });
            expect(result.slug).toBe('blog-entry');
        });

        it('should use provided slug if present', () => {
            const result = normalizePost({ title: 'Entry', slug: 'custom-slug' });
            expect(result.slug).toBe('custom-slug');
        });

        it('should handle boolean fields correctly', () => {
            const result = normalizePost({ visible: false, featured: true });
            expect(result.visible).toBe(false);
            expect(result.featured).toBe(true);
        });

        it('should include coverImage if provided', () => {
            const result = normalizePost({ coverImage: 'http://test.com/blog.jpg' });
            expect(result.coverImage).toBe('http://test.com/blog.jpg');
        });
    });

    describe('validatePost()', () => {
        it('should return null for valid data', () => {
            const errors = validatePost({
                title: { en: 'Valid Blog', km: '' },
                content: { en: 'Some content', km: '' }
            });
            expect(errors).toBeNull();
        });

        it('should return errors for missing required fields', () => {
            const errors = validatePost({
                title: { en: '', km: '' },
                content: { en: '', km: '' }
            });
            expect(errors.titleEn).toBe('English title is required');
            expect(errors.contentEn).toBe('English content is required');
        });

        it('should return error if content is only whitespace', () => {
            const errors = validatePost({
                title: { en: 'A', km: '' },
                content: { en: '   ', km: '' }
            });
            expect(errors.contentEn).toBe('English content is required');
        });
    });
});
