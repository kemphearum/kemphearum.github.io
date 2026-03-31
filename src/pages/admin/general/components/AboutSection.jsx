import React from 'react';
import { User, Save, History } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import { useTranslation } from '../../../../hooks/useTranslation';

const AboutSection = ({
    aboutPreview,
    setAboutPreview,
    loading,
    onOpenHistory,
    canEdit = true,
    canViewHistory = true
}) => {

    const { t } = useTranslation();
    const { watch } = useFormContext();
    const skills = watch('skills') || '';

    return (
        <div className="ui-card">
            <div className={'ui-cardHeader'}>
                <div className={'ui-icon-wrapper'}>
                    <User size={24} />
                </div>
                <div className={'ui-title-meta'}>
                    <h3>{t('admin.general.sections.about.title')}</h3>
                    <p>{t('admin.general.sections.about.description')}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('about', t('admin.general.sections.about.title'))}
                    className={'ui-history-btn'}
                    disabled={!canViewHistory}
                >
                    <History size={16} /> <span>{t('admin.general.sections.about.history')}</span>
                </Button>
            </div>
            <div className={'ui-form'}>
                <div className="ui-generalSectionGrid">
                    <div className="ui-generalPrimary">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{t('admin.general.sections.about.bio.title')}</h4>
                                <p>{t('admin.general.sections.about.bio.description')}</p>
                            </div>

                            <FormField
                                label={t('admin.general.sections.about.fields.bioEn')}
                                name="bioEn"
                                validation={{ required: t('admin.general.sections.about.fields.bioRequired') }}
                            >
                                <FormMarkdownEditor
                                    id="about-bio-en"
                                    placeholder={t('admin.general.sections.about.fields.bioPlaceholderEn')}
                                    isPreviewMode={aboutPreview}
                                    onTogglePreview={() => setAboutPreview(!aboutPreview)}
                                    rows="8"
                                />
                            </FormField>

                            <FormField
                                label={t('admin.general.sections.about.fields.bioKm')}
                                name="bioKm"
                            >
                                <FormMarkdownEditor
                                    id="about-bio-km"
                                    placeholder={t('admin.general.sections.about.fields.bioPlaceholderKm')}
                                    isPreviewMode={aboutPreview}
                                    onTogglePreview={() => setAboutPreview(!aboutPreview)}
                                    rows="8"
                                />
                            </FormField>
                        </div>
                    </div>

                    <aside className="ui-generalAside">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{t('admin.general.sections.about.skillsSnapshot.title')}</h4>
                                <p>{t('admin.general.sections.about.skillsSnapshot.description')}</p>
                            </div>

                            <FormField
                                label={t('admin.general.sections.about.fields.skills')}
                                name="skills"
                            >
                                <FormInput
                                    placeholder={t('admin.general.sections.about.fields.skillsPlaceholder')}
                                    hint={t('admin.general.sections.about.fields.skillsHint')}
                                />
                            </FormField>

                            {skills && (
                                <div className={'ui-skill-preview'}>
                                    {skills.split(',').map((s, i) => s.trim() && (
                                        <span key={`skill-${s.trim()}-${i}`} className={'ui-tech-tag'}>{s.trim()}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>

                <div className={'ui-formFooter'}>
                    <Button type="submit" isLoading={loading} className="ui-button-block" disabled={!canEdit}>
                        <Save size={18} /> {t('admin.general.sections.about.save')}
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default AboutSection;
