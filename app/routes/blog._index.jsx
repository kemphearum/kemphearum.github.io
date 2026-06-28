import Blog from "../../src/pages/Blog";
import SettingsService from "../../src/services/SettingsService";
import { getLocalizedField } from "../../src/utils/localization";
import { generateMetaTags } from "../../src/utils/SeoHelper";

const getMetaLanguage = () => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader() {
    try {
        return await SettingsService.fetchGlobalSettings();
    } catch (error) {
        console.error("Blog Loader Error:", error);
        return null;
    }
}

export function meta({ data }) {
    const language = getMetaLanguage();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const site = data?.site || data || {};
    const description = getLocalizedField(site.blogDescription || site.description, language)
        || tr("Latest thoughts, tutorials, and project updates.", "គំនិតថ្មីៗ មេរៀន និងបច្ចុប្បន្នភាពគម្រោងចុងក្រោយ។");
    
    return generateMetaTags({
        title: tr('Blog', 'ប្លុក'),
        description,
        siteTitle: getLocalizedField(site.title, language) || "Kem Phearum",
        type: 'website',
        image: site.ogImageUrl || "/og-image.png"
    });
}

export default Blog;
