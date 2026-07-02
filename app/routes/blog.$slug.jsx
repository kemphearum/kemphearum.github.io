import BlogPost from "../../src/pages/BlogPost";
import BlogService from "../../src/services/BlogService";
import { getLocalizedField } from "../../src/utils/localization";
import { generateMetaTags, DEFAULT_SITE_URL } from "../../src/utils/SeoHelper";

const getMetaLanguage = () => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader({ params }) {
    try {
        return await BlogService.fetchPostBySlug(params.slug);
    } catch (e) {
        console.error("Blog detail loader failed:", e);
        return null;
    }
}

export function meta({ data, params }) {
    const language = getMetaLanguage();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    if (!data) return [{ title: `${tr('Post Not Found', 'រកមិនឃើញអត្ថបទ')} | Kem Phearum` }];

    const title = getLocalizedField(data.title, language);
    const excerpt = getLocalizedField(data.excerpt, language);
    const content = getLocalizedField(data.content, language);

    return generateMetaTags({
        title,
        description: excerpt || content?.substring(0, 160).replace(/[#*`]/g, '') + '...',
        image: data.coverImage,
        type: 'article',
        url: `${DEFAULT_SITE_URL}/blog/${params.slug}`
    });
}

export async function clientLoader({ serverLoader }) {
  try {
    return await serverLoader();
  } catch (err) {
    // Fallback gracefully to client-side Firestore fetching if .data is missing or fails
    console.warn("Server loader unavailable, falling back to client-side Firebase.", err);
    return null;
  }
}

export default BlogPost;
