import { useCallback, useState } from 'react';
import ContentService from '../../../services/ContentService';
import SettingsService from '../../../services/SettingsService';
import { ACTIONS } from '../../../utils/permissions';

const DEFAULT_VISUAL_SETTINGS = SettingsService.constructor.DEFAULT_VISUAL_SETTINGS || {};

export const useAdminContent = ({
    trackRead,
    trackWrite,
    queryClient,
    execute,
    checkActionAllowed,
    showToast,
    t
}) => {
    const [homeData, setHomeData] = useState({ greeting: '', name: '', subtitle: '', description: '', ctaText: '', ctaLink: '', profileImageUrl: '' });
    const [aboutData, setAboutData] = useState({ bio: '', skills: '' });
    const [contactData, setContactData] = useState({ introText: '' });
    const [settingsData, setSettingsData] = useState({
        title: '',
        favicon: '',
        logoHighlight: '',
        logoText: '',
        tagline: '',
        footerText: '',
        projectFilters: '',
        blogFilters: '',
        ...DEFAULT_VISUAL_SETTINGS
    });
    const [sidebarPersistent, setSidebarPersistent] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = localStorage.getItem('adminSidebarPersistent');
        return stored !== null ? JSON.parse(stored) : true;
    });

    const fetchSectionData = useCallback(async (section) => {
        try {
            if (section === 'settings') {
                const global = await SettingsService.fetchGlobalSettings();
                if (global) {
                    setSettingsData({
                        ...DEFAULT_VISUAL_SETTINGS,
                        ...global.site,
                        ...global.typography,
                        ...global.system
                    });
                    if (typeof global.system?.sidebarPersistent === 'boolean') {
                        setSidebarPersistent(global.system.sidebarPersistent);
                    }
                } else {
                    setSettingsData((prev) => ({
                        ...prev,
                        ...DEFAULT_VISUAL_SETTINGS
                    }));
                }
                if (trackRead) trackRead(1, 'Fetched global settings');
                return;
            }

            const data = await ContentService.fetchSection(section, trackRead);
            if (data) {
                switch (section) {
                    case 'home': setHomeData(prev => ({ ...prev, ...data })); break;
                    case 'about':
                        setAboutData({
                            bio: data.bio || '',
                            skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || '')
                        });
                        break;
                    case 'contact': setContactData(prev => ({ ...prev, ...data })); break;
                    default: break;
                }
            }
        } catch (error) { console.error(`Error fetching ${section}:`, error); }
    }, [trackRead]);

    const saveSectionData = useCallback(async (section, data) => {
        if (!checkActionAllowed(ACTIONS.EDIT, section)) {
            return showToast(t('admin.common.noPermissionAction'), "error");
        }

        await execute(async () => {
            if (section === 'settings') {
                const fontCategories = SettingsService.constructor.DEFAULT_TYPOGRAPHY_METADATA?.fontCategories || [];
                const typographyKeys = [
                    ...fontCategories.flatMap(({ field, sizeField, weightField, italicField }) => [
                        field,
                        sizeField,
                        weightField,
                        italicField
                    ]),
                    'fontSize', 'adminFontOverride'
                ];
                const systemKeys = ['sidebarPersistent', 'notificationsEnabled'];

                const typography = {};
                const system = {};
                const site = {};

                Object.keys(data).forEach(k => {
                    if (typographyKeys.includes(k)) typography[k] = data[k];
                    else if (systemKeys.includes(k)) system[k] = data[k];
                    else site[k] = data[k];
                });

                await SettingsService.updateGlobalSettings({ site, typography, system }, trackWrite);
                queryClient.invalidateQueries({ queryKey: ['settings', 'global'] });
            } else {
                await ContentService.saveSection(section, data, trackWrite);
                queryClient.invalidateQueries({ queryKey: ['content', section] });
            }
        }, {
            showToast,
            successMessage: section === 'settings'
                ? t('admin.common.settingsSaved')
                : t('admin.common.sectionSaved', { section: section.charAt(0).toUpperCase() + section.slice(1) }),
            errorMessage: t('admin.common.saveSectionFailed', { section })
        });
    }, [checkActionAllowed, execute, queryClient, showToast, t, trackWrite]);

    return {
        homeData,
        setHomeData,
        aboutData,
        setAboutData,
        contactData,
        setContactData,
        settingsData,
        setSettingsData,
        sidebarPersistent,
        setSidebarPersistent,
        fetchSectionData,
        saveSectionData
    };
};

export default useAdminContent;

