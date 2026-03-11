import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'phearum-info';
const DIST_DIR = path.resolve(__dirname, '../dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

// Social Preview Settings
const OG_WIDTH = '1200';
const OG_HEIGHT = '630';
const FALLBACK_IMAGE = 'https://phearum-info.web.app/og-image.png';

// Helper to fetch data from Firestore REST API
async function fetchCollection(collectionName) {
    try {
        const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=100`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status} fetching ${collectionName}: ${errorText}`);
        }

        const data = await response.json();
        if (!data.documents) return [];

        return data.documents.map(doc => {
            const fields = doc.fields || {};
            const getField = (key) => fields[key]?.stringValue || '';

            return {
                slug: getField('slug'),
                title: getField('title'),
                description: getField('description') || getField('excerpt') || '',
                image: getField('coverImage') || getField('imageUrl') || ''
            };
        }).filter(item => item.slug);
    } catch (error) {
        console.error(`❌ Error fetching ${collectionName}:`, error.message);
        return [];
    }
}

// Helper to fetch global settings (Title/Description)
async function fetchGlobalSettings() {
    try {
        const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/global`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`⚠️ Global settings not found (HTTP ${response.status}). Using defaults.`);
            return null;
        }

        const data = await response.json();
        if (!data.fields) return null;

        const site = data.fields.site?.mapValue?.fields || data.fields;
        const getField = (key) => site[key]?.stringValue || '';

        return {
            title: getField('pageTitle') || getField('title') || 'Kem Phearum Portfolio',
            description: getField('description') || 'Portfolio of Kem Phearum, an ICT Security professional and developer.',
            image: getField('pageFaviconUrl') || getField('favicon') || ''
        };
    } catch (error) {
        console.error('❌ Error fetching global settings:', error.message);
        return null;
    }
}


// Helper to inject meta tags into the generic HTML
function injectMetaTags(html, item, type, isRoot = false) {
    let title = 'Kem Phearum Portfolio';
    let url = 'https://phearum-info.web.app';

    if (isRoot) {
        title = item.title;
    } else if (type === 'blog-list') {
        title = 'Blog | Kem Phearum';
        url += '/blog';
    } else if (type === 'project-list') {
        title = 'Projects | Kem Phearum';
        url += '/projects';
    } else {
        title = item.title ? `${item.title} | Kem Phearum` : 'Kem Phearum Portfolio';
        // Ensure path matches App.jsx routes (/blog/:slug, /projects/:slug)
        const pathPrefix = type === 'project' ? 'projects' : type;
        url += `/${pathPrefix}/${item.slug}`;
    }

    const description = item.description || 'Portfolio of Kem Phearum, an ICT Security professional and developer.';

    // Social media crawlers (LinkedIn/FB) do NOT support Base64 for og:image.
    // We use the item image if it's a real HTTP/HTTPS URL, otherwise the fallback.
    const displayImage = (item.image && item.image.startsWith('http')) ? item.image : FALLBACK_IMAGE;

    let metaTags = `
    <!-- Open Graph for Facebook & LinkedIn -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="Kem Phearum Portfolio" />
    <meta property="og:image" content="${displayImage}" />
    <meta property="og:image:width" content="${OG_WIDTH}" />
    <meta property="og:image:height" content="${OG_HEIGHT}" />

    <!-- Hint for Large Previews -->
    <meta name="twitter:card" content="summary_large_image" />

    <!-- Redirect to Hash Route for SPA -->
    <script>
        (function() {
            var path = window.location.pathname;
            if (path !== '/' && !window.location.hash) {
                window.location.href = '/#' + path;
            }
        })();
    </script>
`;

    // Strip existing Open Graph tags and the redirect script to prevent duplication
    const strippedHtml = html
        .replace(/<!-- Open Graph for Facebook & LinkedIn -->[\s\S]*?<!-- Redirect to Hash Route for SPA -->[\s\S]*?<\/script>/i, '')
        .replace(/<meta\s+property=["']og:.*?["']\s+content=["'].*?["']\s*\/?>/gi, '');

    const newHtml = strippedHtml.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
        .replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${description}" />`)
        .replace(/<\/head>/i, `${metaTags}\n  </head>`);

    return newHtml;
}

// Main generation function
async function generateStaticPages() {
    console.log(`🚀 Starting pre-render for Project: ${PROJECT_ID}...`);

    if (!fs.existsSync(INDEX_HTML_PATH)) {
        throw new Error(`Missing base index.html at ${INDEX_HTML_PATH}. Did 'vite build' succeed?`);
    }

    const baseHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

    const blogPosts = await fetchCollection('posts');
    const projects = await fetchCollection('projects');
    const globalSettings = await fetchGlobalSettings();

    console.log(`- Updating: / (Root)`);
    if (globalSettings) {
        const rootHtml = injectMetaTags(baseHtml, globalSettings, 'root', true);
        fs.writeFileSync(INDEX_HTML_PATH, rootHtml);
    }

    const staticPages = [
        { type: 'blog-list', path: 'blog', title: 'Blog', description: 'Read the latest articles and thoughts from Kem Phearum.' },
        { type: 'project-list', path: 'projects', title: 'Projects', description: 'Explore a collection of security and web development projects.' }
    ];

    for (const page of staticPages) {
        console.log(`- Generating: /${page.path}`);
        const dirPath = path.join(DIST_DIR, page.path);
        fs.mkdirSync(dirPath, { recursive: true });
        const html = injectMetaTags(baseHtml, page, page.type);
        fs.writeFileSync(path.join(dirPath, 'index.html'), html);
    }

    const pages = [
        ...blogPosts.map(post => ({ type: 'blog', ...post })),
        ...projects.map(project => ({ type: 'project', ...project }))
    ];

    let generatedCount = staticPages.length;

    for (const page of pages) {
        if (!page.slug) continue;

        // Use plural 'projects' for the dynamic path to match routes
        const typePath = page.type === 'project' ? 'projects' : page.type;
        const dirPath = path.join(DIST_DIR, typePath, page.slug);
        const filePath = path.join(dirPath, 'index.html');

        console.log(`- Generating: /${typePath}/${page.slug}`);

        fs.mkdirSync(dirPath, { recursive: true });
        const newHtml = injectMetaTags(baseHtml, page, page.type);
        fs.writeFileSync(filePath, newHtml);
        generatedCount++;
    }

    console.log(`✅ Successfully generated ${generatedCount} static HTML pages.`);
}

generateStaticPages().catch(err => {
    console.error('❌ FATAL ERROR in pre-render script:', err.message);
    process.exit(1);
});
