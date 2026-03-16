import React, { useState } from 'react';
import { Upload, Home, User, Mail, Save, Edit3, History } from 'lucide-react';
import styles from '../../Admin.module.scss';
import ImageProcessingService from '../../../services/ImageProcessingService';
import HistoryModal from '../components/HistoryModal';
import ContentService from '../../../services/ContentService';
import FormRow from '../components/FormRow';
import FormInput from '../components/FormInput';
import FormTextArea from '../components/FormTextArea';
import FormMarkdownEditor from '../components/FormMarkdownEditor';
import FormDropzone from '../components/FormDropzone';

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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.iconWrapper}>
                        <Home size={24} />
                    </div>
                    <div className={styles.titleMeta}>
                        <h3>Home Section</h3>
                        <p>Configure the main hero content of your landing page.</p>
                    </div>
                    <button type="button" onClick={() => setHistoryModal({ isOpen: true, recordId: 'home', title: 'Home Section' })} className={styles.historyBtn}>
                        <History size={16} /> <span>History</span>
                    </button>
                </div>
                <form onSubmit={handleSaveHome} className={styles.form}>
                    <FormRow>
                        <FormInput
                            label="Greeting"
                            placeholder="Hello, I am"
                            value={homeData.greeting}
                            onChange={(e) => setHomeData({ ...homeData, greeting: e.target.value })}
                        />
                        <FormInput
                            label="Name"
                            placeholder="Your Name"
                            value={homeData.name}
                            onChange={(e) => setHomeData({ ...homeData, name: e.target.value })}
                        />
                    </FormRow>

                    <FormInput
                        label="Subtitle"
                        placeholder="Your Profession"
                        value={homeData.subtitle}
                        onChange={(e) => setHomeData({ ...homeData, subtitle: e.target.value })}
                    />

                    <FormMarkdownEditor
                        label="Description"
                        id="home-description"
                        placeholder="Tell people about yourself..."
                        value={homeData.description}
                        onChange={(e) => setHomeData({ ...homeData, description: e.target.value })}
                        isPreviewMode={homePreview}
                        onTogglePreview={() => setHomePreview(!homePreview)}
                        rows="8"
                    />

                    <FormRow>
                        <FormInput
                            label="CTA Text"
                            placeholder="View My Work"
                            value={homeData.ctaText}
                            onChange={(e) => setHomeData({ ...homeData, ctaText: e.target.value })}
                        />
                        <FormInput
                            label="CTA Link"
                            placeholder="#experience"
                            value={homeData.ctaLink}
                            onChange={(e) => setHomeData({ ...homeData, ctaLink: e.target.value })}
                        />
                    </FormRow>

                    <FormDropzone
                        label="Profile Image"
                        hint="leave empty to keep current"
                        file={homeImage}
                        onFileChange={setHomeImage}
                        currentImageUrl={homeData.profileImageUrl}
                        onClearExisting={() => setHomeData({ ...homeData, profileImageUrl: '' })}
                        circular={true}
                        aspectRatio="1/1"
                    />

                    <div className={styles.formFooter}>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                        </button>
                    </div>
                </form>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.iconWrapper}>
                        <User size={24} />
                    </div>
                    <div className={styles.titleMeta}>
                        <h3>About Section</h3>
                        <p>Update your biography, professional summary, and key skills.</p>
                    </div>
                    <button type="button" onClick={() => setHistoryModal({ isOpen: true, recordId: 'about', title: 'About Section' })} className={styles.historyBtn}>
                        <History size={16} /> <span>History</span>
                    </button>
                </div>
                <form onSubmit={handleSaveAbout} className={styles.form}>
                    <FormMarkdownEditor
                        label="Bio"
                        id="about-bio"
                        placeholder="Write your bio..."
                        value={aboutData.bio}
                        onChange={(e) => setAboutData({ ...aboutData, bio: e.target.value })}
                        isPreviewMode={aboutPreview}
                        onTogglePreview={() => setAboutPreview(!aboutPreview)}
                        rows="12"
                    />

                    <FormInput
                        label="Skills"
                        hint="comma separated"
                        placeholder="React, Python, Firebase, ..."
                        value={aboutData.skills}
                        onChange={(e) => setAboutData({ ...aboutData, skills: e.target.value })}
                    />

                    {aboutData.skills && (
                        <div className={styles.skillPreview}>
                            {aboutData.skills.split(',').map((s, i) => s.trim() && (
                                <span key={`skill-${s.trim()}-${i}`} className={styles.techTag}>{s.trim()}</span>
                            ))}
                        </div>
                    )}

                    <div className={styles.formFooter}>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                        </button>
                    </div>
                </form>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.iconWrapper}>
                        <Mail size={24} />
                    </div>
                    <div className={styles.titleMeta}>
                        <h3>Contact Section</h3>
                        <p>Manage the intro text displayed above your contact form.</p>
                    </div>
                    <button type="button" onClick={() => setHistoryModal({ isOpen: true, recordId: 'contact', title: 'Contact Section' })} className={styles.historyBtn}>
                        <History size={16} /> <span>History</span>
                    </button>
                </div>
                <form onSubmit={handleSaveContact} className={styles.form}>
                    <FormMarkdownEditor
                        label="Intro Text"
                        id="contact-intro"
                        placeholder="The text shown above the contact form..."
                        value={contactData.introText}
                        onChange={(e) => setContactData({ ...contactData, introText: e.target.value })}
                        isPreviewMode={contactPreview}
                        onTogglePreview={() => setContactPreview(!contactPreview)}
                        rows="6"
                    />
                    <div className={styles.formFooter}>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                        </button>
                    </div>
                </form>
            </div>

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
