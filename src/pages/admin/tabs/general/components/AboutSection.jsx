import React from 'react';
import { User, Save, History } from 'lucide-react';
import { Button } from '../../../../../shared/components/ui';
import FormInput from '../../../components/FormInput';
import FormMarkdownEditor from '../../../components/FormMarkdownEditor';
import styles from '../../../../Admin.module.scss';

const AboutSection = ({ 
    aboutData, 
    setAboutData, 
    aboutPreview, 
    setAboutPreview, 
    loading, 
    onSave, 
    onOpenHistory 
}) => {
    return (
        <div className="ui-card">
            <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                    <User size={24} />
                </div>
                <div className={styles.titleMeta}>
                    <h3>About Section</h3>
                    <p>Update your biography, professional summary, and key skills.</p>
                </div>
                <Button 
                    type="button" 
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('about', 'About Section')} 
                    className={styles.historyBtn}
                >
                    <History size={16} /> <span>History</span>
                </Button>
            </div>
            <form onSubmit={onSave} className={styles.form}>
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
                    <Button type="submit" isLoading={loading} className="ui-button-block">
                        <Save size={18} /> Save
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AboutSection;
