import { describe, it, expect } from 'vitest';
import { normalizeCertificate, validateCertificate } from './certificateDomain';

describe('certificateDomain', () => {
    describe('normalizeCertificate()', () => {
        it('normalizes fields and derives slug from name', () => {
            const result = normalizeCertificate({
                nameEn: ' CISSP ',
                organization: ' (ISC)2 ',
                issueDate: '2024-01',
                credentialId: ' ABC ',
                url: ' https://x ',
                level: 'ignored'
            });
            expect(result.name).toEqual({ en: 'CISSP', km: '' });
            expect(result.organization).toBe('(ISC)2');
            expect(result.issueDate).toBe('2024-01');
            expect(result.credentialId).toBe('ABC');
            expect(result.url).toBe('https://x');
            expect(result.slug).toBe('cissp');
            expect(result.visible).toBe(true);
        });
    });

    describe('validateCertificate()', () => {
        it('requires English name and organization', () => {
            const errors = validateCertificate({ name: { en: '' }, organization: '' });
            expect(errors).toHaveProperty('nameEn');
            expect(errors).toHaveProperty('organization');
        });

        it('passes when name + organization present', () => {
            expect(validateCertificate({ name: { en: 'CISSP' }, organization: '(ISC)2' })).toBeNull();
        });
    });
});
