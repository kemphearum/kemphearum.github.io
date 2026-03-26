import {
  buildCorsHeaders,
  getClientIpFromHeaders,
  processContactSubmission
} from '../src/server/contactSubmission';

export default async function handler(req, res) {
  const origin = String(req.headers.origin || '');
  const corsHeaders = buildCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const payload = (() => {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return {};
  })();
  const clientIp = getClientIpFromHeaders(req.headers || {}) || req.socket?.remoteAddress || 'unknown';
  const result = await processContactSubmission({ payload, clientIp });
  return res.status(result.status).json(result.body);
}
