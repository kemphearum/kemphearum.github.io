import { describe, it, expect, vi, beforeEach } from 'vitest';
import BlogService from './BlogService';
import { db } from '../firebase';
import { collection, query, where, getDocs, getCountFromServer, updateDoc, doc, increment } from 'firebase/firestore';
import { validatePost } from '../domain/blog/blogDomain';

vi.mock('../domain/blog/blogDomain', () => ({
    normalizePost: vi.fn((data) => data),
    validatePost: vi.fn(() => null)
}));

vi.mock('../firebase', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    getCountFromServer: vi.fn(),
    increment: vi.fn(),
    serverTimestamp: vi.fn(() => 'timestamp'),
}));

describe('BlogService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('savePost', () => {
        it('creates a new post when no id is provided', async () => {
            const formData = {
                titleEn: 'New Post',
                contentEn: 'Content',
                slug: 'new-post'
            };
            
            vi.spyOn(BlogService, 'fetchPostBySlug').mockResolvedValue(null);
            vi.spyOn(BlogService, 'create').mockResolvedValue('new-id');

            const result = await BlogService.savePost('admin', formData);

            expect(BlogService.create).toHaveBeenCalled();
            expect(result).toEqual({ isNew: true, id: 'new-id' });
        });

        it('updates an existing post when id is provided', async () => {
            const formData = {
                id: 'existing-id',
                titleEn: 'Existing Post',
                contentEn: 'Content'
            };
            
            vi.spyOn(BlogService, 'update').mockResolvedValue();

            const result = await BlogService.savePost('admin', formData);

            expect(BlogService.update).toHaveBeenCalled();
            expect(result).toEqual({ isNew: false, id: 'existing-id' });
        });

        it('throws an error if validation fails', async () => {
            validatePost.mockReturnValueOnce({ titleEn: 'Error' });
            
            await expect(BlogService.savePost('admin', {})).rejects.toThrow(/Validation failed/);
        });
    });

    describe('fetchPostBySlug', () => {
        it('returns post if found by slug', async () => {
            const mockDoc = {
                id: '123',
                data: () => ({ title: { en: 'Test' }, status: 'published' })
            };
            getDocs.mockResolvedValueOnce({
                empty: false,
                size: 1,
                docs: [mockDoc]
            });
            
            const trackRead = vi.fn();
            const result = await BlogService.fetchPostBySlug('test-slug', trackRead, true);

            expect(trackRead).toHaveBeenCalled();
            expect(result).toEqual({ id: '123', title: { en: 'Test' }, status: 'published' });
        });

        it('falls back to getById if slug query is empty', async () => {
            getDocs.mockResolvedValueOnce({
                empty: true,
                size: 0,
                docs: []
            });
            
            vi.spyOn(BlogService, 'getById').mockResolvedValueOnce({ status: 'published', title: { en: 'fallback' } });

            const result = await BlogService.fetchPostBySlug('fallback', null, true);

            expect(result).toEqual(expect.objectContaining({ status: 'published' }));
        });
    });

    describe('fetchStats', () => {
        it('returns correct stats', async () => {
            getCountFromServer
                .mockResolvedValueOnce({ data: () => ({ count: 10 }) }) // total
                .mockResolvedValueOnce({ data: () => ({ count: 8 }) }) // published
                .mockResolvedValueOnce({ data: () => ({ count: 2 }) }); // featured
                
            const stats = await BlogService.fetchStats();

            expect(stats).toEqual({
                total: 10,
                published: 8,
                featured: 2,
                drafts: 2 // 10 - 8
            });
        });
    });

    describe('Visibility & Featured Toggles', () => {
        it('toggles visibility', async () => {
            vi.spyOn(BlogService, 'update').mockResolvedValue();
            await BlogService.toggleVisibility('admin', '1', true);
            expect(BlogService.update).toHaveBeenCalledWith('1', { visible: false }, undefined);
        });

        it('toggles featured', async () => {
            vi.spyOn(BlogService, 'update').mockResolvedValue();
            await BlogService.toggleFeatured('admin', '1', false);
            expect(BlogService.update).toHaveBeenCalledWith('1', { featured: true }, undefined);
        });
    });

    describe('getTagSuggestions', () => {
        it('returns unique tags from visible posts', async () => {
            vi.spyOn(BlogService, 'getAll').mockResolvedValue([
                { visible: true, tags: ['React', 'Firebase'] },
                { visible: true, tags: 'React, Node' },
                { visible: false, tags: ['Angular'] },
                { visible: true, tags: [''] }
            ]);

            const result = await BlogService.getTagSuggestions();
            expect(result).toEqual(['Firebase', 'Node', 'React']);
        });
    });

    describe('incrementViewCount', () => {
        it('increments views in firestore', async () => {
            await BlogService.incrementViewCount('test-id');
            expect(doc).toHaveBeenCalledWith(db, 'posts', 'test-id');
            expect(updateDoc).toHaveBeenCalled();
            expect(increment).toHaveBeenCalledWith(1);
        });
    });
});
