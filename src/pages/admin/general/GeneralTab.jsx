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

const GeneralTab = ({ homeData, aboutData, contactData, loading, saveSectionData }) => {
    const [historyModal, setHistoryModal] = useState({ isOpen: false, recordId: null, title: '' });
    
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
        const { image, ...rest } = data;
        await saveSectionData('home', { ...rest, profileImageUrl: imageUrl });
    };

    const handleSaveAbout = async (data) => {
        const skillsArray = data.skills.split(',').map(s => s.trim()).filter(s => s);
        await saveSectionData('about', { bio: data.bio, skills: skillsArray });
    };

    const handleSaveContact = async (data) => {
        await saveSectionData('contact', data);
    };

    const handleOpenHistory = (recordId, title) => {
        setHistoryModal({ isOpen: true, recordId, title });
    };

    return (
        <div className={tabStyles.tabContentFadeIn}>
            <Tabs defaultValue="home" className={tabStyles.subTabNav}>
                <Tabs.List className={tabStyles.subtabsList}>
                    <Tabs.Trigger value="home" className={tabStyles.subTabTrigger}>
                        <Home size={18} /> Home
                    </Tabs.Trigger>
                    <Tabs.Trigger value="about" className={tabStyles.subTabTrigger}>
                        <User size={18} /> About
                    </Tabs.Trigger>
                    <Tabs.Trigger value="contact" className={tabStyles.subTabTrigger}>
                        <Mail size={18} /> Contact
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="home">
                    <Form 
                        onSubmit={handleSaveHome}
                        defaultValues={{
                            greeting: homeData.greeting || '',
                            name: homeData.name || '',
                            subtitle: homeData.subtitle || '',
                            description: homeData.description || '',
                            ctaText: homeData.ctaText || '',
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

                <Tabs.Content value="about">
                    <Form 
                        onSubmit={handleSaveAbout}
                        defaultValues={{
                            bio: aboutData.bio || '',
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

                <Tabs.Content value="contact">
                    <Form 
                        onSubmit={handleSaveContact}
                        defaultValues={{
                            introText: contactData.introText || ''
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
