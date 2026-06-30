import Home from "../../src/pages/Home";
import SettingsService from "../../src/services/SettingsService";
import ContentService from "../../src/services/ContentService";
import { getLocalizedField } from "../../src/utils/localization";
import { buildBrowserTitle } from "../../src/utils/browserTitle";
import { generateMetaTags, generatePersonSchema, DEFAULT_SITE_URL } from "../../src/utils/SeoHelper";

const getMetaLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader() {
  try {
    const [settings, profile] = await Promise.all([
      SettingsService.fetchGlobalSettings(),
      ContentService.fetchSection('profileInfo')
    ]);
    return { settings, profile };
  } catch (error) {
    console.error("Home Loader Error:", error);
    return { settings: null, profile: null };
  }
}

export function meta({ data }) {
  const language = getMetaLanguage();
  // Backward compatible with the legacy loader shape (raw settings doc).
  const settings = data?.settings ?? data;
  const site = settings?.site || settings || {};
  const profile = data?.profile || null;
  const title = buildBrowserTitle(site, language);
  const desc = getLocalizedField(site.tagline, language) || (
    language === 'km'
      ? 'អ្នកជំនាញសន្តិសុខ ICT និងសវនកម្ម IT'
      : 'ICT Security & IT Audit Professional'
  );
  const url = site.canonicalUrl || DEFAULT_SITE_URL;

  return [
    ...generateMetaTags({
      title,
      description: desc,
      siteTitle: 'Kem Phearum',
      type: 'website',
      url,
      image: site.ogImageUrl || '/og-image.png'
    }),
    {
      "script:ld+json": generatePersonSchema(site, language, profile)
    },
    {
      tagName: "link",
      rel: "alternate",
      type: "application/rss+xml",
      title: "Blog RSS Feed",
      href: "/rss.xml"
    }
  ];
}

export default Home;
