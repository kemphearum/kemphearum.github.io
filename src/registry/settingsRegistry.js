import { listFeatures } from './featureRegistry';

/**
 * Settings domain sections, registry-driven from the feature registry.
 */
export const SETTINGS_SECTIONS = listFeatures()
    .flatMap((feature) => feature.settingsSections || []);

export const listSettingsSections = () => SETTINGS_SECTIONS;
