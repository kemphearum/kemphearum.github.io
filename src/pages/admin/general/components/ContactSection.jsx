import React from 'react';
import { Mail, Save, History } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import { useTranslation } from '../../../../hooks/useTranslation';

const ContactSection = ({
    contactPreview,
    setContactPreview,
    loading,
    onOpenHistory
}) => {
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

    return (
        <div className="ui-card">
            <div className={'ui-cardHeader'}>
                <div className={'ui-icon-wrapper'}>
                    <Mail size={24} />
                </div>
                <div className={'ui-title-meta'}>
                    <h3>{tr('Contact Section', 'ផ្នែកទំនាក់ទំនង')}</h3>
                    <p>{tr('Manage the intro text displayed above your contact form.', 'គ្រប់គ្រងអត្ថបទណែនាំដែលបង្ហាញលើទម្រង់ទំនាក់ទំនង។')}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('contact', tr('Contact Section', 'ផ្នែកទំនាក់ទំនង'))}
                    className={'ui-history-btn'}
                >
                    <History size={16} /> <span>{tr('History', 'ប្រវត្តិ')}</span>
                </Button>
            </div>
            <div className={'ui-form'}>
                <div className="ui-generalSectionGrid ui-generalSectionGrid--compact">
                    <div className="ui-generalPrimary">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{tr('Contact intro', 'អត្ថបទណែនាំទំនាក់ទំនង')}</h4>
                                <p>{tr('Set the tone before visitors reach the form so expectations feel clear and welcoming.', 'កំណត់សម្លេងមុនពេលអ្នកទស្សនាដល់ទម្រង់ ដើម្បីឱ្យការរំពឹងទុកច្បាស់លាស់ និងរួសរាយ។')}</p>
                            </div>

                            <FormField
                                label={tr('Contact Intro (EN)', 'អត្ថបទណែនាំទំនាក់ទំនង (EN)')}
                                name="introTextEn"
                                validation={{ required: tr('English intro text is required', 'ត្រូវការអត្ថបទណែនាំជាភាសាអង់គ្លេស') }}
                            >
                                <FormMarkdownEditor
                                    id="contact-intro-en"
                                    placeholder={tr('The text shown above the contact form...', 'អត្ថបទដែលបង្ហាញនៅលើទម្រង់ទំនាក់ទំនង...')}
                                    isPreviewMode={contactPreview}
                                    onTogglePreview={() => setContactPreview(!contactPreview)}
                                    rows="4"
                                />
                            </FormField>

                            <FormField
                                label={tr('Contact Intro (KM)', 'អត្ថបទណែនាំទំនាក់ទំនង (KM)')}
                                name="introTextKm"
                            >
                                <FormMarkdownEditor
                                    id="contact-intro-km"
                                    placeholder={tr('Khmer intro text shown above the contact form...', 'អត្ថបទខ្មែរ ដែលបង្ហាញនៅលើទម្រង់ទំនាក់ទំនង...')}
                                    isPreviewMode={contactPreview}
                                    onTogglePreview={() => setContactPreview(!contactPreview)}
                                    rows="4"
                                />
                            </FormField>
                        </div>
                    </div>

                    <aside className="ui-generalAside">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{tr('Best practice', 'អនុវត្តល្អបំផុត')}</h4>
                                <p>{tr('Keep this copy short. It should invite contact, explain what people can reach out about, and reduce friction.', 'រក្សាអត្ថបទនេះឱ្យខ្លី។ វាគួរអញ្ជើញឱ្យទាក់ទង ពន្យល់ពីអ្វីដែលអាចទាក់ទងបាន និងកាត់បន្ថយការលំបាក។')}</p>
                            </div>
                        </div>
                    </aside>
                </div>
                <div className={'ui-formFooter'}>
                    <Button type="submit" isLoading={loading} className="ui-button-block">
                        <Save size={18} /> {tr('Save Contact Changes', 'រក្សាទុកការកែប្រែទំនាក់ទំនង')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ContactSection;
