import React, { useState } from 'react';
import { Upload, Home, User, Mail, Save, Edit3, History } from 'lucide-react';
import styles from '../../Admin.module.scss';
import ImageProcessingService from '../../../services/ImageProcessingService';
import HistoryModal from '../components/HistoryModal';
import ContentService from '../../../services/ContentService';
import FormRow from '../components/FormRow';
import FormInput from '../components/FormInput';
import FormTextArea from '../components/FormTextArea';
import FormDropzone from '../components/FormDropzone';

const GeneralTab = ({ homeData, setHomeData, aboutData, setAboutData, contactData, setContactData, loading, saveSectionData }) => {
    const [homeImage, setHomeImage] = useState(null);
    const [historyModal, setHistoryModal] = useState({ isOpen: false, recordId: null, title: '' });

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
                <div className={styles.cardHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.7rem', background: 'rgba(108, 99, 255, 0.08)', borderRadius: '10px', color: 'var(--primary-color)', display: 'flex' }}>
                        <Home size={22} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>Home Section</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Configure the main hero content of your landing page.</p>
                    </div>
                    <button onClick={() => setHistoryModal({ isOpen: true, recordId: 'home', title: 'Home Section' })} className={styles.editBtn} title="View Edit History">
                        <History size={16} /> History
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

                    <FormTextArea
                        label="Description"
                        icon={Edit3}
                        placeholder="Tell people about yourself..."
                        value={homeData.description}
                        onChange={(e) => setHomeData({ ...homeData, description: e.target.value })}
                        rows="5"
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
                    />

                    <div className={styles.formFooter}>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                        </button>
                    </div>
                </form>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.7rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', color: '#10b981', display: 'flex' }}>
                        <User size={22} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>About Section</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Update your short biography and technical skills.</p>
                    </div>
                    <button type="button" onClick={() => setHistoryModal({ isOpen: true, recordId: 'about', title: 'About Section' })} className={styles.editBtn} title="View Edit History">
                        <History size={16} /> History
                    </button>
                </div>
                <form onSubmit={handleSaveAbout} className={styles.form}>
                    <FormTextArea
                        label="Bio"
                        icon={Edit3}
                        placeholder="Write your bio..."
                        value={aboutData.bio}
                        onChange={(e) => setAboutData({ ...aboutData, bio: e.target.value })}
                        rows="8"
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
                <div className={styles.cardHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.7rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', color: '#ef4444', display: 'flex' }}>
                        <Mail size={22} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>Contact Section</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Manage the intro text displayed above your contact form.</p>
                    </div>
                    <button type="button" onClick={() => setHistoryModal({ isOpen: true, recordId: 'contact', title: 'Contact Section' })} className={styles.editBtn} title="View Edit History">
                        <History size={16} /> History
                    </button>
                </div>
                <form onSubmit={handleSaveContact} className={styles.form}>
                    <FormTextArea
                        label="Intro Text"
                        icon={Edit3}
                        placeholder="The text shown above the contact form..."
                        value={contactData.introText}
                        onChange={(e) => setContactData({ ...contactData, introText: e.target.value })}
                        rows="4"
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
