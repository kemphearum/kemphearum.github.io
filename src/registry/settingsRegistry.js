import { Search, Share2, ToggleLeft } from 'lucide-react';
import SeoSection from '../pages/admin/settings/components/SeoSection';
import SocialSection from '../pages/admin/settings/components/SocialSection';
import FeatureFlagsSection from '../pages/admin/settings/components/FeatureFlagsSection';

/**
 * Settings domain sections, registry-driven. The legacy sub-tabs (identity,
 * typography, visuals, sync) have bespoke wiring and stay in SettingsTab; these
 * declarative sections take uniform props ({ settingsData, setSettingsData,
 * onSave, loading }) and are rendered from the registry — add a section by
 * registering it here.
 */
export const SETTINGS_SECTIONS = [
    {
        id: 'seo',
        labelKey: 'admin.settings.subTabs.seo.label',
        descriptionKey: 'admin.settings.subTabs.seo.description',
        icon: Search,
        component: SeoSection
    },
    {
        id: 'social',
        labelKey: 'admin.settings.subTabs.social.label',
        descriptionKey: 'admin.settings.subTabs.social.description',
        icon: Share2,
        component: SocialSection
    },
    {
        id: 'featureFlags',
        labelKey: 'admin.settings.subTabs.featureFlags.label',
        descriptionKey: 'admin.settings.subTabs.featureFlags.description',
        icon: ToggleLeft,
        component: FeatureFlagsSection
    }
];

export const listSettingsSections = () => SETTINGS_SECTIONS;
