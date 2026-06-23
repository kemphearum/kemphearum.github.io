import { processDatabaseSync } from '../../src/server/databaseSync';
import { buildApiCorsHeaders, getBearerToken, parseRequestPayload } from '../../src/server/firebaseAdmin';

const toJsonResponse = (body, status, headers = {}) => (
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers }
    })
);

export async function action({ request }) {
    const origin = String(request.headers.get('origin') || '');
    const corsHeaders = buildApiCorsHeaders(origin, { allowHeaders: 'Content-Type, Authorization' });

    if (request.method === 'OPTIONS') {
        return new Response('', { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'POST') {
        return toJsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
    }

    const payload = await parseRequestPayload(request);
    const authToken = getBearerToken(request);
    const result = await processDatabaseSync({ authToken, payload });
    return toJsonResponse(result.body, result.status, corsHeaders);
}

export async function loader({ request }) {
    const origin = String(request.headers.get('origin') || '');
    return toJsonResponse({ success: false, error: 'Method not allowed' }, 405, buildApiCorsHeaders(origin));
}
