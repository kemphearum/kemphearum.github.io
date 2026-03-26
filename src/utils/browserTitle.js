import { getLocalizedField } from './localization';

const DEFAULT_BRAND = {
    en: 'KEM PHEARUM',
    km: 'ខេម ភារុំ'
};

const DEFAULT_PORTFOLIO_LABEL = {
    en: 'Portfolio',
    km: 'ផតហ្វូលីយ៉ូ'
};

const normalizeSegment = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const dedupeSegments = (segments) => {
    const seen = new Set();
    const result = [];

    segments.forEach((segment) => {
        const normalized = normalizeSegment(segment);
        if (!normalized) return;

        const key = normalized.toLowerCase();
        if (seen.has(key)) return;

        seen.add(key);
        result.push(normalized);
    });

    return result;
};

export const buildBrandName = (site = {}, language = 'en') => {
    const highlight = normalizeSegment(getLocalizedField(site.logoHighlight, language));
    const text = normalizeSegment(getLocalizedField(site.logoText, language));
    const brand = [highlight, text].filter(Boolean).join(' ');

    return brand || DEFAULT_BRAND[language] || DEFAULT_BRAND.en;
};

export const formatBrowserTitle = (rawTitle) => {
    const normalized = normalizeSegment(rawTitle);
    if (!normalized) return '';

    const segments = dedupeSegments(normalized.split('|'));
    if (segments.length > 1) {
        return segments.join(' | ');
    }

    return normalized;
};

export const buildBrowserTitle = (site = {}, language = 'en') => {
    const explicitTitle = formatBrowserTitle(getLocalizedField(site.title, language));
    if (explicitTitle) return explicitTitle;

    const brand = buildBrandName(site, language);
    const portfolioLabel = DEFAULT_PORTFOLIO_LABEL[language] || DEFAULT_PORTFOLIO_LABEL.en;
    return `${brand} | ${portfolioLabel}`;
};
