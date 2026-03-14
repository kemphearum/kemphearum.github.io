import { db } from '../../src/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function loader() {
    const baseUrl = 'https://kemphearum.github.io'; // Update to your production domain
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
        <loc>${url.loc}</loc>
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
