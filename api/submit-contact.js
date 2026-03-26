import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const RATE_LIMIT_COLLECTION = 'contactRateLimits';
const MESSAGE_COLLECTION = 'messages';
const ALLOWED_ORIGINS = new Set([
  'https://kemphearum.github.io',
  'https://www.kemphearum.github.io',
  'https://phearum-info.web.app',
  'https://phearum-info.firebaseapp.com',
  'https://kem-phearum.web.app',
  'https://kem-phearum.firebaseapp.com',
  'https://phearum-info.vercel.app',
  'http://localhost:5173'
]);

const parseServiceAccount = () => {
  const raw = globalThis.process?.env?.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON in Vercel environment.');
  }

  const parsed = JSON.parse(raw);
  if (parsed.private_key) {
    parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n');
  }
  return parsed;
};

const getDb = () => {
  if (!getApps().length) {
    const serviceAccount = parseServiceAccount();
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
};

const normalizeText = (value, maxLength = 5000) => (
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength)
);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const enforceRateLimit = async (db, identifier) => {
  const now = Date.now();
  const minuteMs = 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  const docRef = db.collection(RATE_LIMIT_COLLECTION).doc(identifier);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = snap.exists ? snap.data() : {};

    const minuteWindowStart = Number(data.minuteWindowStart || 0);
    const dayWindowStart = Number(data.dayWindowStart || 0);
    const minuteCount = Number(data.minuteCount || 0);
    const dayCount = Number(data.dayCount || 0);

    const inMinuteWindow = now - minuteWindowStart < minuteMs;
    const inDayWindow = now - dayWindowStart < dayMs;

    const nextMinuteCount = inMinuteWindow ? minuteCount + 1 : 1;
    const nextDayCount = inDayWindow ? dayCount + 1 : 1;

    if (nextMinuteCount > 1) {
      const error = new Error('Too many requests. Please wait a minute.');
      error.code = 'RATE_LIMITED_MINUTE';
      throw error;
    }

    if (nextDayCount > 5) {
      const error = new Error('Daily request limit reached. Please try tomorrow.');
      error.code = 'RATE_LIMITED_DAY';
      throw error;
    }

    tx.set(docRef, {
      minuteWindowStart: inMinuteWindow ? minuteWindowStart : now,
      dayWindowStart: inDayWindow ? dayWindowStart : now,
      minuteCount: nextMinuteCount,
      dayCount: nextDayCount,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
};

const getClientIp = (req) => {
  const forwarded = String(req.headers['x-forwarded-for'] || '');
  const fallback = req.socket?.remoteAddress || 'unknown';
  return normalizeText(forwarded.split(',')[0] || fallback, 100);
};

export default async function handler(req, res) {
  const origin = String(req.headers.origin || '');
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const honeypot = normalizeText(payload.website || '', 200);

    if (honeypot) {
      return res.status(200).json({ success: true });
    }

    const name = normalizeText(payload.name, 100);
    const email = normalizeText(payload.email, 200).toLowerCase();
    const message = String(payload.message || '').trim().slice(0, 5000);

    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, error: 'Name is required.' });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'A valid email is required.' });
    }

    if (!message || message.length < 10) {
      return res.status(400).json({ success: false, error: 'Message is too short.' });
    }

    const db = getDb();
    const ip = getClientIp(req);
    const identifier = `${ip}:${email}`.toLowerCase();

    await enforceRateLimit(db, identifier);

    await db.collection(MESSAGE_COLLECTION).add({
      name,
      email,
      senderEmail: email,
      message,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
      source: 'vercel-contact-api'
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    if (error?.code === 'RATE_LIMITED_MINUTE' || error?.code === 'RATE_LIMITED_DAY') {
      return res.status(429).json({ success: false, error: error.message });
    }

    console.error('Vercel contact API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
