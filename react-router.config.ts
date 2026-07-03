import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";
import fs from "fs";
import path from "path";
import { isEffectivelyPublished } from "./src/domain/shared/contentStatus.js";

// Attempt to load VITE_FIREBASE_PROJECT_ID from .env if process.env doesn't have it
function getEnvVar(key: string, fallback: string) {
    if (process.env[key]) return process.env[key];
    
    try {
        const envPath = path.resolve(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, "utf-8");
            const regex = new RegExp(`^${key}=["']?([^"'\n\r]+)["']?`, 'm');
            const match = envContent.match(regex);
            if (match && match[1]) return match[1];
        }
    } catch (e) {
        console.error(`Error reading .env for ${key} in config:`, e);
    }
    
    return fallback;
}

const PROJECT_ID = getEnvVar('VITE_FIREBASE_PROJECT_ID', 'phearum-info');
const API_KEY = getEnvVar('VITE_FIREBASE_API_KEY', '');

async function fetchCollectionSlugs(collectionName: string) {
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=100${API_KEY ? `&key=${API_KEY}` : ''}`;
    console.log(`[Prerender] Fetching slugs for ${collectionName} from: ${baseUrl}`);

    try {
        const documents: any[] = [];
        let pageToken = '';
        // Follow pagination so collections beyond 100 docs are fully covered
        // (capped defensively at 10 pages / 1000 docs).
        for (let page = 0; page < 10; page++) {
            const url = pageToken ? `${baseUrl}&pageToken=${encodeURIComponent(pageToken)}` : baseUrl;
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`[Prerender] Failed to fetch ${collectionName}: ${response.status} ${response.statusText}`);
                break;
            }
            const data = await response.json();
            if (Array.isArray(data.documents)) documents.push(...data.documents);
            pageToken = data.nextPageToken || '';
            if (!pageToken) break;
        }

        if (!documents.length) {
            console.log(`[Prerender] No documents found in ${collectionName}`);
            return [];
        }
        const fieldValue = (field: any) => {
            if (!field || typeof field !== 'object') return undefined;
            if ('stringValue' in field) return field.stringValue;
            if ('booleanValue' in field) return field.booleanValue;
            if ('timestampValue' in field) return field.timestampValue;
            return undefined;
        };
        // Only prerender effectively-published documents — drafts, scheduled
        // (future publishAt) and expired content must not become static HTML.
        const slugs = documents
            .map((doc: any) => ({
                slug: fieldValue(doc.fields?.slug),
                visible: fieldValue(doc.fields?.visible),
                status: fieldValue(doc.fields?.status),
                publishAt: fieldValue(doc.fields?.publishAt),
                expireAt: fieldValue(doc.fields?.expireAt)
            }))
            .filter((doc: any) => doc.slug && isEffectivelyPublished(doc))
            .map((doc: any) => doc.slug);

        console.log(`[Prerender] Found ${slugs.length} published slugs for ${collectionName} (${documents.length} scanned)`);
        return slugs;
    } catch (error) {
        console.error(`[Prerender] Error fetching ${collectionName}:`, error);
        return [];
    }
}

export default {
    future: {
        v8_middleware: true,
        v8_splitRouteModules: true,
        v8_viteEnvironmentApi: true,
        v8_passThroughRequests: true,
        v8_trailingSlashAwareDataRequests: true,
    },
    ssr: true,
    presets: [vercelPreset()],
    routeDiscovery: {
        mode: "initial",
    },
    async prerender() {
        // Pre-render base routes. /admin and /card are included so static
        // mirrors (GitHub Pages / Firebase Hosting) serve route-matching HTML
        // instead of falling back to the prerendered homepage, which made
        // React hydration fail (#418) on those URLs.
        const routes = ["/", "/blog", "/projects", "/resume", "/admin", "/card", "/sitemap.xml", "/rss.xml"];

        // Skip dynamic discovery in development to save API quota and prevent 429 errors
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Prerender] Skipping dynamic discovery in development mode.`);
            return routes;
        }

        console.log(`[Prerender] Starting route discovery for PROJECT_ID: ${PROJECT_ID}`);

        // Fetch dynamic content to pre-render those specific slugs into physical files
        const blogSlugs = await fetchCollectionSlugs('posts');
        const projectSlugs = await fetchCollectionSlugs('projects');

        blogSlugs.forEach((slug: string) => routes.push(`/blog/${slug}`));
        projectSlugs.forEach((slug: string) => routes.push(`/projects/${slug}`));

        console.log(`[Prerender] Final routes list (${routes.length}):`);
        routes.forEach(r => console.log(`  - ${r}`));
        return routes;
    }
} satisfies Config;
