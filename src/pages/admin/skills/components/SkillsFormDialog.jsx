import React, { useState } from 'react';
import { Dialog, Button, Tabs } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import FormDropzone from '../../components/FormDropzone';
import { Controller, useFormContext } from 'react-hook-form';
import { getLanguageValue } from '../../../../utils/localization';
import { useTranslation } from '../../../../hooks/useTranslation';
import { SKILL_LEVELS } from '../../../../domain/skill/skillDomain';

const SkillIconField = () => {
    const { t } = useTranslation();
    const { control, setValue, watch } = useFormContext();
    const activeImage = watch('iconUrl');

    return (
        <Controller
            name="icon"
            control={control}
            render={({ field }) => (
                <FormDropzone
                    file={field.value}
                    onFileChange={(file) => {
                        field.onChange(file);
                        if (file) {
                            setValue('iconUrl', '', { shouldDirty: true });
                        }
                    }}
                    currentImageUrl={activeImage}
                    onClearExisting={() => setValue('iconUrl', '', { shouldDirty: true })}
                    placeholder={t('admin.skills.form.fields.uploadIconPlaceholder')}
                    circular={true}
                />
            )}
        />
    );
};

const SkillLocalizedFields = () => {
    const [activeLanguage, setActiveLanguage] = useState('en');
    const { t } = useTranslation();
    const languageLabel = activeLanguage === 'en' ? t('admin.skills.form.languages.en') : t('admin.skills.form.languages.km');
    const nameName = activeLanguage === 'en' ? 'nameEn' : 'nameKm';
    const descriptionName = activeLanguage === 'en' ? 'descriptionEn' : 'descriptionKm';

    return (
        <>
            <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="ui-inlineLangTabs">
                <Tabs.List>
                    <Tabs.Trigger value="en">{t('admin.common.langEn', 'EN')}</Tabs.Trigger>
                    <Tabs.Trigger value="km">{t('admin.common.langKm', 'KM')}</Tabs.Trigger>
                </Tabs.List>
            </Tabs>

            <FormField
                key={nameName}
                label={`${t('admin.skills.form.fields.name')} (${languageLabel})`}
                name={nameName}
                validation={activeLanguage === 'en' ? { required: t('admin.skills.form.fields.nameRequired') } : {}}
            >
                <FormInput placeholder={t('admin.skills.form.fields.namePlaceholder')} />
            </FormField>

            <FormField
                key={descriptionName}
                label={`${t('admin.skills.form.fields.description')} (${languageLabel})`}
                name={descriptionName}
            >
                <FormInput isTextArea rows="3" placeholder={t('admin.skills.form.fields.descriptionPlaceholder')} />
            </FormField>
        </>
    );
};

const SkillsFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const { t } = useTranslation();

    const defaultValues = {
        nameEn: getLanguageValue(initialData?.name, 'en', true),
        nameKm: getLanguageValue(initialData?.name, 'km', false),
        descriptionEn: getLanguageValue(initialData?.description, 'en', true),
        descriptionKm: getLanguageValue(initialData?.description, 'km', false),
        category: '',
        level: 'intermediate',
        yearsOfExperience: 0,
        iconUrl: '',
        icon: null,
        order: 0,
        visible: true,
        featured: false,
        ...initialData,
        relatedProjects: Array.isArray(initialData?.relatedProjects) ? initialData.relatedProjects.join(', ') : (initialData?.relatedProjects || ''),
        relatedCertifications: Array.isArray(initialData?.relatedCertifications) ? initialData.relatedCertifications.join(', ') : (initialData?.relatedCertifications || ''),
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="780px" className="ui-blog-dialog">
                <Dialog.Header className="ui-blog-dialog__header">
                    <div className="ui-blog-dialog__heading">
                        <Dialog.Title>{mode === 'create' ? t('admin.skills.form.dialogs.addTitle') : t('admin.skills.form.dialogs.editTitle')}</Dialog.Title>
                        <Dialog.Description>{t('admin.skills.form.dialogs.description')}</Dialog.Description>
                    </div>
                    <Dialog.Close />
                </Dialog.Header>

                <Form onSubmit={onSubmit} defaultValues={defaultValues} key={open ? 'open' : 'closed'}>
                    <Dialog.Body className="ui-blog-dialog__body">
                        <div className="ui-blog-formLayout">
                            <div className="ui-blog-formLayout__main">
                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{t('admin.skills.form.sections.details.title')}</h3>
                                        <p>{t('admin.skills.form.sections.details.description')}</p>
                                    </div>
                                    <SkillLocalizedFields />
                                </div>
                            </div>

                            <aside className="ui-blog-formLayout__aside">
                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{t('admin.skills.form.sections.meta.title')}</h3>
                                        <p>{t('admin.skills.form.sections.meta.description')}</p>
                                    </div>

                                    <FormField label={t('admin.skills.form.fields.category')} name="category">
                                        <FormInput placeholder={t('admin.skills.form.fields.categoryPlaceholder')} />
                                    </FormField>

                                    <FormField label={t('admin.skills.form.fields.level')} name="level">
                                        <FormSelect
                                            options={SKILL_LEVELS.map((level) => ({
                                                label: t(`admin.skills.levels.${level}`),
                                                value: level
                                            }))}
                                        />
                                    </FormField>

                                    <FormField label={t('admin.skills.form.fields.yearsOfExperience')} name="yearsOfExperience">
                                        <FormInput type="number" min="0" step="0.5" placeholder={t('admin.skills.form.fields.yearsPlaceholder')} />
                                    </FormField>

                                    <FormField label={t('admin.experience.form.fields.relatedProjects')} name="relatedProjects" hint={t('admin.skills.form.fields.relatedProjectsHint')}>
                                        <FormInput placeholder={t('admin.experience.form.fields.relatedProjectsPlaceholder')} />
                                    </FormField>

                                    <FormField label={t('admin.skills.form.fields.relatedCertifications')} name="relatedCertifications" hint={t('admin.skills.form.fields.relatedCertificationsHint')}>
                                        <FormInput placeholder={t('admin.skills.form.fields.relatedCertificationsPlaceholder')} />
                                    </FormField>

                                    <FormField label={t('admin.skills.form.fields.skillIcon')}>
                                        <SkillIconField />
                                    </FormField>

                                    <FormField label={t('admin.skills.form.fields.slug')} name="slug" hint={t('admin.skills.form.fields.slugHint')}>
                                        <FormInput placeholder={t('admin.skills.form.fields.slugPlaceholder')} />
                                    </FormField>

                                    <FormField
                                        label={t('admin.skills.form.fields.visibility')}
                                        name="visible"
                                        validation={{ setValueAs: (value) => value === true || value === 'true' }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: t('admin.skills.form.fields.optionVisible'), value: true },
                                                { label: t('admin.skills.form.fields.optionHidden'), value: false }
                                            ]}
                                        />
                                    </FormField>

                                    <FormField
                                        label={t('admin.skills.form.fields.featured')}
                                        name="featured"
                                        validation={{ setValueAs: (value) => value === true || value === 'true' }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: t('admin.skills.form.fields.optionFeatured'), value: true },
                                                { label: t('admin.skills.form.fields.optionNotFeatured'), value: false }
                                            ]}
                                        />
                                    </FormField>
                                </div>
                            </aside>
                        </div>
                    </Dialog.Body>

                    <Dialog.Footer className="ui-blog-dialog__footer">
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                {t('admin.skills.form.actions.cancel')}
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? t('admin.skills.form.actions.saving') : t('admin.skills.form.actions.save')}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default SkillsFormDialog;
