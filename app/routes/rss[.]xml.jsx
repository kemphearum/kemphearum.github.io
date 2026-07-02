import BlogService from '../../src/services/BlogService';
import SettingsService from '../../src/services/SettingsService';
import { filterPublished } from '../../src/domain/shared/contentStatus';
import { getLocalizedField } from '../../src/utils/localization';

const DEFAULT_BASE_URL = 'https://phearum-info.web.app';

const normalizeBaseUrl = (request) => {
    try {
        if (request?.url) {
            const { origin } = new URL(request.url);
            if (origin && !origin.includes('localhost')) return origin;
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

const formatRFC822Date = (dateInput) => {
    let date;
    if (!dateInput) {
        date = new Date();
    } else if (dateInput.seconds) {
        // Handle Firestore Timestamp
        date = new Date(dateInput.seconds * 1000);
    } else {
        try {
            date = new Date(dateInput);
        } catch {
            date = new Date();
        }
    }
    return date.toUTCString();
};

export async function loader({ request }) {
    const baseUrl = normalizeBaseUrl(request);
    
    let settings = {};
    try {
        settings = await SettingsService.fetchGlobalSettings();
    } catch (e) {
        console.error("Failed to fetch settings for RSS:", e);
    }
    
    const site = settings?.site || settings || {};
    const siteTitle = escapeXml(getLocalizedField(site.siteName, 'en') || 'Kem Phearum Portfolio');
    const siteDescription = escapeXml(getLocalizedField(site.tagline, 'en') || 'ICT Security & IT Audit Professional');
    const siteUrl = escapeXml(site.canonicalUrl || baseUrl);

    let rssItems = '';

    try {
        const posts = await BlogService.getAll();
        const publishedPosts = filterPublished(posts)
            .sort((a, b) => {
                const dateA = a.publishedAt?.seconds || 0;
                const dateB = b.publishedAt?.seconds || 0;
                return dateB - dateA;
            });

        rssItems = publishedPosts.map(post => {
            const title = escapeXml(getLocalizedField(post.title, 'en') || getLocalizedField(post.title, 'km'));
            const description = escapeXml(getLocalizedField(post.summary, 'en') || getLocalizedField(post.summary, 'km'));
            const url = `${siteUrl}/blog/${post.slug}`;
            const pubDate = formatRFC822Date(post.publishedAt || post.createdAt);
            
            return `
        <item>
            <title>${title}</title>
            <link>${url}</link>
            <guid isPermaLink="true">${url}</guid>
            <pubDate>${pubDate}</pubDate>
            <description>${description}</description>
        </item>`;
        }).join('');
    } catch (e) {
        console.error("Failed to generate RSS items:", e);
    }

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>${siteTitle}</title>
        <link>${siteUrl}</link>
        <description>${siteDescription}</description>
        <language>en-US</language>
        <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${rssItems}
    </channel>
</rss>`.trim();

    return new Response(rssFeed, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
