import { processGeoLookup } from '../../src/server/geoLookup';
import { buildApiCorsHeaders } from '../../src/server/firebaseAdmin';

const toJsonResponse = (body, status, headers = {}) => (
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers }
    })
);

// Geo lookup is a GET (no body), so it is served from the loader.
export async function loader({ request }) {
    const origin = String(request.headers.get('origin') || '');
    const corsHeaders = buildApiCorsHeaders(origin, { methods: 'GET, OPTIONS' });

    if (request.method === 'OPTIONS') {
        return new Response('', { status: 204, headers: corsHeaders });
    }

    const result = await processGeoLookup({ headers: request.headers });
    return toJsonResponse(result.body, result.status, {
        ...corsHeaders,
        'Cache-Control': 'private, max-age=300'
    });
}
