import React, { useState } from 'react';
import { Home, User, Mail } from 'lucide-react';
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
import { getLanguageValue } from '../../../utils/localization';

const GeneralTab = ({ homeData, aboutData, contactData, loading, saveSectionData }) => {
    const [historyModal, setHistoryModal] = useState({ isOpen: false, recordId: null, title: '' });
    const [activeSection, setActiveSection] = useState('home');
    
    // Preview states for Markdown editors
    const [homePreview, setHomePreview] = useState(false);
    const [aboutPreview, setAboutPreview] = useState(false);
    const [contactPreview, setContactPreview] = useState(false);

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

    const handleOpenHistory = (recordId, title) => {
        setHistoryModal({ isOpen: true, recordId, title });
    };

    const homeFormKey = `home:${getLanguageValue(homeData.greeting, 'en', true)}:${getLanguageValue(homeData.greeting, 'km', false)}:${getLanguageValue(homeData.name, 'en', true)}:${getLanguageValue(homeData.name, 'km', false)}:${getLanguageValue(homeData.subtitle, 'en', true)}:${getLanguageValue(homeData.subtitle, 'km', false)}:${getLanguageValue(homeData.description, 'en', true)}:${getLanguageValue(homeData.description, 'km', false)}:${getLanguageValue(homeData.ctaText, 'en', true)}:${getLanguageValue(homeData.ctaText, 'km', false)}:${homeData.ctaLink || ''}:${homeData.profileImageUrl || ''}`;
    const aboutFormKey = `about:${getLanguageValue(aboutData.bio, 'en', true)}:${getLanguageValue(aboutData.bio, 'km', false)}:${Array.isArray(aboutData.skills) ? aboutData.skills.join(',') : (aboutData.skills || '')}`;
    const contactFormKey = `contact:${getLanguageValue(contactData.introText, 'en', true)}:${getLanguageValue(contactData.introText, 'km', false)}`;
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
    const totalFilled = homeFilled + aboutFilled + contactFilled;
    const totalFields = 17;
    const sectionMeta = [
        {
            value: 'home',
            label: 'Home',
            description: 'Hero copy, CTA, and portrait',
            icon: Home,
            filled: homeFilled,
            total: 12
        },
        {
            value: 'about',
            label: 'About',
            description: 'Bio and skills snapshot',
            icon: User,
            filled: aboutFilled,
            total: 3
        },
        {
            value: 'contact',
            label: 'Contact',
            description: 'Intro text above the form',
            icon: Mail,
            filled: contactFilled,
            total: 2
        }
    ];

    return (
        <div className={tabStyles.tabContentFadeIn}>
            <div className={tabStyles.workspaceShell}>
                <div className={tabStyles.workspaceIntro}>
                    <div className={tabStyles.workspaceCopy}>
                        <span className={tabStyles.workspaceEyebrow}>Content Studio</span>
                        <h2>Manage the core sections visitors read first.</h2>
                        <p>Update your hero messaging, biography, and contact intro from one place, with clearer section progress and less visual clutter.</p>
                    </div>
                    <div className={tabStyles.workspaceStats}>
                        <div className={tabStyles.workspaceStat}>
                            <span className={tabStyles.workspaceStatValue}>3</span>
                            <span className={tabStyles.workspaceStatLabel}>Sections</span>
                            <span className={tabStyles.workspaceStatHint}>Home, About, and Contact</span>
                        </div>
                        <div className={tabStyles.workspaceStat}>
                            <span className={tabStyles.workspaceStatValue}>{totalFilled}/{totalFields}</span>
                            <span className={tabStyles.workspaceStatLabel}>Fields Filled</span>
                            <span className={tabStyles.workspaceStatHint}>Quick signal for content completeness</span>
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
