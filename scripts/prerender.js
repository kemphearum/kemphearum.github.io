import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = 'phearum-info';
const DIST_DIR = path.resolve(__dirname, '../dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

// Helper to fetch data from Firestore REST API
async function fetchCollection(collectionName) {
    try {
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=100`);
        const data = await response.json();

        if (!data.documents) return [];

        return data.documents.map(doc => {
            const fields = doc.fields || {};

            // Extract fields (simplified for standard strings)
            const getField = (key) => fields[key]?.stringValue || '';

            return {
                slug: getField('slug'),
                title: getField('title'),
                description: getField('description') || getField('excerpt') || '',
                image: getField('coverImage') || getField('imageUrl') || ''
            };
        }).filter(item => item.slug); // Only keep items with a slug
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        return [];
    }
}

// Helper to fetch global settings (Title/Description)
async function fetchGlobalSettings() {
    try {
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/global`);
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
        console.error('Error fetching global settings:', error);
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
        url += `/${type}/${item.slug}`;
    }

    const description = item.description || 'Portfolio of Kem Phearum, an ICT Security professional and developer.';

    let metaTags = `
    <!-- Open Graph for Facebook & LinkedIn -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="Kem Phearum Portfolio" />
    
    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
`;

    if (item.image) {
        metaTags += `
    <meta property="og:image" content="${item.image}" />
    <meta name="twitter:image" content="${item.image}" />
`;
    }

    // Replace <title>
    let newHtml = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);

    // Replace <meta name="description">
    if (newHtml.match(/<meta\s+name=["']description["']/i)) {
        newHtml = newHtml.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${description}" />`);
    }

    // Append OG tags
    newHtml = newHtml.replace(/<\/head>/i, `${metaTags}\n  </head>`);
    return newHtml;
}

// Main generation function
async function generateStaticPages() {
    console.log('Generating static HTML files for Open Graph tags (Whole Website)...');

    if (!fs.existsSync(INDEX_HTML_PATH)) {
        console.error(`Missing base index.html at ${INDEX_HTML_PATH}. Run 'vite build' first.`);
        process.exit(1);
    }

    const baseHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

    // 1. Fetch data
    const blogPosts = await fetchCollection('posts');
    const projects = await fetchCollection('projects');
    const globalSettings = await fetchGlobalSettings();

    // 2. Update Root Index
    console.log('- Updating: / (Root)');
    if (globalSettings) {
        const rootHtml = injectMetaTags(baseHtml, globalSettings, 'root', true);
        fs.writeFileSync(INDEX_HTML_PATH, rootHtml);
    }

    // 3. Static Pages (Blog/Projects Listing)
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

    // 4. Dynamic Pages
    const pages = [
        ...blogPosts.map(post => ({ type: 'blog', ...post })),
        ...projects.map(project => ({ type: 'project', ...project }))
    ];

    let generatedCount = staticPages.length;

    for (const page of pages) {
        if (!page.slug) continue;

        const dirPath = path.join(DIST_DIR, page.type, page.slug);
        const filePath = path.join(dirPath, 'index.html');

        console.log(`- Generating: /${page.type}/${page.slug}`);

        fs.mkdirSync(dirPath, { recursive: true });
        const newHtml = injectMetaTags(baseHtml, page, page.type);
        fs.writeFileSync(filePath, newHtml);
        generatedCount++;
    }

    console.log(`✅ Successfully generated ${generatedCount} static HTML pages for the whole website.`);
}

generateStaticPages();
