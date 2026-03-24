const SECTION_ID_ALIASES = {
    home: 'home',
    top: 'home',
    about: 'about',
    experience: 'experience',
    'work-experience': 'experience',
    project: 'projects',
    projects: 'projects',
    'my-project': 'projects',
    'my-projects': 'projects',
    'view-my-project': 'projects',
    'view-my-projects': 'projects',
    blog: 'blog',
    blogs: 'blog',
    contact: 'contact',
    'get-in-touch': 'contact',
    getintouch: 'contact'
};

const cleanTarget = (rawTarget = '') => {
    let value = String(rawTarget || '').trim();
    if (!value) return '';

    try {
        const parsed = new URL(value, window.location.origin);
        if (parsed.hash) {
            value = parsed.hash.slice(1);
        } else if (parsed.pathname && parsed.pathname !== '/') {
            value = parsed.pathname.replace(/^\/+/, '').split('/')[0];
        } else {
            value = parsed.pathname.replace(/^\/+/, '');
        }
    } catch {
        const hashIndex = value.indexOf('#');
        if (hashIndex !== -1) {
            value = value.slice(hashIndex + 1);
        }
    }

    return value
        .replace(/^[/#]+/, '')
        .split('?')[0]
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-')
        .replace(/-+/g, '-');
};

export const normalizeSectionTarget = (rawTarget) => {
    const normalized = cleanTarget(rawTarget);
    if (!normalized) return 'home';
    return SECTION_ID_ALIASES[normalized] || normalized;
};

export const isLikelySectionTarget = (rawTarget) => {
    const value = String(rawTarget || '').trim();
    if (!value) return false;
    if (value.startsWith('#')) return true;
    if (value.startsWith('/#')) return true;
    if (/^(https?:)?\/\//i.test(value)) return false;
    if (value.includes('/')) return false;

    const normalized = cleanTarget(value);
    return Boolean(SECTION_ID_ALIASES[normalized] || normalized);
};

export const scrollToSectionWithOffset = (rawTarget, options = {}) => {
    const sectionId = normalizeSectionTarget(rawTarget);
    const headerOffset = options.headerOffset ?? 70;
    const behavior = options.behavior ?? 'smooth';

    const element = document.getElementById(sectionId);
    if (!element) return null;

    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;
    window.scrollTo({ top: offsetPosition, behavior });

    return sectionId;
};
