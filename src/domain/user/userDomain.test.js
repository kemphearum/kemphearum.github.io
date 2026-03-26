import { describe, it, expect } from 'vitest';
import { normalizeUser, validateUser } from './userDomain';

describe('userDomain', () => {
    describe('normalizeUser()', () => {
        it('should normalize basic user data', () => {
            const rawData = {
                email: ' TEST@Example.com ',
                role: 'ADMIN',
                displayName: ' John Doe '
            };
            const result = normalizeUser(rawData);

            expect(result.email).toBe('test@example.com');
            expect(result.role).toBe('admin');
            expect(result.displayName).toBe('John Doe');
            expect(result.isActive).toBe(true);
        });

        it('should default role to pending if missing', () => {
            const result = normalizeUser({ email: 'a@b.com' });
            expect(result.role).toBe('pending');
        });

        it('should handle isActive correctly', () => {
            const result = normalizeUser({ isActive: false });
            expect(result.isActive).toBe(false);
        });
    });

    describe('validateUser()', () => {
        it('should return null for valid data', () => {
            const errors = validateUser({ email: 'test@example.com', role: 'admin' });
            expect(errors).toBeNull();
        });

        it('should return error for missing email', () => {
            const errors = validateUser({ email: '', role: 'admin' });
            expect(errors.email).toBe('Email is required');
        });

        it('should return error for invalid email format', () => {
            const errors = validateUser({ email: 'invalid-email', role: 'admin' });
            expect(errors.email).toBe('Invalid email format');
        });

        it('should return error for missing role', () => {
            const errors = validateUser({ email: 'test@example.com', role: '' });
            expect(errors.role).toBe('Role is required');
        });
    });
});
