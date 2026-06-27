import { listFeatures } from './featureRegistry';

/**
 * Search providers, derived from the feature registry. Each provider knows
 * how to load its records, build a searchable text blob, and present a title/subtitle.
 */
export const getSearchProviders = () => listFeatures()
    .filter((feature) => feature.search)
    .map((feature) => ({
        key: feature.id,
        module: feature.id,
        labelKey: feature.nav?.labelKey,
        icon: feature.nav?.icon,
        ...feature.search
    }));
