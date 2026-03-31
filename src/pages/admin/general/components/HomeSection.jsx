import React from 'react';
import { Home, Save, History } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormRow from '../../components/FormRow';
import FormInput from '../../components/FormInput';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import FormDropzone from '../../components/FormDropzone';
import { useTranslation } from '../../../../hooks/useTranslation';

const HomeSection = ({
    homePreview,
    setHomePreview,
    loading,
    onOpenHistory,
    currentImageUrl,
    canEdit = true
}) => {

    const { t } = useTranslation();

    return (
        <div className="ui-card">
            <div className={'ui-cardHeader'}>
                <div className={'ui-icon-wrapper'}>
                    <Home size={24} />
                </div>
                <div className={'ui-title-meta'}>
                    <h3>{t('admin.general.sections.home.title')}</h3>
                    <p>{t('admin.general.sections.home.description')}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('home', t('admin.general.sections.home.title'))}
                    className={'ui-history-btn'}
                >
                    <History size={16} /> <span>{t('admin.general.sections.home.history')}</span>
                </Button>
            </div>
            <div className={'ui-form'}>
                <div className="ui-generalSectionGrid">
                    <div className="ui-generalPrimary">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{t('admin.general.sections.home.heroCopy.title')}</h4>
                                <p>{t('admin.general.sections.home.heroCopy.description')}</p>
                            </div>

                            <FormRow>
                                <FormField label={t('admin.general.sections.home.fields.greetingEn')} name="greetingEn">
                                    <FormInput placeholder={t('admin.general.sections.home.fields.greetingPlaceholder')} />
                                </FormField>
                                <FormField label={t('admin.general.sections.home.fields.greetingKm')} name="greetingKm">
                                    <FormInput placeholder={t('admin.general.sections.home.fields.greetingPlaceholder')} />
                                </FormField>
                            </FormRow>

                            <FormRow>
                                <FormField label={t('admin.general.sections.home.fields.nameEn')} name="nameEn">
                                    <FormInput placeholder={t('admin.general.sections.home.fields.namePlaceholder')} />
                                </FormField>
                                <FormField label={t('admin.general.sections.home.fields.nameKm')} name="nameKm">
                                    <FormInput placeholder={t('admin.general.sections.home.fields.namePlaceholder')} />
                                </FormField>
                            </FormRow>

                            <FormRow>
                                <FormField label={t('admin.general.sections.home.fields.subtitleEn')} name="subtitleEn">
                                    <FormInput placeholder={t('admin.general.sections.home.fields.subtitlePlaceholder')} />
                                </FormField>
                                <FormField label={t('admin.general.sections.home.fields.subtitleKm')} name="subtitleKm">
                                    <FormInput placeholder={t('admin.general.sections.home.fields.subtitlePlaceholder')} />
                                </FormField>
                            </FormRow>

                            <FormField label={t('admin.general.sections.home.fields.descriptionEn')} name="descriptionEn">
                                <FormMarkdownEditor
                                    id="home-description-en"
                                    placeholder={t('admin.general.sections.home.fields.descriptionPlaceholderEn')}
                                    isPreviewMode={homePreview}
                                    onTogglePreview={() => setHomePreview(!homePreview)}
                                    rows="6"
                                />
                            </FormField>

                            <FormField label={t('admin.general.sections.home.fields.descriptionKm')} name="descriptionKm">
                                <FormMarkdownEditor
                                    id="home-description-km"
                                    placeholder={t('admin.general.sections.home.fields.descriptionPlaceholderKm')}
                                    isPreviewMode={homePreview}
                                    onTogglePreview={() => setHomePreview(!homePreview)}
                                    rows="6"
                                />
                            </FormField>
                        </div>

                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{t('admin.general.sections.home.primaryAction.title')}</h4>
                                <p>{t('admin.general.sections.home.primaryAction.description')}</p>
                            </div>

                            <FormRow>
                                <FormField label={t('admin.general.sections.home.fields.ctaTextEn')} name="ctaTextEn">
                                    <FormInput placeholder={t('admin.general.sections.home.fields.ctaPlaceholder')} />
                                </FormField>
                                <FormField label={t('admin.general.sections.home.fields.ctaTextKm')} name="ctaTextKm">
                                    <FormInput placeholder={t('admin.general.sections.home.fields.ctaPlaceholder')} />
                                </FormField>
                            </FormRow>

                            <FormRow>
                                <FormField label={t('admin.general.sections.home.fields.ctaLink')} name="ctaLink">
                                    <FormInput placeholder={t('admin.general.sections.home.fields.ctaLinkPlaceholder')} />
                                </FormField>
                            </FormRow>
                        </div>
                    </div>

                    <aside className="ui-generalAside">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{t('admin.general.sections.home.portrait.title')}</h4>
                                <p>{t('admin.general.sections.home.portrait.description')}</p>
                            </div>

                            <FormField label={t('admin.general.sections.home.portrait.label')} name="image">
                                <Controller
                                    name="image"
                                    render={({ field }) => (
                                        <FormDropzone
                                            hint={t('admin.general.sections.home.portrait.hint')}
                                            file={field.value}
                                            onFileChange={field.onChange}
                                            currentImageUrl={currentImageUrl}
                                            circular={true}
                                            aspectRatio="1/1"
                                        />
                                    )}
                                />
                            </FormField>
                        </div>
                    </aside>
                </div>

                <div className={'ui-formFooter'}>
                    <Button type="submit" isLoading={loading} className="ui-button-block" disabled={!canEdit}>
                        <Save size={18} /> {t('admin.general.sections.home.save')}
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default HomeSection;
