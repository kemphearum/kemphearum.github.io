import ProjectsPage from "../../src/pages/ProjectsPage";
import SettingsService from "../../src/services/SettingsService";
import { getLocalizedField } from "../../src/utils/localization";

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

export function meta({ data }) {
    const language = getMetaLanguage();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const site = data?.site || data || {};
    const title = `Projects | ${getLocalizedField(site.title, language) || "Kem Phearum"}`;
    const description = getLocalizedField(site.projectsDescription || site.description, language)
        || tr("Explore my latest projects and technical work.", "ស្វែងយល់ពីគម្រោងចុងក្រោយ និងការងារបច្ចេកទេសរបស់ខ្ញុំ។");
    return [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
    ];
}

export default ProjectsPage;
