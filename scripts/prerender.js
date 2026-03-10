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

// Helper to inject meta tags into the generic HTML
function injectMetaTags(html, item, type) {
    const title = item.title ? `${item.title} | Kem Phearum` : 'Kem Phearum Portfolio';
    const description = item.description || 'Portfolio of Kem Phearum, an ICT Security professional and developer.';
    const url = `https://phearum-info.web.app/${type}/${item.slug}`;

    let metaTags = `
    <!-- Open Graph for Facebook & LinkedIn -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="article" />
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
    console.log('Generating static HTML files for Open Graph tags...');

    if (!fs.existsSync(INDEX_HTML_PATH)) {
        console.error(`Missing base index.html at ${INDEX_HTML_PATH}. Run 'vite build' first.`);
        process.exit(1);
    }

    const baseHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

    // Fetch data
    const blogPosts = await fetchCollection('posts');
    const projects = await fetchCollection('projects');

    console.log(`Found ${blogPosts.length} blog posts and ${projects.length} projects.`);

    const pages = [
        ...blogPosts.map(post => ({ type: 'blog', ...post })),
        ...projects.map(project => ({ type: 'project', ...project }))
    ];

    let generatedCount = 0;

    for (const page of pages) {
        if (!page.slug) continue;

        const dirPath = path.join(DIST_DIR, page.type, page.slug);
        const filePath = path.join(dirPath, 'index.html');

        console.log(`- Generating: /${page.type}/${page.slug}`);

        // Ensure directory exists (e.g., dist/blog/my-post/)
        fs.mkdirSync(dirPath, { recursive: true });

        // Generate customized HTML
        const newHtml = injectMetaTags(baseHtml, page, page.type);

        // Write to dist folder
        fs.writeFileSync(filePath, newHtml);
        generatedCount++;
    }

    console.log(`✅ Successfully generated ${generatedCount} static HTML pages for social media previews.`);
}

generateStaticPages();
