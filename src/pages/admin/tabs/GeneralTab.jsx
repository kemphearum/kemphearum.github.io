import React, { useState } from 'react';
import { Home, User, Mail, History } from 'lucide-react';
import tabStyles from './general/GeneralTab.module.scss';
import ImageProcessingService from '../../../services/ImageProcessingService';
import HistoryModal from '../components/HistoryModal';
import ContentService from '../../../services/ContentService';
import { Tabs } from '../../../shared/components/ui';

// Section Components
import HomeSection from './general/components/HomeSection';
import AboutSection from './general/components/AboutSection';
import ContactSection from './general/components/ContactSection';

const GeneralTab = ({ homeData, setHomeData, aboutData, setAboutData, contactData, setContactData, loading, saveSectionData }) => {
    const [homeImage, setHomeImage] = useState(null);
    const [historyModal, setHistoryModal] = useState({ isOpen: false, recordId: null, title: '' });
    
    // Preview states for Markdown editors
    const [homePreview, setHomePreview] = useState(false);
    const [aboutPreview, setAboutPreview] = useState(false);
    const [contactPreview, setContactPreview] = useState(false);

    const handleSaveHome = async (e) => {
        e.preventDefault();
        let imageUrl = homeData.profileImageUrl;
        if (homeImage) {
            imageUrl = await ImageProcessingService.compress(homeImage);
        }
        await saveSectionData('home', { ...homeData, profileImageUrl: imageUrl });
        setHomeImage(null);
    };

    const handleSaveAbout = (e) => {
        e.preventDefault();
        const skillsArray = aboutData.skills.split(',').map(s => s.trim()).filter(s => s);
        saveSectionData('about', { bio: aboutData.bio, skills: skillsArray });
    };

    const handleSaveContact = (e) => {
        e.preventDefault();
        saveSectionData('contact', contactData);
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
                    <HomeSection 
                        homeData={homeData}
                        setHomeData={setHomeData}
                        homeImage={homeImage}
                        setHomeImage={setHomeImage}
                        homePreview={homePreview}
                        setHomePreview={setHomePreview}
                        loading={loading}
                        onSave={handleSaveHome}
                        onOpenHistory={handleOpenHistory}
                    />
                </Tabs.Content>

                <Tabs.Content value="about">
                    <AboutSection 
                        aboutData={aboutData}
                        setAboutData={setAboutData}
                        aboutPreview={aboutPreview}
                        setAboutPreview={setAboutPreview}
                        loading={loading}
                        onSave={handleSaveAbout}
                        onOpenHistory={handleOpenHistory}
                    />
                </Tabs.Content>

                <Tabs.Content value="contact">
                    <ContactSection 
                        contactData={contactData}
                        setContactData={setContactData}
                        contactPreview={contactPreview}
                        setContactPreview={setContactPreview}
                        loading={loading}
                        onSave={handleSaveContact}
                        onOpenHistory={handleOpenHistory}
                    />
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
