import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Dialog, Button, Tabs } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import FormDropzone from '../../components/FormDropzone';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import { getLanguageValue } from '../../../../utils/localization';
import { useTranslation } from '../../../../hooks/useTranslation';

const ProjectImageField = () => {
    const { control, setValue, watch } = useFormContext();
    const { t } = useTranslation();
    const activeImage = watch('imageUrl');

    return (
        <Controller
            name="image"
            control={control}
            render={({ field }) => (
                <FormDropzone
                    file={field.value}
                    onFileChange={(file) => {
                        field.onChange(file);
                        if (file) {
                            setValue('imageUrl', '', { shouldDirty: true });
                        }
                    }}
                    currentImageUrl={activeImage}
                    onClearExisting={() => setValue('imageUrl', '', { shouldDirty: true })}
                    placeholder={t('admin.projects.form.fields.imagePlaceholder')}
                    aspectRatio="16 / 7"
                />
            )}
        />
    );
};

const ProjectLocalizedFields = ({ activeLanguage, setActiveLanguage }) => {
    const { t } = useTranslation();
    const titleName = activeLanguage === 'en' ? 'titleEn' : 'titleKm';
    const descriptionName = activeLanguage === 'en' ? 'descriptionEn' : 'descriptionKm';
    const contentName = activeLanguage === 'en' ? 'contentEn' : 'contentKm';
    const languageLabel = activeLanguage === 'en' ? t('admin.projects.form.languages.en') : t('admin.projects.form.languages.km');

    return (
        <>
            <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="ui-inlineLangTabs">
                <Tabs.List>
                    <Tabs.Trigger value="en">EN</Tabs.Trigger>
                    <Tabs.Trigger value="km">KM</Tabs.Trigger>
                </Tabs.List>
            </Tabs>

            <FormField
                label={`${t('admin.projects.form.fields.projectTitle')} (${languageLabel})`}
                name={titleName}
                validation={activeLanguage === 'en' ? { required: t('admin.projects.form.fields.titleRequired') } : {}}
                hint={activeLanguage === 'km' ? t('admin.projects.form.fields.titleHint') : undefined}
            >
                <FormInput placeholder={activeLanguage === 'en' ? t('admin.projects.form.fields.titlePlaceholderEn') : t('admin.projects.form.fields.titlePlaceholderKm')} />
            </FormField>

            <FormField
                label={`${t('admin.projects.form.fields.shortDescription')} (${languageLabel})`}
                name={descriptionName}
                validation={activeLanguage === 'en' ? { required: t('admin.projects.form.fields.descriptionRequired') } : {}}
                hint={t('admin.projects.form.fields.descriptionHint')}
            >
                <FormInput isTextArea rows="4" placeholder={activeLanguage === 'en' ? t('admin.projects.form.fields.descriptionPlaceholderEn') : t('admin.projects.form.fields.descriptionPlaceholderKm')} />
            </FormField>

            <FormField label={`${t('admin.projects.form.fields.projectContent')} (${languageLabel})`} name={contentName}>
                <FormMarkdownEditor
                    rows={14}
                    fullWidth={false}
                    placeholder={activeLanguage === 'en' ? t('admin.projects.form.fields.contentPlaceholderEn') : t('admin.projects.form.fields.contentPlaceholderKm')}
                />
            </FormField>
        </>
    );
};

const ProjectsFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const [activeLanguage, setActiveLanguage] = useState('en');
    const { t } = useTranslation();

    const defaultValues = {
        titleEn: getLanguageValue(initialData?.title, 'en', true),
        titleKm: getLanguageValue(initialData?.title, 'km', false),
        descriptionEn: getLanguageValue(initialData?.description, 'en', true),
        descriptionKm: getLanguageValue(initialData?.description, 'km', false),
        contentEn: getLanguageValue(initialData?.content, 'en', true),
        contentKm: getLanguageValue(initialData?.content, 'km', false),
        techStack: Array.isArray(initialData?.techStack) ? initialData.techStack.join(', ') : (initialData?.techStack || ''),
        githubUrl: initialData?.githubUrl || '',
        liveUrl: initialData?.liveUrl || '',
        slug: initialData?.slug || '',
        imageUrl: initialData?.imageUrl || '',
        image: null,
        visible: initialData?.visible ?? true,
        featured: initialData?.featured ?? false
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="1120px" className="ui-blog-dialog">
                <Dialog.Header className="ui-blog-dialog__header">
                    <div className="ui-blog-dialog__heading">
                        <Dialog.Title>{mode === 'create' ? t('admin.projects.form.dialogs.addTitle') : t('admin.projects.form.dialogs.editTitle')}</Dialog.Title>
                        <Dialog.Description>
                            {t('admin.projects.form.dialogs.description')}
                        </Dialog.Description>
                    </div>
                    <Dialog.Close />
                </Dialog.Header>

                <Form
                    onSubmit={onSubmit}
                    defaultValues={defaultValues}
                    key={open ? 'open' : 'closed'}
                >
                    <Dialog.Body className="ui-blog-dialog__body">
                        <div className="ui-blog-formLayout">
                            <div className="ui-blog-formLayout__main">
                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{t('admin.projects.form.sections.projectBasics.title')}</h3>
                                        <p>{t('admin.projects.form.sections.projectBasics.description')}</p>
                                    </div>

                                    <ProjectLocalizedFields
                                        activeLanguage={activeLanguage}
                                        setActiveLanguage={setActiveLanguage}
                                    />

                                    <FormField
                                        label={t('admin.projects.form.fields.techStack')}
                                        name="techStack"
                                        validation={{ required: t('admin.projects.form.fields.techStackRequired') }}
                                        hint={t('admin.projects.form.fields.techStackHint')}
                                    >
                                        <FormInput placeholder={t('admin.projects.form.fields.techStackPlaceholder')} />
                                    </FormField>
                                </div>
                            </div>

                            <aside className="ui-blog-formLayout__aside">
                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{t('admin.projects.form.sections.linksAndUrl.title')}</h3>
                                        <p>{t('admin.projects.form.sections.linksAndUrl.description')}</p>
                                    </div>

                                    <FormField
                                        label={t('admin.projects.form.fields.githubUrl')}
                                        name="githubUrl"
                                        validation={{
                                            validate: (value) => !value || /^https?:\/\/.+/i.test(value) || t('admin.projects.form.fields.urlInvalid')
                                        }}
                                    >
                                        <FormInput type="url" placeholder={t('admin.projects.form.fields.githubPlaceholder')} />
                                    </FormField>

                                    <FormField
                                        label={t('admin.projects.form.fields.liveUrl')}
                                        name="liveUrl"
                                        validation={{
                                            validate: (value) => !value || /^https?:\/\/.+/i.test(value) || t('admin.projects.form.fields.urlInvalid')
                                        }}
                                    >
                                        <FormInput type="url" placeholder={t('admin.projects.form.fields.livePlaceholder')} />
                                    </FormField>

                                    <FormField label={t('admin.projects.form.fields.slug')} name="slug" hint={t('admin.projects.form.fields.slugHint')}>
                                        <FormInput placeholder={t('admin.projects.form.fields.slugPlaceholder')} />
                                    </FormField>
                                </div>

                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{t('admin.projects.form.sections.publishing.title')}</h3>
                                        <p>{t('admin.projects.form.sections.publishing.description')}</p>
                                    </div>

                                    <FormField
                                        label={t('admin.projects.form.fields.visibility')}
                                        name="visible"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: t('admin.projects.form.fields.optionPublished'), value: true },
                                                { label: t('admin.projects.form.fields.optionHidden'), value: false }
                                            ]}
                                        />
                                    </FormField>
                                    <FormField
                                        label={t('admin.projects.form.fields.featured')}
                                        name="featured"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: t('admin.projects.form.fields.optionNormal'), value: false },
                                                { label: t('admin.projects.form.fields.optionFeatured'), value: true }
                                            ]}
                                        />
                                    </FormField>
                                </div>

                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{t('admin.projects.form.fields.projectCover')}</h3>
                                        <p>{t('admin.projects.form.fields.projectCoverDesc')}</p>
                                    </div>

                                    <FormField label={t('admin.projects.form.fields.projectImage')}>
                                        <ProjectImageField />
                                    </FormField>
                                </div>
                            </aside>
                        </div>
                    </Dialog.Body>

                    <Dialog.Footer className="ui-blog-dialog__footer">
                        <div className="ui-blog-dialog__footerNote">
                            {t('admin.projects.form.dialogs.footerNote')}
                        </div>
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                {t('admin.projects.form.actions.cancel')}
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? t('admin.projects.form.actions.saving') : t('admin.projects.form.actions.save')}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default ProjectsFormDialog;
