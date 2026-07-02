import React from 'react';
import { Settings, Search, Share2, ToggleLeft, MessageSquare } from 'lucide-react';
import { ACTIONS } from '../../utils/permissionConstants';

export const settingsFeature = {
    id: 'settings',
    permissions: {
        actions: [ACTIONS.VIEW, ACTIONS.EDIT]
    },
    nav: {
        group: 'administration',
        labelKey: 'admin.tabs.settings',
        icon: Settings,
        order: 99
    },
    settingsSections: [
        {
            id: 'seo',
            labelKey: 'admin.settings.subTabs.seo.label',
            descriptionKey: 'admin.settings.subTabs.seo.description',
            icon: Search,
            component: React.lazy(() => import('../../pages/admin/settings/components/SeoSection'))
        },
        {
            id: 'social',
            labelKey: 'admin.settings.subTabs.social.label',
            descriptionKey: 'admin.settings.subTabs.social.description',
            icon: Share2,
            component: React.lazy(() => import('../../pages/admin/settings/components/SocialSection'))
        },
        {
            id: 'featureFlags',
            labelKey: 'admin.settings.subTabs.featureFlags.label',
            descriptionKey: 'admin.settings.subTabs.featureFlags.description',
            icon: ToggleLeft,
            component: React.lazy(() => import('../../pages/admin/settings/components/FeatureFlagsSection'))
        }
    ]
};