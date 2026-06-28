import React, { useState } from 'react';
import { Home, User, Mail, IdCard } from 'lucide-react';
import tabStyles from './GeneralTab.module.scss';
import ImageProcessingService from '../../../services/ImageProcessingService';
import HistoryModal from '../components/HistoryModal';
import ContentService from '../../../services/ContentService';
import { Tabs } from '@/shared/components/ui';
import Form from '../components/Form';

// Section Components
import HomeSection from './components/HomeSection';
import AboutSection from './components/AboutSection';
import ContactSection from './components/ContactSection';
import ProfileSection from './components/ProfileSection';
import { getLanguageValue } from '../../../utils/localization';
import { useTranslation } from '../../../hooks/useTranslation';
import { ACTIONS, MODULES } from '../../../utils/permissions';


const GeneralTab = ({ homeData, aboutData, contactData, profileData, loading, saveSectionData, isActionAllowed }) => {

    const { t } = useTranslation();
    const [historyModal, setHistoryModal] = useState({ isOpen: false, recordId: null, title: '' });
    const [activeSection, setActiveSection] = useState('home');
    
    // Preview states for Markdown editors
    const [homePreview, setHomePreview] = useState(false);
    const [aboutPreview, setAboutPreview] = useState(false);
    const [contactPreview, setContactPreview] = useState(false);
    const [profilePreview, setProfilePreview] = useState(false);

    const canEdit = isActionAllowed(ACTIONS.EDIT, MODULES.GENERAL);
    const canViewHistory = isActionAllowed(ACTIONS.VIEW_HISTORY, MODULES.GENERAL);


    const handleSaveHome = async (data) => {
        let imageUrl = homeData.profileImageUrl;
        if (data.image) {
            imageUrl = await ImageProcessingService.compress(data.image);
        }
        // Remove the file object before saving to Firestore
        const { image: _image, ...rest } = data;
        await saveSectionData('home', {
            greeting: {
                en: (rest.greetingEn || '').trim(),
                km: (rest.greetingKm || '').trim()
            },
            name: {
                en: (rest.nameEn || '').trim(),
                km: (rest.nameKm || '').trim()
            },
            subtitle: {
                en: (rest.subtitleEn || '').trim(),
                km: (rest.subtitleKm || '').trim()
            },
            description: {
                en: (rest.descriptionEn || '').trim(),
                km: (rest.descriptionKm || '').trim()
            },
            ctaText: {
                en: (rest.ctaTextEn || '').trim(),
                km: (rest.ctaTextKm || '').trim()
            },
            ctaLink: (rest.ctaLink || '').trim(),
            profileImageUrl: imageUrl
        });
    };

    const handleSaveAbout = async (data) => {
        const skillsArray = data.skills.split(',').map(s => s.trim()).filter(s => s);
        await saveSectionData('about', {
            bio: {
                en: (data.bioEn || '').trim(),
                km: (data.bioKm || '').trim()
            },
            skills: skillsArray
        });
    };

    const handleSaveContact = async (data) => {
        await saveSectionData('contact', {
            introText: {
                en: (data.introTextEn || '').trim(),
                km: (data.introTextKm || '').trim()
            }
        });
    };

    const handleSaveProfile = async (data) => {
        const splitComma = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);
        const splitLines = (v) => (v || '').split('\n').map((s) => s.trim()).filter(Boolean);
        const loc = (en, km) => ({ en: (en || '').trim(), km: (km || '').trim() });
        await saveSectionData('profileInfo', {
            summary: loc(data.summaryEn, data.summaryKm),
            currentRole: loc(data.currentRoleEn, data.currentRoleKm),
            location: loc(data.locationEn, data.locationKm),
            availabilityMessage: loc(data.availabilityMessageEn, data.availabilityMessageKm),
            responseTime: loc(data.responseTimeEn, data.responseTimeKm),
            clearance: loc(data.clearanceEn, data.clearanceKm),
            resumeHeadline: loc(data.resumeHeadlineEn, data.resumeHeadlineKm),
            yearsExperienceOverride: data.yearsExperienceOverride,
            workTypes: splitComma(data.workTypes),
            languages: splitComma(data.languages),
            industries: splitComma(data.industries),
            accomplishments: splitLines(data.accomplishments),
            oss: splitLines(data.oss),
            community: splitLines(data.community)
        });
    };

    const handleOpenHistory = (recordId, title) => {
        if (!canViewHistory) return;
        setHistoryModal({ isOpen: true, recordId, title });
    };

    const homeFormKey = `home:${getLanguageValue(homeData.greeting, 'en', true)}:${getLanguageValue(homeData.greeting, 'km', false)}:${getLanguageValue(homeData.name, 'en', true)}:${getLanguageValue(homeData.name, 'km', false)}:${getLanguageValue(homeData.subtitle, 'en', true)}:${getLanguageValue(homeData.subtitle, 'km', false)}:${getLanguageValue(homeData.description, 'en', true)}:${getLanguageValue(homeData.description, 'km', false)}:${getLanguageValue(homeData.ctaText, 'en', true)}:${getLanguageValue(homeData.ctaText, 'km', false)}:${homeData.ctaLink || ''}:${homeData.profileImageUrl || ''}`;
    const aboutFormKey = `about:${getLanguageValue(aboutData.bio, 'en', true)}:${getLanguageValue(aboutData.bio, 'km', false)}:${Array.isArray(aboutData.skills) ? aboutData.skills.join(',') : (aboutData.skills || '')}`;
    const contactFormKey = `contact:${getLanguageValue(contactData.introText, 'en', true)}:${getLanguageValue(contactData.introText, 'km', false)}`;
    const profile = profileData || {};
    const asCsv = (value) => (Array.isArray(value) ? value.join(', ') : (value || ''));
    const asLines = (value) => (Array.isArray(value) ? value.join('\n') : (value || ''));
    const profileFormKey = `profile:${getLanguageValue(profile.summary, 'en', true)}:${getLanguageValue(profile.currentRole, 'en', true)}:${profile.availabilityStatus || ''}:${asCsv(profile.languages)}:${(profile.accomplishments || []).length}`;
    const profileFilled = [
        getLanguageValue(profile.summary, 'en', true),
        getLanguageValue(profile.currentRole, 'en', true),
        getLanguageValue(profile.location, 'en', true),
        asCsv(profile.workTypes),
        asCsv(profile.languages),
        asCsv(profile.industries),
        asLines(profile.accomplishments)
    ].filter(Boolean).length;
    const homeFilled = [
        getLanguageValue(homeData.greeting, 'en', true),
        getLanguageValue(homeData.greeting, 'km', false),
        getLanguageValue(homeData.name, 'en', true),
        getLanguageValue(homeData.name, 'km', false),
        getLanguageValue(homeData.subtitle, 'en', true),
        getLanguageValue(homeData.subtitle, 'km', false),
        getLanguageValue(homeData.description, 'en', true),
        getLanguageValue(homeData.description, 'km', false),
        getLanguageValue(homeData.ctaText, 'en', true),
        getLanguageValue(homeData.ctaText, 'km', false),
        homeData.ctaLink,
        homeData.profileImageUrl
    ].filter(Boolean).length;
    const aboutFilled = [
        getLanguageValue(aboutData.bio, 'en', true),
        getLanguageValue(aboutData.bio, 'km', false),
        Array.isArray(aboutData.skills) ? aboutData.skills.length > 0 : aboutData.skills
    ].filter(Boolean).length;
    const contactFilled = [
        getLanguageValue(contactData.introText, 'en', true),
        getLanguageValue(contactData.introText, 'km', false)
    ].filter(Boolean).length;
    const totalFilled = homeFilled + aboutFilled + contactFilled + profileFilled;
    const totalFields = 27;
    const sectionMeta = [
        {
            value: 'home',
            label: t('admin.tabs.homeSection'),
            description: t('admin.general.sectionDescriptions.home'),
            icon: Home,
            filled: homeFilled,
            total: 12
        },
        {
            value: 'about',
            label: t('admin.tabs.aboutSection'),
            description: t('admin.general.sectionDescriptions.about'),
            icon: User,
            filled: aboutFilled,
            total: 3
        },
        {
            value: 'contact',
            label: t('admin.tabs.contactSection'),
            description: t('admin.general.sectionDescriptions.contact'),
            icon: Mail,
            filled: contactFilled,
            total: 2
        },
        {
            value: 'profile',
            label: t('admin.tabs.profileSection'),
            description: t('admin.general.sectionDescriptions.profile'),
            icon: IdCard,
            filled: profileFilled,
            total: 7
        }
    ];

    return (
        <div className={tabStyles.tabContentFadeIn}>
            <div className={tabStyles.workspaceShell}>
                <div className={tabStyles.workspaceIntro}>
                    <div className={tabStyles.workspaceCopy}>
                        <span className={tabStyles.workspaceEyebrow}>{t('admin.general.workspace.eyebrow')}</span>
                        <h2>{t('admin.general.workspace.title')}</h2>
                        <p>{t('admin.general.workspace.description')}</p>
                    </div>
                    <div className={tabStyles.workspaceStats}>
                        <div className={tabStyles.workspaceStat}>
                            <span className={tabStyles.workspaceStatValue}>4</span>
                            <span className={tabStyles.workspaceStatLabel}>{t('admin.general.workspace.sectionsLabel')}</span>
                            <span className={tabStyles.workspaceStatHint}>{t('admin.general.workspace.sectionsHint')}</span>
                        </div>
                        <div className={tabStyles.workspaceStat}>
                            <span className={tabStyles.workspaceStatValue}>{totalFilled}/{totalFields}</span>
                            <span className={tabStyles.workspaceStatLabel}>{t('admin.general.workspace.fieldsFilledLabel')}</span>
                            <span className={tabStyles.workspaceStatHint}>{t('admin.general.workspace.fieldsFilledHint')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeSection} onValueChange={setActiveSection} className={tabStyles.subTabNav}>
                <Tabs.List className={tabStyles.subtabsList}>
                    {sectionMeta.map((section) => {
                        const SectionIcon = section.icon;

                        return (
                            <Tabs.Trigger key={section.value} value={section.value} className={tabStyles.subTabTrigger}>
                                <span className={tabStyles.triggerIcon}><SectionIcon size={18} /></span>
                                <span className={tabStyles.triggerBody}>
                                    <span className={tabStyles.triggerTitleRow}>
                                        <strong>{section.label}</strong>
                                        <span className={tabStyles.triggerCount}>{section.filled}/{section.total}</span>
                                    </span>
                                    <span className={tabStyles.triggerDescription}>{section.description}</span>
                                </span>
                            </Tabs.Trigger>
                        );
                    })}
                </Tabs.List>

                <Tabs.Content value="home" className={tabStyles.tabPanel}>
                    <Form 
                        onSubmit={handleSaveHome}
                        key={homeFormKey}
                        defaultValues={{
                            greetingEn: getLanguageValue(homeData.greeting, 'en', true),
                            greetingKm: getLanguageValue(homeData.greeting, 'km', false),
                            nameEn: getLanguageValue(homeData.name, 'en', true),
                            nameKm: getLanguageValue(homeData.name, 'km', false),
                            subtitleEn: getLanguageValue(homeData.subtitle, 'en', true),
                            subtitleKm: getLanguageValue(homeData.subtitle, 'km', false),
                            descriptionEn: getLanguageValue(homeData.description, 'en', true),
                            descriptionKm: getLanguageValue(homeData.description, 'km', false),
                            ctaTextEn: getLanguageValue(homeData.ctaText, 'en', true),
                            ctaTextKm: getLanguageValue(homeData.ctaText, 'km', false),
                            ctaLink: homeData.ctaLink || '',
                            image: null
                        }}
                    >
                        <HomeSection 
                            homePreview={homePreview}
                            setHomePreview={setHomePreview}
                            loading={loading}
                            onOpenHistory={handleOpenHistory}
                            currentImageUrl={homeData.profileImageUrl}
                            canEdit={canEdit}
                            canViewHistory={canViewHistory}
                        />

                    </Form>
                </Tabs.Content>

                <Tabs.Content value="about" className={tabStyles.tabPanel}>
                    <Form 
                        onSubmit={handleSaveAbout}
                        key={aboutFormKey}
                        defaultValues={{
                            bioEn: getLanguageValue(aboutData.bio, 'en', true),
                            bioKm: getLanguageValue(aboutData.bio, 'km', false),
                            skills: Array.isArray(aboutData.skills) ? aboutData.skills.join(', ') : (aboutData.skills || '')
                        }}
                    >
                        <AboutSection 
                            aboutPreview={aboutPreview}
                            setAboutPreview={setAboutPreview}
                            loading={loading}
                            onOpenHistory={handleOpenHistory}
                            canEdit={canEdit}
                            canViewHistory={canViewHistory}
                        />

                    </Form>
                </Tabs.Content>

                <Tabs.Content value="contact" className={tabStyles.tabPanel}>
                    <Form 
                        onSubmit={handleSaveContact}
                        key={contactFormKey}
                        defaultValues={{
                            introTextEn: getLanguageValue(contactData.introText, 'en', true),
                            introTextKm: getLanguageValue(contactData.introText, 'km', false)
                        }}
                    >
                        <ContactSection
                            contactPreview={contactPreview}
                            setContactPreview={setContactPreview}
                            loading={loading}
                            onOpenHistory={handleOpenHistory}
                            canEdit={canEdit}
                            canViewHistory={canViewHistory}
                        />

                    </Form>
                </Tabs.Content>

                <Tabs.Content value="profile" className={tabStyles.tabPanel}>
                    <Form
                        onSubmit={handleSaveProfile}
                        key={profileFormKey}
                        defaultValues={{
                            summaryEn: getLanguageValue(profile.summary, 'en', true),
                            summaryKm: getLanguageValue(profile.summary, 'km', false),
                            currentRoleEn: getLanguageValue(profile.currentRole, 'en', true),
                            currentRoleKm: getLanguageValue(profile.currentRole, 'km', false),
                            locationEn: getLanguageValue(profile.location, 'en', true),
                            locationKm: getLanguageValue(profile.location, 'km', false),
                            availabilityMessageEn: getLanguageValue(profile.availabilityMessage, 'en', true),
                            availabilityMessageKm: getLanguageValue(profile.availabilityMessage, 'km', false),
                            responseTimeEn: getLanguageValue(profile.responseTime, 'en', true),
                            responseTimeKm: getLanguageValue(profile.responseTime, 'km', false),
                            clearanceEn: getLanguageValue(profile.clearance, 'en', true),
                            clearanceKm: getLanguageValue(profile.clearance, 'km', false),
                            resumeHeadlineEn: getLanguageValue(profile.resumeHeadline, 'en', true),
                            resumeHeadlineKm: getLanguageValue(profile.resumeHeadline, 'km', false),
                            availabilityStatus: profile.availabilityStatus || '',
                            timezone: profile.timezone || '',
                            yearsExperienceOverride: profile.yearsExperienceOverride || '',
                            workTypes: asCsv(profile.workTypes),
                            preferredContact: asCsv(profile.preferredContact),
                            languages: asCsv(profile.languages),
                            industries: asCsv(profile.industries),
                            accomplishments: asLines(profile.accomplishments),
                            oss: asLines(profile.oss),
                            community: asLines(profile.community)
                        }}
                    >
                        <ProfileSection
                            profilePreview={profilePreview}
                            setProfilePreview={setProfilePreview}
                            loading={loading}
                            onOpenHistory={handleOpenHistory}
                            canEdit={canEdit}
                            canViewHistory={canViewHistory}
                        />

                    </Form>
                </Tabs.Content>
            </Tabs>

            <HistoryModal
                isOpen={historyModal.isOpen}
                onClose={() => setHistoryModal({ isOpen: false, recordId: null, title: '' })}
                recordId={historyModal.recordId}
                service={ContentService}
                title={historyModal.title}
            />
        </div>
    );
};

export default GeneralTab;
