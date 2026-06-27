import Home from "../../src/pages/Home";
import SettingsService from "../../src/services/SettingsService";
import { getLocalizedField } from "../../src/utils/localization";
import { buildBrowserTitle } from "../../src/utils/browserTitle";

const getMetaLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader() {
  try {
    return await SettingsService.fetchGlobalSettings();
  } catch (error) {
    console.error("Home Loader Error:", error);
    return null;
  }
}

export function meta({ data }) {
  const language = getMetaLanguage();
  const site = data?.site || data || {};
  const title = buildBrowserTitle(site, language);
  const desc = getLocalizedField(site.tagline, language) || (
    language === 'km'
      ? 'អ្នកជំនាញសន្តិសុខ ICT និងសវនកម្ម IT'
      : 'ICT Security & IT Audit Professional'
  );

  return [
    { title },
    { name: "description", content: desc },
    { property: "og:title", content: title },
  ];
}

export default Home;
