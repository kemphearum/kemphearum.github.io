import React from 'react';
import { Mail, Save, History } from 'lucide-react';
import { Button } from '../../../../../shared/components/ui';
import FormMarkdownEditor from '../../../components/FormMarkdownEditor';
import styles from '../../../../Admin.module.scss';

const ContactSection = ({ 
    contactData, 
    setContactData, 
    contactPreview, 
    setContactPreview, 
    loading, 
    onSave, 
    onOpenHistory 
}) => {
    return (
        <div className="ui-card">
            <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                    <Mail size={24} />
                </div>
                <div className={styles.titleMeta}>
                    <h3>Contact Section</h3>
                    <p>Manage the intro text displayed above your contact form.</p>
                </div>
                <Button 
                    type="button" 
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('contact', 'Contact Section')} 
                    className={styles.historyBtn}
                >
                    <History size={16} /> <span>History</span>
                </Button>
            </div>
            <form onSubmit={onSave} className={styles.form}>
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
                    <Button type="submit" isLoading={loading} className="ui-button-block">
                        <Save size={18} /> Save
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ContactSection;
