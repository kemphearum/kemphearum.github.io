import React from 'react';
import { Mail, Save, History } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';

const ContactSection = ({ 
    contactPreview, 
    setContactPreview, 
    loading, 
    onOpenHistory 
}) => {
    return (
        <div className="ui-card">
            <div className={'ui-cardHeader'}>
                <div className={'ui-icon-wrapper'}>
                    <Mail size={24} />
                </div>
                <div className={'ui-title-meta'}>
                    <h3>Contact Section</h3>
                    <p>Manage the intro text displayed above your contact form.</p>
                </div>
                <Button 
                    type="button" 
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('contact', 'Contact Section')} 
                    className={'ui-history-btn'}
                >
                    <History size={16} /> <span>History</span>
                </Button>
            </div>
            <div className={'ui-form'}>
                <div className="ui-generalSectionGrid ui-generalSectionGrid--compact">
                    <div className="ui-generalPrimary">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>Contact intro</h4>
                                <p>Set the tone before visitors reach the form so expectations feel clear and welcoming.</p>
                            </div>

                            <FormField
                                label="Contact Form Introduction"
                                name="introText"
                                validation={{ required: 'Intro text is required' }}
                            >
                                <FormMarkdownEditor
                                    id="contact-intro"
                                    placeholder="The text shown above the contact form..."
                                    isPreviewMode={contactPreview}
                                    onTogglePreview={() => setContactPreview(!contactPreview)}
                                    rows="6"
                                />
                            </FormField>
                        </div>
                    </div>

                    <aside className="ui-generalAside">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>Best practice</h4>
                                <p>Keep this copy short. It should invite contact, explain what people can reach out about, and reduce friction.</p>
                            </div>
                        </div>
                    </aside>
                </div>
                <div className={'ui-formFooter'}>
                    <Button type="submit" isLoading={loading} className="ui-button-block">
                        <Save size={18} /> Save Contact Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ContactSection;
