import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
    rateDocs: new Map(),
    messageAdds: [],
}));

const firestoreMock = vi.hoisted(() => ({
    runTransaction: vi.fn(async (runner) => {
        const tx = {
            get: vi.fn(async (docRef) => ({
                exists: mockState.rateDocs.has(docRef.id),
                data: () => mockState.rateDocs.get(docRef.id) || {}
            })),
            set: vi.fn((docRef, data) => {
                mockState.rateDocs.set(docRef.id, { ...(mockState.rateDocs.get(docRef.id) || {}), ...data });
                return docRef;
            })
        };
        return runner(tx);
    }),
    collection: vi.fn((name) => {
        if (name === 'contactRateLimits') {
            return {
                doc: (id) => ({ id, path: `contactRateLimits/${id}` })
            };
        }
        if (name === 'messages') {
            return {
                add: vi.fn(async (payload) => {
                    mockState.messageAdds.push(payload);
                    return { id: 'message-1' };
                })
            };
        }
        throw new Error(`Unexpected collection: ${name}`);
    })
}));

vi.mock('firebase-admin/app', () => ({
    getApps: () => [],
    initializeApp: vi.fn(),
    cert: vi.fn((value) => value),
}));

vi.mock('firebase-admin/firestore', () => ({
    getFirestore: () => firestoreMock,
    FieldValue: {
        serverTimestamp: vi.fn(() => 'server-ts')
    }
}));

const validPayload = {
    name: 'Kem Phearum',
    email: 'kem@example.com',
    message: 'Hello this is a valid message body.',
    website: ''
};

describe('processContactSubmission', () => {
    beforeEach(() => {
        mockState.rateDocs.clear();
        mockState.messageAdds = [];
        vi.clearAllMocks();
        globalThis.process = globalThis.process || {};
        globalThis.process.env = globalThis.process.env || {};
        globalThis.process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
            project_id: 'demo',
            client_email: 'demo@example.com',
            private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n'
        });
    });

    it('rejects invalid payloads without writing', async () => {
        const { processContactSubmission } = await import('./contactSubmission');
        const result = await processContactSubmission({
            payload: { name: 'A', email: 'bad-email', message: 'short' },
            clientIp: '127.0.0.1'
        });

        expect(result.status).toBe(400);
        expect(result.body.success).toBe(false);
        expect(mockState.messageAdds.length).toBe(0);
    });

    it('accepts honeypot submissions without writing', async () => {
        const { processContactSubmission } = await import('./contactSubmission');
        const result = await processContactSubmission({
            payload: { website: 'bot-filled-field' },
            clientIp: '127.0.0.1'
        });

        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
        expect(mockState.messageAdds.length).toBe(0);
    });

    it('writes a message on a valid payload', async () => {
        const { processContactSubmission } = await import('./contactSubmission');
        const result = await processContactSubmission({
            payload: validPayload,
            clientIp: '127.0.0.1'
        });

        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
        expect(mockState.messageAdds.length).toBe(1);
        expect(mockState.messageAdds[0].email).toBe('kem@example.com');
    });

    it('returns 429 when the ip+email limit is exceeded', async () => {
        const now = Date.now();
        mockState.rateDocs.set('127.0.0.1:kem@example.com', {
            minuteWindowStart: now,
            dayWindowStart: now,
            minuteCount: 1,
            dayCount: 1
        });

        const { processContactSubmission } = await import('./contactSubmission');
        const result = await processContactSubmission({
            payload: validPayload,
            clientIp: '127.0.0.1'
        });

        expect(result.status).toBe(429);
        expect(result.body.success).toBe(false);
        expect(mockState.messageAdds.length).toBe(0);
    });

    it('returns 429 for a fresh email once the per-IP limit is exhausted', async () => {
        const now = Date.now();
        mockState.rateDocs.set('ip:127.0.0.1', {
            minuteWindowStart: now,
            dayWindowStart: now,
            minuteCount: 3,
            dayCount: 3
        });

        const { processContactSubmission } = await import('./contactSubmission');
        const result = await processContactSubmission({
            payload: { ...validPayload, email: 'rotated-address@example.com' },
            clientIp: '127.0.0.1'
        });

        expect(result.status).toBe(429);
        expect(result.body.success).toBe(false);
        expect(mockState.messageAdds.length).toBe(0);
    });
});
