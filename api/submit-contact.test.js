import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
    rateDoc: null,
    messageAdds: [],
}));

const firestoreMock = vi.hoisted(() => ({
    runTransaction: vi.fn(async (runner) => {
        const tx = {
            get: vi.fn(async () => ({
                exists: !!mockState.rateDoc,
                data: () => mockState.rateDoc || {}
            })),
            set: vi.fn((docRef, data) => {
                const timestampNow = Date.now();
                mockState.rateDoc = {
                    ...data,
                    minuteWindowStart: data.minuteWindowStart ?? timestampNow,
                    dayWindowStart: data.dayWindowStart ?? timestampNow,
                };
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

const createRes = () => {
    const res = {
        headers: {},
        statusCode: 200,
        body: undefined,
        setHeader: vi.fn((key, value) => {
            res.headers[key] = value;
        }),
        status: vi.fn((code) => {
            res.statusCode = code;
            return res;
        }),
        json: vi.fn((payload) => {
            res.body = payload;
            return res;
        }),
        send: vi.fn((payload) => {
            res.body = payload;
            return res;
        })
    };
    return res;
};

describe('submit-contact API', () => {
    beforeEach(() => {
        mockState.rateDoc = null;
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

    it('returns 405 for non-POST methods', async () => {
        const { default: handler } = await import('./submit-contact.js');
        const req = { method: 'GET', headers: {}, body: {} };
        const res = createRes();

        await handler(req, res);

        expect(res.statusCode).toBe(405);
        expect(res.body?.success).toBe(false);
    });

    it('returns 400 for invalid payload', async () => {
        const { default: handler } = await import('./submit-contact.js');
        const req = {
            method: 'POST',
            headers: { origin: 'https://phearum-info.vercel.app' },
            body: { name: 'A', email: 'bad-email', message: 'short' },
            socket: { remoteAddress: '127.0.0.1' }
        };
        const res = createRes();

        await handler(req, res);

        expect(res.statusCode).toBe(400);
        expect(mockState.messageAdds.length).toBe(0);
    });

    it('accepts honeypot submissions without writing', async () => {
        const { default: handler } = await import('./submit-contact.js');
        const req = {
            method: 'POST',
            headers: { origin: 'https://phearum-info.vercel.app' },
            body: { website: 'bot-filled-field' },
            socket: { remoteAddress: '127.0.0.1' }
        };
        const res = createRes();

        await handler(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body?.success).toBe(true);
        expect(mockState.messageAdds.length).toBe(0);
    });

    it('writes message on valid payload', async () => {
        const { default: handler } = await import('./submit-contact.js');
        const req = {
            method: 'POST',
            headers: { origin: 'https://phearum-info.vercel.app' },
            body: {
                name: 'Kem Phearum',
                email: 'kem@example.com',
                message: 'Hello this is a valid message body.',
                website: ''
            },
            socket: { remoteAddress: '127.0.0.1' }
        };
        const res = createRes();

        await handler(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body?.success).toBe(true);
        expect(mockState.messageAdds.length).toBe(1);
        expect(mockState.messageAdds[0].email).toBe('kem@example.com');
    });

    it('returns 429 when rate limit is exceeded', async () => {
        const now = Date.now();
        mockState.rateDoc = {
            minuteWindowStart: now,
            dayWindowStart: now,
            minuteCount: 1,
            dayCount: 1
        };

        const { default: handler } = await import('./submit-contact.js');
        const req = {
            method: 'POST',
            headers: { origin: 'https://phearum-info.vercel.app' },
            body: {
                name: 'Kem Phearum',
                email: 'kem@example.com',
                message: 'A second immediate message should be rate limited.',
                website: ''
            },
            socket: { remoteAddress: '127.0.0.1' }
        };
        const res = createRes();

        await handler(req, res);

        expect(res.statusCode).toBe(429);
        expect(res.body?.success).toBe(false);
    });
});

