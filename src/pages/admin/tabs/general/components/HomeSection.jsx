import React from 'react';
import { Home, Save, History } from 'lucide-react';
import { Button } from '../../../../../shared/components/ui';
import FormRow from '../../../components/FormRow';
import FormInput from '../../../components/FormInput';
import FormMarkdownEditor from '../../../components/FormMarkdownEditor';
import FormDropzone from '../../../components/FormDropzone';
import styles from '../../../../Admin.module.scss';

const HomeSection = ({ 
    homeData, 
    setHomeData, 
    homeImage, 
    setHomeImage, 
    homePreview, 
    setHomePreview, 
    loading, 
    onSave, 
    onOpenHistory 
}) => {
    return (
        <div className="ui-card">
            <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                    <Home size={24} />
                </div>
                <div className={styles.titleMeta}>
                    <h3>Home Section</h3>
                    <p>Configure the main hero content of your landing page.</p>
                </div>
                <Button 
                    type="button" 
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('home', 'Home Section')} 
                    className={styles.historyBtn}
                >
                    <History size={16} /> <span>History</span>
                </Button>
            </div>
            <form onSubmit={onSave} className={styles.form}>
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
                    <Button type="submit" isLoading={loading} className="ui-button-block">
                        <Save size={18} /> Save
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default HomeSection;
