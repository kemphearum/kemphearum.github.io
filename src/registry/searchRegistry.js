import { listContentTypes } from './contentTypeRegistry';
import BlogService from '../services/BlogService';
import ProjectService from '../services/ProjectService';
import ExperienceService from '../services/ExperienceService';
import SkillService from '../services/SkillService';
import CertificateService from '../services/CertificateService';
import { getLocalizedField, getLanguageValue } from '../utils/localization';

/**
 * Search providers, derived from the content-type registry. Each provider knows
 * how to load its records (via the existing service), build a searchable text
 * blob, and present a title/subtitle. The command palette consumes these — so a
 * new content type becomes searchable by registering it here (one entry) in
 * addition to the content registry.
 */
const bothLangs = (field) => `${getLanguageValue(field, 'en', '') || ''} ${getLanguageValue(field, 'km', '') || ''}`;
const joinArray = (value) => (Array.isArray(value) ? value.join(' ') : (value || ''));

const SEARCH_CONFIG = {
    projects: {
        service: ProjectService,
        title: (item, lang) => getLocalizedField(item.title, lang),
        subtitle: (item) => item.slug || '',
        text: (item) => `${bothLangs(item.title)} ${bothLangs(item.description)} ${joinArray(item.techStack)} ${item.slug || ''}`
    },
    blog: {
        service: BlogService,
        title: (item, lang) => getLocalizedField(item.title, lang),
        subtitle: (item) => item.slug || '',
        text: (item) => `${bothLangs(item.title)} ${bothLangs(item.excerpt)} ${joinArray(item.tags)} ${item.slug || ''}`
    },
    experience: {
        service: ExperienceService,
        title: (item, lang) => getLocalizedField(item.role, lang),
        subtitle: (item, lang) => getLocalizedField(item.company, lang),
        text: (item) => `${bothLangs(item.role)} ${bothLangs(item.company)} ${bothLangs(item.description)}`
    },
    skills: {
        service: SkillService,
        title: (item, lang) => getLocalizedField(item.name, lang),
        subtitle: (item) => item.category || '',
        text: (item) => `${bothLangs(item.name)} ${item.category || ''} ${item.slug || ''}`
    },
    certificates: {
        service: CertificateService,
        title: (item, lang) => getLocalizedField(item.name, lang),
        subtitle: (item) => item.organization || '',
        text: (item) => `${bothLangs(item.name)} ${item.organization || ''} ${item.credentialId || ''} ${item.slug || ''}`
    }
};

export const getSearchProviders = () => listContentTypes()
    .filter((contentType) => SEARCH_CONFIG[contentType.key])
    .map((contentType) => ({
        key: contentType.key,
        module: contentType.module,
        labelKey: contentType.labelKey,
        icon: contentType.icon,
        ...SEARCH_CONFIG[contentType.key]
    }));
