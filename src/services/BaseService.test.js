import { describe, it, expect, vi, beforeEach } from 'vitest';
import BaseService from './BaseService';
import { 
    getDocs, getDoc, collection, doc, query, orderBy, addDoc, updateDoc, deleteDoc
} from 'firebase/firestore';

// Mock dependencies
vi.mock('../firebase', () => ({
    db: { type: 'mocked-db' },
    auth: { currentUser: { email: 'test@example.com' } }
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
    orderBy: vi.fn(),
    serverTimestamp: vi.fn(() => 'mocked-timestamp'),
    where: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn()
}));

describe('BaseService.safe()', () => {
    it('should return data and null error on success', async () => {
        const mockData = { id: '1', title: 'Test' };
        const mockFn = vi.fn().mockResolvedValue(mockData);

        const result = await BaseService.safe(mockFn);

        expect(result).toEqual({ data: mockData, error: null });
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should return null data and error message on failure', async () => {
        const errorMessage = 'Database connection failed';
        const mockFn = vi.fn().mockRejectedValue(new Error(errorMessage));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await BaseService.safe(mockFn);

        expect(result).toEqual({ data: null, error: errorMessage });
        expect(consoleSpy).toHaveBeenCalledWith('[ServiceError]', expect.any(Error));
        
        consoleSpy.mockRestore();
    });

    it('should return a default error message if error has no message', async () => {
        const mockFn = vi.fn().mockRejectedValue({});

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await BaseService.safe(mockFn);

        expect(result).toEqual({ data: null, error: 'An unexpected error occurred' });
        
        consoleSpy.mockRestore();
    });
});

describe('BaseService instance methods', () => {
    let service;
    const collectionName = 'test-collection';

    beforeEach(() => {
        vi.clearAllMocks();
        service = new BaseService(collectionName);
    });

    describe('getAll()', () => {
        it('should fetch all documents with sorting', async () => {
            const mockDocs = [
                { id: '1', data: () => ({ name: 'First' }) },
                { id: '2', data: () => ({ name: 'Second' }) }
            ];
            const mockSnapshot = { docs: mockDocs, size: 2 };
            getDocs.mockResolvedValue(mockSnapshot);

            const result = await service.getAll('name', 'asc');

            expect(result).toEqual([
                { id: '1', name: 'First' },
                { id: '2', name: 'Second' }
            ]);
            expect(getDocs).toHaveBeenCalled();
        });

        it('should call trackRead if provided', async () => {
            const mockSnapshot = { docs: [], size: 0 };
            getDocs.mockResolvedValue(mockSnapshot);
            const trackRead = vi.fn();

            await service.getAll(null, 'desc', trackRead);

            expect(trackRead).toHaveBeenCalledWith(0, expect.any(String), expect.any(Object));
        });
    });

    describe('getById()', () => {
        it('should return document data if it exists', async () => {
            const mockData = { name: 'Identified Item' };
            const mockSnapshot = { 
                exists: () => true, 
                id: 'unique-id', 
                data: () => mockData 
            };
            getDoc.mockResolvedValue(mockSnapshot);

            const result = await service.getById('unique-id');

            expect(result).toEqual({ id: 'unique-id', ...mockData });
            expect(doc).toHaveBeenCalled();
            expect(getDoc).toHaveBeenCalled();
        });

        it('should return null if document does not exist', async () => {
            const mockSnapshot = { exists: () => false };
            getDoc.mockResolvedValue(mockSnapshot);

            const result = await service.getById('invalid-id');

            expect(result).toBeNull();
        });
    });

    describe('create()', () => {
        it('should create a new document and save history', async () => {
            const mockData = { title: 'New Item' };
            addDoc.mockResolvedValue({ id: 'new-doc-id' });

            const result = await service.create(mockData);

            expect(result).toBe('new-doc-id');
            expect(addDoc).toHaveBeenCalled(); // One for the doc, one for history if enabled
        });

        it('should call trackWrite if provided', async () => {
            addDoc.mockResolvedValue({ id: 'id' });
            const trackWrite = vi.fn();

            await service.create({ title: 'T' }, trackWrite);

            expect(trackWrite).toHaveBeenCalledWith(1, expect.any(String), expect.any(Object));
        });
    });

    describe('update()', () => {
        it('should update an existing document', async () => {
            const mockData = { title: 'Updated' };
            
            // Mock getById for history tracking
            getDoc.mockResolvedValue({ exists: () => true, id: 'id', data: () => ({}) });
            updateDoc.mockResolvedValue(true);

            const result = await service.update('id', mockData);

            expect(result).toBe(true);
            expect(updateDoc).toHaveBeenCalled();
        });
    });

    describe('delete()', () => {
        it('should delete a document', async () => {
            deleteDoc.mockResolvedValue(true);

            const result = await service.delete('id');

            expect(result).toBe(true);
            expect(deleteDoc).toHaveBeenCalled();
        });
    });
});
