import React, { useState } from 'react';
import { Upload, Home, User, Mail, Save, Edit3 } from 'lucide-react';
import styles from '../../Admin.module.scss';

const GeneralTab = ({ homeData, setHomeData, aboutData, setAboutData, contactData, setContactData, loading, saveSectionData, compressImageToBase64 }) => {
    const [homeImage, setHomeImage] = useState(null);

    const handleSaveHome = async (e) => {
        e.preventDefault();
        let imageUrl = homeData.profileImageUrl;
        if (homeImage) {
            imageUrl = await compressImageToBase64(homeImage);
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
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>Home Section</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Configure the main hero content of your landing page.</p>
                    </div>
                </div>
                <form onSubmit={handleSaveHome} className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                            <label>Greeting</label>
                            <input type="text" placeholder="Hello, I am" value={homeData.greeting} onChange={(e) => setHomeData({ ...homeData, greeting: e.target.value })} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Name</label>
                            <input type="text" placeholder="Your Name" value={homeData.name} onChange={(e) => setHomeData({ ...homeData, name: e.target.value })} />
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Subtitle</label>
                        <input type="text" placeholder="Your Profession" value={homeData.subtitle} onChange={(e) => setHomeData({ ...homeData, subtitle: e.target.value })} />
                    </div>
                    <div className={styles.inputGroup}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            <Edit3 size={16} />
                            <label style={{ margin: 0 }}>Description</label>
                        </div>
                        <textarea
                            placeholder="Tell people about yourself..."
                            value={homeData.description}
                            onChange={(e) => setHomeData({ ...homeData, description: e.target.value })}
                            rows="5"
                            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.9rem', lineHeight: '1.7', padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', borderRadius: '12px', color: 'var(--text-primary)', width: '100%', resize: 'vertical' }}
                        />
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                            <label>CTA Text</label>
                            <input type="text" placeholder="View My Work" value={homeData.ctaText} onChange={(e) => setHomeData({ ...homeData, ctaText: e.target.value })} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>CTA Link</label>
                            <input type="text" placeholder="#experience" value={homeData.ctaLink} onChange={(e) => setHomeData({ ...homeData, ctaLink: e.target.value })} />
                        </div>
                    </div>
                    <div className={styles.fileInputGroup}>
                        <label>Profile Image <span className={styles.hint}>(leave empty to keep current)</span></label>
                        <div className={styles.fileDropzone}>
                            <input type="file" accept="image/*" onChange={(e) => setHomeImage(e.target.files[0])} />
                            <div className={styles.fileDropzoneContent}>
                                <Upload size={24} />
                                <span>{homeImage ? homeImage.name : 'Upload Image'}</span>
                            </div>
                        </div>
                    </div>
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
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>About Section</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Update your short biography and technical skills.</p>
                    </div>
                </div>
                <form onSubmit={handleSaveAbout} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            <Edit3 size={16} />
                            <label style={{ margin: 0 }}>Bio</label>
                        </div>
                        <textarea
                            placeholder="Write your bio..."
                            value={aboutData.bio}
                            onChange={(e) => setAboutData({ ...aboutData, bio: e.target.value })}
                            rows="8"
                            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.9rem', lineHeight: '1.7', padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', borderRadius: '12px', color: 'var(--text-primary)', width: '100%', resize: 'vertical' }}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Skills <span className={styles.hint}>(comma separated)</span></label>
                        <input type="text" placeholder="React, Python, Firebase, ..." value={aboutData.skills} onChange={(e) => setAboutData({ ...aboutData, skills: e.target.value })} />
                        {aboutData.skills && (
                            <div className={styles.skillPreview}>
                                {aboutData.skills.split(',').map((s, i) => s.trim() && (
                                    <span key={`skill-${s.trim()}-${i}`} className={styles.techTag}>{s.trim()}</span>
                                ))}
                            </div>
                        )}
                    </div>
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
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>Contact Section</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Manage the intro text displayed above your contact form.</p>
                    </div>
                </div>
                <form onSubmit={handleSaveContact} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            <Edit3 size={16} />
                            <label style={{ margin: 0 }}>Intro Text</label>
                        </div>
                        <textarea
                            placeholder="The text shown above the contact form..."
                            value={contactData.introText}
                            onChange={(e) => setContactData({ ...contactData, introText: e.target.value })}
                            rows="4"
                            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.9rem', lineHeight: '1.7', padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', borderRadius: '12px', color: 'var(--text-primary)', width: '100%', resize: 'vertical' }}
                        />
                    </div>
                    <div className={styles.formFooter}>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GeneralTab;
