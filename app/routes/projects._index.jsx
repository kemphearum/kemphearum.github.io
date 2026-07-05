import ProjectsPage from "../../src/pages/ProjectsPage";
import SettingsService from "../../src/services/SettingsService";
import { getLocalizedField } from "../../src/utils/localization";
import { generateMetaTags, DEFAULT_SITE_URL } from "../../src/utils/SeoHelper";

const getMetaLanguage = () => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader() {
    try {
        return await SettingsService.fetchGlobalSettings();
    } catch (error) {
        console.error("Projects Loader Error:", error);
        return null;
    }
}

export function meta({ data, matches }) {
  const currentOrigin = matches?.find(m => m.id === "root")?.data?.currentOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
    const language = getMetaLanguage();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const site = data?.site || data || {};
    const description = getLocalizedField(site.projectsDescription || site.description, language)
        || tr("Explore my latest projects and technical work.", "ស្វែងយល់ពីគម្រោងចុងក្រោយ និងការងារបច្ចេកទេសរបស់ខ្ញុំ។");
    
    return generateMetaTags({
        title: "Projects",
        description,
        siteTitle: getLocalizedField(site.title, language) || "Kem Phearum",
        type: 'website',
        image: site.ogImageUrl || "/og-image.png",
        url: `${site.canonicalUrl || currentOrigin}/projects`
    });
}

export default ProjectsPage;
