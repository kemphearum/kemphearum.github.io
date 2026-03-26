/* eslint-disable react-refresh/only-export-components */
import {
    buildCorsHeaders,
    getClientIpFromHeaders,
    processContactSubmission
} from '../../src/server/contactSubmission';

const toJsonResponse = (body, status, headers = {}) => (
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    })
);

const parsePayload = async (request) => {
    const contentType = String(request.headers.get('content-type') || '').toLowerCase();

    if (contentType.includes('application/json')) {
        return await request.json();
    }

    const raw = await request.text();
    if (!raw) return {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(raw);
        return Object.fromEntries(params.entries());
    }

    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

export async function action({ request }) {
    const origin = String(request.headers.get('origin') || '');
    const corsHeaders = buildCorsHeaders(origin);

    if (request.method === 'OPTIONS') {
        return new Response('', { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return toJsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
    }

    const payload = await parsePayload(request);
    const clientIp = getClientIpFromHeaders(request.headers);
    const result = await processContactSubmission({ payload, clientIp });
    return toJsonResponse(result.body, result.status, corsHeaders);
}

export async function loader({ request }) {
    const origin = String(request.headers.get('origin') || '');
    const corsHeaders = buildCorsHeaders(origin);
    return toJsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
}
