import Resume from "../../src/pages/Resume";
import SettingsService from "../../src/services/SettingsService";
import ContentService from "../../src/services/ContentService";
import { getLocalizedField } from "../../src/utils/localization";
import { generateMetaTags, generateResumeSchema, DEFAULT_SITE_URL } from "../../src/utils/SeoHelper";

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
    if (error?.code !== 'unavailable') {
      console.warn('Resume Loader Error:', error);
    }
    return { settings: null, profile: null };
  }
}

export function meta({ data, matches }) {
  const currentOrigin = matches?.find(m => m.id === "root")?.data?.currentOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  const language = getMetaLanguage();
  const site = data?.settings?.site || {};
  const profile = data?.profile || null;
  const url = `${site.canonicalUrl || currentOrigin}/resume`;
  const role = (profile && getLocalizedField(profile.currentRole, language)) || 'ICT Security & IT Audit Professional';
  const title = language === 'km' ? 'ប្រវត្តិរូប' : 'Résumé';
  const description = (profile && getLocalizedField(profile.summary, language))
    || `${role} — résumé and professional summary.`;

  return [
    ...generateMetaTags({
      title,
      description,
      siteTitle: 'Kem Phearum',
      type: 'profile',
      url,
      image: site.ogImageUrl || '/og-image.png'
    }),
    {
      "script:ld+json": generateResumeSchema(site, language, profile, url)
    }
  ];
}

export default Resume;
