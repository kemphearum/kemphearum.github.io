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
    }

    return tags;
};
