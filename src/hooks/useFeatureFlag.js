import { useQuery } from '@tanstack/react-query';
import SettingsService from '../services/SettingsService';

/**
 * Read a feature flag from the global settings document. Flags live under
 * `featureFlags` and default to `true` (opt-out model) unless explicitly
 * disabled. Reuses the shared ['settings','global'] query cache so it adds no
 * extra Firestore reads when settings are already loaded.
 *
 * @param {string} flag - flag key, e.g. 'showProjects'
 * @param {boolean} fallback - value when settings or the flag are missing
 */
export const useFeatureFlag = (flag, fallback = true) => {
    const { data } = useQuery({
        queryKey: ['settings', 'global'],
        queryFn: () => SettingsService.fetchGlobalSettings(),
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false
    });

    const flags = data?.featureFlags || data?.site?.featureFlags || {};
    if (!flag) return fallback;
    return flags[flag] !== undefined ? flags[flag] !== false : fallback;
};

export default useFeatureFlag;
