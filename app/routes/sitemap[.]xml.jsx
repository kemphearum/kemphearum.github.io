import BlogService from '../../src/services/BlogService';
import ProjectService from '../../src/services/ProjectService';

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

const formatDate = (dateInput) => {
    if (!dateInput) return new Date().toISOString();
    // Handle Firestore Timestamp
    if (dateInput.seconds) return new Date(dateInput.seconds * 1000).toISOString();
    try {
        return new Date(dateInput).toISOString();
    } catch {
        return new Date().toISOString();
    }
};

export async function loader({ request }) {
    const baseUrl = normalizeBaseUrl(request);
    const urls = [
        { loc: `${baseUrl}/`, priority: '1.0', lastmod: new Date().toISOString() },
        { loc: `${baseUrl}/projects`, priority: '0.8', lastmod: new Date().toISOString() },
        { loc: `${baseUrl}/blog`, priority: '0.8', lastmod: new Date().toISOString() },
        { loc: `${baseUrl}/resume`, priority: '0.7', lastmod: new Date().toISOString() },
    ];

    try {
        // Fetch published Blog Posts
        const posts = await BlogService.getAll();
        const publishedPosts = posts.filter(post => post.visible !== false);
        publishedPosts.forEach(post => {
            if (post.slug) {
                urls.push({ 
                    loc: `${baseUrl}/blog/${post.slug}`, 
                    priority: '0.6',
                    lastmod: formatDate(post.updatedAt || post.createdAt)
                });
            }
        });

        // Fetch published Projects
        const projects = await ProjectService.getAll();
        const publishedProjects = projects.filter(project => project.visible !== false);
        publishedProjects.forEach(project => {
            if (project.slug) {
                urls.push({ 
                    loc: `${baseUrl}/projects/${project.slug}`, 
                    priority: '0.6',
                    lastmod: formatDate(project.updatedAt || project.createdAt)
                });
            }
        });
    } catch (e) {
        console.error("Failed to generate sitemap items:", e);
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(url => `
    <url>
        <loc>${escapeXml(url.loc)}</loc>
        <lastmod>${escapeXml(url.lastmod)}</lastmod>
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
