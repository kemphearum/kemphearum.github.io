import { getLocalizedField } from './localization';

export const DEFAULT_SITE_URL = 'https://phearum-info.web.app';
const DEFAULT_PERSON_NAME = 'Kem Phearum';
const DEFAULT_JOB_TITLE = 'ICT Security & IT Audit Professional';

export const generateMetaTags = ({ title, description, image, type = 'website', url, siteTitle = 'Kem Phearum' }) => {
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const metaDescription = description || 'Kem Phearum Portfolio - ICT Security & IT Audit Professional';

    const tags = [
        { title: fullTitle },
        { name: "description", content: metaDescription },

        // Open Graph
        { property: "og:title", content: fullTitle },
        { property: "og:description", content: metaDescription },
        { property: "og:type", content: type },

        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: fullTitle },
        { name: "twitter:description", content: metaDescription },
    ];

    if (image) {
        tags.push({ property: "og:image", content: image });
        tags.push({ name: "twitter:image", content: image });
    }

    if (url) {
        tags.push({ property: "og:url", content: url });
        // Canonical URL (RR7 meta supports arbitrary tags via tagName)
        tags.push({ tagName: "link", rel: "canonical", href: url });
    }

    return tags;
};

/**
 * Person JSON-LD enriched from the global settings + (optional) professional
 * profile document. Backward compatible: `language` and `profile` are optional.
 *
 * @param {Object} siteData - global `site` settings (logo, social, ogImageUrl…)
 * @param {string} [language='en']
 * @param {Object} [profile] - normalized `content/profileInfo` document
 */
export const generatePersonSchema = (siteData, language = 'en', profile = null) => {
    const communication = siteData?.communication || {};
    const social = { ...communication };
    
    const sameAs = [
        social.github, 
        social.linkedin, 
        social.twitter, 
        social.website, 
        social.facebook,
        social.telegramUrl || social.telegram
    ].filter(Boolean);

    const role = profile ? getLocalizedField(profile.currentRole, language) : '';
    const summary = profile ? getLocalizedField(profile.summary, language) : '';
    const location = profile ? getLocalizedField(profile.location, language) : '';
    const languages = Array.isArray(profile?.languages) ? profile.languages.filter(Boolean) : [];
    const image = siteData?.ogImageUrl || siteData?.profileImageUrl || undefined;

    const schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": siteData?.siteName || DEFAULT_PERSON_NAME,
        "jobTitle": role || DEFAULT_JOB_TITLE,
        "url": siteData?.canonicalUrl || DEFAULT_SITE_URL,
        "sameAs": sameAs
    };

    if (summary) schema.description = summary;
    if (location) schema.address = { "@type": "PostalAddress", "addressLocality": location };
    if (languages.length) schema.knowsLanguage = languages;
    if (social.email) schema.email = social.email;
    if (social.phone || social.whatsapp) schema.telephone = social.phone || social.whatsapp;
    if (image) schema.image = image;

    return schema;
};

/**
 * ProfilePage JSON-LD wrapping the enriched Person, for the printable /resume.
 */
export const generateResumeSchema = (siteData, language = 'en', profile = null, url = `${DEFAULT_SITE_URL}/resume`) => ({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "dateModified": new Date().toISOString(),
    "url": url,
    "mainEntity": generatePersonSchema({ ...siteData, canonicalUrl: url }, language, profile)
});

export const generateCredentialSchema = (certificate) => {
    return {
        "@context": "https://schema.org",
        "@type": "EducationalOccupationalCredential",
        "name": certificate.name,
        "credentialCategory": "Certificate",
        "recognizedBy": {
            "@type": "Organization",
            "name": certificate.organization
        },
        "url": certificate.url
    };
};

export const generateAwardSchema = (award) => ({
    "@context": "https://schema.org",
    "@type": "Achievement",
    "name": award.title,
    "description": award.description || undefined,
    "recognizedBy": award.organization ? {
        "@type": "Organization",
        "name": award.organization
    } : undefined
});

export const generatePublicationSchema = (pub) => ({
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "name": pub.title,
    "publisher": pub.publisher ? {
        "@type": "Organization",
        "name": pub.publisher
    } : undefined,
    "datePublished": pub.publishDate || undefined,
    "url": pub.url || undefined,
    "description": pub.description || undefined
});

export const generateSpeakingEventSchema = (event, speakerName = DEFAULT_PERSON_NAME) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "startDate": event.date || undefined,
    "location": event.location ? {
        "@type": "Place",
        "name": event.location
    } : undefined,
    "superEvent": event.eventName ? {
        "@type": "Event",
        "name": event.eventName
    } : undefined,
    "performer": {
        "@type": "Person",
        "name": speakerName
    }
});
