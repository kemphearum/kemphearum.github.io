import { db } from '../../src/firebase';
import { collection, getDocs } from 'firebase/firestore';

const DEFAULT_BASE_URL = 'https://phearum-info.web.app';

const normalizeBaseUrl = (request) => {
    try {
        if (request?.url) {
            const { origin } = new URL(request.url);
            if (origin) return origin;
        }
    } catch {
        // Ignore malformed request URL and fallback below.
    }
    return DEFAULT_BASE_URL;
};

const escapeXml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export async function loader({ request }) {
    const baseUrl = normalizeBaseUrl(request);
    const urls = [
        { loc: `${baseUrl}/`, priority: '1.0' },
        { loc: `${baseUrl}/projects`, priority: '0.8' },
        { loc: `${baseUrl}/blog`, priority: '0.8' },
    ];

    // Fetch Blog Posts
    const blogSnapshot = await getDocs(collection(db, 'posts'));
    blogSnapshot.forEach(doc => {
        const post = doc.data();
        if (post.slug) {
            urls.push({ loc: `${baseUrl}/blog/${post.slug}`, priority: '0.6' });
        }
    });

    // Fetch Projects
    const projectSnapshot = await getDocs(collection(db, 'projects'));
    projectSnapshot.forEach(doc => {
        const project = doc.data();
        if (project.slug) {
            urls.push({ loc: `${baseUrl}/projects/${project.slug}`, priority: '0.6' });
        }
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(url => `
    <url>
        <loc>${escapeXml(url.loc)}</loc>
        <priority>${url.priority}</priority>
    </url>`).join('')}
</urlset>`.trim();

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
