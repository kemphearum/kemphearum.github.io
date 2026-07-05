import CardPage from "../../src/pages/card/CardPage";
import SettingsService from "../../src/services/SettingsService";
import ContentService from "../../src/services/ContentService";
import CommunicationService from "../../src/services/CommunicationService";
import { getLocalizedField } from "../../src/utils/localization";
import { generateMetaTags, DEFAULT_SITE_URL } from "../../src/utils/SeoHelper";

const getMetaLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader() {
  try {
    const [settings, profileInfo, home, communication] = await Promise.all([
      SettingsService.fetchGlobalSettings(),
      ContentService.fetchSection('profileInfo'),
      ContentService.fetchSection('home'),
      CommunicationService.get()
    ]);
    const profile = { 
      ...profileInfo, 
      ...home,
      name: (home && home.name && (home.name.en || home.name.km)) ? home.name : (profileInfo?.name || '')
    };
    return { settings, profile, communication };
  } catch (error) {
    console.error("Card Loader Error:", error);
    return { settings: null, profile: null, communication: null };
  }
}

export function meta({ data, matches }) {
  const currentOrigin = matches?.find(m => m.id === "root")?.data?.currentOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  const language = getMetaLanguage();
  const settings = data?.settings ?? data;
  const site = settings?.site || settings || {};
  const profile = data?.profile || null;
  const name = profile?.name ? getLocalizedField(profile.name, language) : 'Digital Card';
  const title = `Name Card - ${name}`;
  const desc = `Digital Name Card and Contact Information for ${name}`;
  const url = `${site.canonicalUrl || currentOrigin}/card`;

  return [
    ...generateMetaTags({
      title,
      description: desc,
      siteTitle: 'Kem Phearum',
      type: 'profile',
      url,
      image: site.ogImageUrl || '/og-image.png'
    })
  ];
}

export default function CardRoute() {
  return <CardPage />;
}
