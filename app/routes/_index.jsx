import Home from "../../src/pages/Home";
import SettingsService from "../../src/services/SettingsService";
import ContentService from "../../src/services/ContentService";
import BlogService from "../../src/services/BlogService";
import ProjectService from "../../src/services/ProjectService";
import ExperienceService from "../../src/services/ExperienceService";
import EducationService from "../../src/services/EducationService";
import SkillService from "../../src/services/SkillService";
import CertificateService from "../../src/services/CertificateService";
import AwardService from "../../src/services/AwardService";
import PublicationService from "../../src/services/PublicationService";
import SpeakingService from "../../src/services/SpeakingService";
import CommunicationService from "../../src/services/CommunicationService";
import ResumeService from "../../src/services/ResumeService";
import { getLocalizedField } from "../../src/utils/localization";
import { buildBrowserTitle } from "../../src/utils/browserTitle";
import { generateMetaTags, generatePersonSchema, DEFAULT_SITE_URL } from "../../src/utils/SeoHelper";

const getMetaLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader() {
  try {
    const [
      settings,
      profile,
      about,
      home,
      contact,
      resume,
      posts,
      projects,
      experience,
      education,
      skills,
      certificates,
      awards,
      publications,
      speaking
    ] = await Promise.all([
      SettingsService.fetchGlobalSettings(),
      ContentService.fetchSection('profileInfo'),
      ContentService.fetchSection('about'),
      ContentService.fetchSection('home'),
      CommunicationService.get(),
      ResumeService.get(),
      BlogService.getAll('createdAt', 'desc'),
      ProjectService.getAll('createdAt', 'desc'),
      ExperienceService.getAll('startDate', 'desc'),
      EducationService.getAll('startDate', 'desc'),
      SkillService.getAll(),
      CertificateService.getAll('issueDate', 'desc'),
      AwardService.getAll(),
      PublicationService.getAll(),
      SpeakingService.getAll()
    ]);
    return {
      settings, profile, about, home, contact, resume, posts, projects, experience,
      education, skills, certificates, awards, publications, speaking
    };
  } catch (error) {
    console.error("Home Loader Error:", error);
    return { settings: null, profile: null, about: null, home: null };
  }
}

export function meta({ data, matches }) {
  const currentOrigin = matches?.find(m => m.id === "root")?.data?.currentOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  const language = getMetaLanguage();
  const settings = data?.settings ?? data;
  const site = settings?.site || settings || {};
  const seo = settings?.seo || {};
  const profile = data?.profile || null;
  const title = seo.metaTitle || buildBrowserTitle(site, language);
  const desc = seo.metaDescription || getLocalizedField(site.tagline, language) || (
    language === 'km'
      ? 'អ្នកជំនាញសន្តិសុខ ICT និងសវនកម្ម IT'
      : 'ICT Security & IT Audit Professional'
  );
  const url = site.canonicalUrl || currentOrigin;

  return [
    ...generateMetaTags({
      title,
      description: desc,
      keywords: seo.keywords,
      siteTitle: 'Kem Phearum',
      type: 'website',
      url,
      image: seo.ogImage || site.ogImageUrl || '/og-image.png'
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
