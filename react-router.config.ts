import type { Config } from "@react-router/dev/config";
import fs from "fs";
import path from "path";

// Attempt to load VITE_FIREBASE_PROJECT_ID from .env if process.env doesn't have it
function getProjectId() {
    if (process.env.VITE_FIREBASE_PROJECT_ID) return process.env.VITE_FIREBASE_PROJECT_ID;
    
    try {
        const envPath = path.resolve(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, "utf-8");
            const match = envContent.match(/^VITE_FIREBASE_PROJECT_ID=["']?([^"'\n\r]+)["']?/m);
            if (match && match[1]) return match[1];
        }
    } catch (e) {
        console.error("Error reading .env in config:", e);
    }
    
    return 'phearum-info'; // Fallback
}

const PROJECT_ID = getProjectId();

async function fetchCollectionSlugs(collectionName: string) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=100`;
    console.log(`[Prerender] Fetching slugs for ${collectionName} from: ${url}`);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`[Prerender] Failed to fetch ${collectionName}: ${response.status} ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        if (!data.documents) {
            console.log(`[Prerender] No documents found in ${collectionName}`);
            return [];
        }
        const slugs = data.documents
            .map((doc: any) => doc.fields?.slug?.stringValue)
            .filter(Boolean);
        
        console.log(`[Prerender] Found ${slugs.length} slugs for ${collectionName}`);
        return slugs;
    } catch (error) {
        console.error(`[Prerender] Error fetching ${collectionName}:`, error);
        return [];
    }
}

export default {
    ssr: true,
    routeDiscovery: {
        mode: "initial",
    },
    async prerender() {
        // Pre-render base routes
        const routes = ["/", "/blog", "/projects"];

        console.log(`[Prerender] Starting route discovery for PROJECT_ID: ${PROJECT_ID}`);

        // Fetch dynamic content to pre-render those specific slugs into physical files
        const blogSlugs = await fetchCollectionSlugs('posts');
        const projectSlugs = await fetchCollectionSlugs('projects');

        blogSlugs.forEach((slug: string) => routes.push(`/blog/${slug}`));
        projectSlugs.forEach((slug: string) => routes.push(`/projects/${slug}`));

        console.log(`[Prerender] Final routes list (${routes.length}):`, routes);
        return routes;
    }
} satisfies Config;
