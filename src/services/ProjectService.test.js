import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectService from './ProjectService';
import { db } from '../firebase';
import { collection, query, where, getDocs, getCountFromServer, updateDoc, doc, increment } from 'firebase/firestore';
import { validateProject } from '../domain/project/projectDomain';

vi.mock('../domain/project/projectDomain', () => ({
    normalizeProject: vi.fn((data) => data),
    validateProject: vi.fn(() => null)
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

describe('ProjectService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('saveProject', () => {
        it('creates a new project when no id is provided', async () => {
            const formData = {
                titleEn: 'New Project',
                slug: 'new-project'
            };
            
            vi.spyOn(ProjectService, 'fetchProjectBySlug').mockResolvedValue(null);
            vi.spyOn(ProjectService, 'create').mockResolvedValue('new-id');

            const result = await ProjectService.saveProject('admin', formData, 'image.jpg');

            expect(ProjectService.create).toHaveBeenCalled();
            expect(result).toEqual({ isNew: true, id: 'new-id' });
        });

        it('updates an existing project when id is provided', async () => {
            const formData = {
                id: 'existing-id',
                titleEn: 'Existing Project'
            };
            
            vi.spyOn(ProjectService, 'update').mockResolvedValue();

            const result = await ProjectService.saveProject('admin', formData, null);

            expect(ProjectService.update).toHaveBeenCalled();
            expect(result).toEqual({ isNew: false, id: 'existing-id' });
        });

        it('throws an error if validation fails', async () => {
            validateProject.mockReturnValueOnce({ titleEn: 'Error' });
            
            await expect(ProjectService.saveProject('admin', {}, null)).rejects.toThrow(/Validation failed/);
        });
    });

    describe('fetchProjectBySlug', () => {
        it('returns project if found by slug', async () => {
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
            const result = await ProjectService.fetchProjectBySlug('test-slug', trackRead, true);

            expect(trackRead).toHaveBeenCalled();
            expect(result).toEqual({ id: '123', title: { en: 'Test' }, status: 'published' });
        });

        it('falls back to getById if slug query is empty', async () => {
            getDocs.mockResolvedValueOnce({
                empty: true,
                size: 0,
                docs: []
            });
            
            vi.spyOn(ProjectService, 'getById').mockResolvedValueOnce({ status: 'published', title: { en: 'fallback' } });

            const result = await ProjectService.fetchProjectBySlug('fallback', null, true);

            expect(result).toEqual(expect.objectContaining({ status: 'published' }));
        });
    });

    describe('fetchStats', () => {
        it('returns correct stats', async () => {
            getCountFromServer
                .mockResolvedValueOnce({ data: () => ({ count: 10 }) }) // total
                .mockResolvedValueOnce({ data: () => ({ count: 8 }) }) // published
                .mockResolvedValueOnce({ data: () => ({ count: 2 }) }); // featured
                
            vi.spyOn(ProjectService, 'getAll').mockResolvedValueOnce([
                { liveUrl: 'url1' },
                { githubUrl: 'url2' },
                {}
            ]);

            const stats = await ProjectService.fetchStats();

            expect(stats).toEqual({
                total: 10,
                published: 8,
                featured: 2,
                linked: 2
            });
        });
    });

    describe('Visibility & Featured Toggles', () => {
        it('toggles visibility', async () => {
            vi.spyOn(ProjectService, 'update').mockResolvedValue();
            await ProjectService.toggleVisibility('admin', '1', true);
            expect(ProjectService.update).toHaveBeenCalledWith('1', { visible: false }, undefined);
        });

        it('toggles featured', async () => {
            vi.spyOn(ProjectService, 'update').mockResolvedValue();
            await ProjectService.toggleFeatured('admin', '1', false);
            expect(ProjectService.update).toHaveBeenCalledWith('1', { featured: true }, undefined);
        });
    });

    describe('getCategorySuggestions', () => {
        it('returns unique tech stack suggestions from visible projects', async () => {
            vi.spyOn(ProjectService, 'getAll').mockResolvedValue([
                { visible: true, techStack: ['React', 'Firebase'] },
                { visible: true, techStack: 'React, Node' },
                { visible: false, techStack: ['Angular'] },
                { visible: true, techStack: [''] }
            ]);

            const result = await ProjectService.getCategorySuggestions();
            expect(result).toEqual(['Firebase', 'Node', 'React']);
        });
    });
});
