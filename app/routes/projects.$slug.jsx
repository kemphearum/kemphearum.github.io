import ProjectDetail from "../../src/pages/ProjectDetail";
import ProjectService from "../../src/services/ProjectService";
import { getLocalizedField } from "../../src/utils/localization";
import { generateMetaTags, DEFAULT_SITE_URL } from "../../src/utils/SeoHelper";

const getMetaLanguage = () => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader({ params }) {
    try {
        return await ProjectService.fetchProjectBySlug(params.slug);
    } catch (e) {
        console.error("Project detail loader failed:", e);
        return null;
    }
}

export function meta({ data, params }) {
    const language = getMetaLanguage();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    if (!data) return [{ title: `${tr('Project Not Found', 'រកមិនឃើញគម្រោង')} | Kem Phearum` }];

    const title = getLocalizedField(data.title, language);
    const description = getLocalizedField(data.description, language);

    return generateMetaTags({
        title,
        description: description || tr('Project details and technical implementation.', 'ព័ត៌មានលម្អិតគម្រោង និងការអនុវត្តបច្ចេកទេស។'),
        image: data.imageUrl,
        type: 'article',
        url: `${DEFAULT_SITE_URL}/projects/${params.slug}`
    });
}

export async function clientLoader({ serverLoader }) {
  try {
    return await serverLoader();
  } catch (err) {
    // If the server loader fails (due to 404.html fallback on GitHub pages, 
    // missing .data files, or parsing errors), fallback gracefully to client-side 
    // Firestore fetching by returning null.
    console.warn("Server loader unavailable, falling back to client-side Firebase.", err);
    return null;
  }
}

export default ProjectDetail;
