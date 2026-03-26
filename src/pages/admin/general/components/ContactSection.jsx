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
    const { t } = useTranslation();

    return (
        <div className="ui-card">
            <div className={'ui-cardHeader'}>
                <div className={'ui-icon-wrapper'}>
                    <Mail size={24} />
                </div>
                <div className={'ui-title-meta'}>
                    <h3>{t('admin.general.sections.contact.title')}</h3>
                    <p>{t('admin.general.sections.contact.description')}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('contact', t('admin.general.sections.contact.title'))}
                    className={'ui-history-btn'}
                >
                    <History size={16} /> <span>{t('admin.general.sections.contact.history')}</span>
                </Button>
            </div>
            <div className={'ui-form'}>
                <div className="ui-generalSectionGrid ui-generalSectionGrid--compact">
                    <div className="ui-generalPrimary">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{t('admin.general.sections.contact.intro.title')}</h4>
                                <p>{t('admin.general.sections.contact.intro.description')}</p>
                            </div>

                            <FormField
                                label={t('admin.general.sections.contact.fields.introEn')}
                                name="introTextEn"
                                validation={{ required: t('admin.general.sections.contact.fields.introRequired') }}
                            >
                                <FormMarkdownEditor
                                    id="contact-intro-en"
                                    placeholder={t('admin.general.sections.contact.fields.introPlaceholderEn')}
                                    isPreviewMode={contactPreview}
                                    onTogglePreview={() => setContactPreview(!contactPreview)}
                                    rows="4"
                                />
                            </FormField>

                            <FormField
                                label={t('admin.general.sections.contact.fields.introKm')}
                                name="introTextKm"
                            >
                                <FormMarkdownEditor
                                    id="contact-intro-km"
                                    placeholder={t('admin.general.sections.contact.fields.introPlaceholderKm')}
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
                                <h4>{t('admin.general.sections.contact.bestPractice.title')}</h4>
                                <p>{t('admin.general.sections.contact.bestPractice.description')}</p>
                            </div>
                        </div>
                    </aside>
                </div>
                <div className={'ui-formFooter'}>
                    <Button type="submit" isLoading={loading} className="ui-button-block">
                        <Save size={18} /> {t('admin.general.sections.contact.save')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ContactSection;
