import type { Config } from "@react-router/dev/config";

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'phearum-info';

async function fetchCollectionSlugs(collectionName: string) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=100`;
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        if (!data.documents) return [];
        return data.documents
            .map((doc: any) => doc.fields?.slug?.stringValue)
            .filter(Boolean);
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        return [];
    }
}

export default {
    ssr: true, // Enable SSR to allow loaders to run during SSG build
    async prerender() {
        // Pre-render base routes
        const routes = ["/", "/blog", "/projects"];

        // Fetch dynamic content to pre-render those specific slugs into physical files
        const blogSlugs = await fetchCollectionSlugs('posts');
        const projectSlugs = await fetchCollectionSlugs('projects');

        blogSlugs.forEach((slug: string) => routes.push(`/blog/${slug}`));
        projectSlugs.forEach((slug: string) => routes.push(`/projects/${slug}`));

        return routes;
    }
} satisfies Config;
