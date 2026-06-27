import { LayoutTemplate, FileText, BriefcaseBusiness, Sparkles, Award } from 'lucide-react';

/**
 * Central registry of CMS content types.
 *
 * Sidebar navigation, admin routing, the command-palette search, and dashboard
 * counts all derive from these descriptors, so adding a content type is mostly a
 * matter of registering it here (plus its domain/service/tab and Firestore rules).
 *
 * Descriptor shape:
 *  - key           tab key + react-query base key
 *  - module        permissions module (MODULES.*)
 *  - navGroup      sidebar group id ('main' | 'management' | 'system')
 *  - labelKey      i18n key for the tab/nav label
 *  - subtitleKey   optional i18n key for the page subtitle
 *  - icon          lucide icon component
 *  - load          dynamic import of the admin tab component
 *  - statusCapable supports the scheduled-publishing status model (P2-4)
 *  - search        optional search-provider descriptor (P2-3)
 */
export const CONTENT_TYPES = [
    {
        key: 'experience',
        module: 'experience',
        navGroup: 'main',
        labelKey: 'admin.tabs.experience',
        icon: BriefcaseBusiness,
        statusCapable: false,
        load: () => import('../pages/admin/experience/ExperienceTab')
    },
    {
        key: 'projects',
        module: 'projects',
        navGroup: 'main',
        labelKey: 'admin.tabs.projects',
        icon: LayoutTemplate,
        statusCapable: true,
        load: () => import('../pages/admin/projects/ProjectsTab')
    },
    {
        key: 'blog',
        module: 'blog',
        navGroup: 'management',
        labelKey: 'admin.tabs.blog',
        icon: FileText,
        statusCapable: true,
        load: () => import('../pages/admin/blog/BlogTab')
    },
    {
        key: 'skills',
        module: 'skills',
        navGroup: 'main',
        labelKey: 'admin.tabs.skills',
        subtitleKey: 'admin.subtitles.skills',
        icon: Sparkles,
        statusCapable: false,
        load: () => import('../pages/admin/skills/SkillsTab')
    },
    {
        key: 'certificates',
        module: 'certificates',
        navGroup: 'main',
        labelKey: 'admin.tabs.certificates',
        subtitleKey: 'admin.subtitles.certificates',
        icon: Award,
        statusCapable: false,
        load: () => import('../pages/admin/certificates/CertificatesTab')
    }
];

const byKey = Object.fromEntries(CONTENT_TYPES.map((type) => [type.key, type]));

export const listContentTypes = () => CONTENT_TYPES;
export const getContentType = (key) => byKey[key] || null;
export const isContentType = (key) => Boolean(byKey[key]);
