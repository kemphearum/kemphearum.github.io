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
import { getStoredStatus, STATUS_VALUES } from '../../../../domain/shared/contentStatus';

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

const ProjectLocalizedFields = () => {
    const [activeLanguage, setActiveLanguage] = useState('en');
    const { t } = useTranslation();
    const titleName = activeLanguage === 'en' ? 'titleEn' : 'titleKm';
    const descriptionName = activeLanguage === 'en' ? 'descriptionEn' : 'descriptionKm';
    const contentName = activeLanguage === 'en' ? 'contentEn' : 'contentKm';
    const problemName = activeLanguage === 'en' ? 'problemEn' : 'problemKm';
    const solutionName = activeLanguage === 'en' ? 'solutionEn' : 'solutionKm';
    const architectureName = activeLanguage === 'en' ? 'architectureEn' : 'architectureKm';
    const impactName = activeLanguage === 'en' ? 'impactEn' : 'impactKm';
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
                key={titleName}
                label={`${t('admin.projects.form.fields.projectTitle')} (${languageLabel})`}
                name={titleName}
                validation={activeLanguage === 'en' ? { required: t('admin.projects.form.fields.titleRequired') } : {}}
                hint={activeLanguage === 'km' ? t('admin.projects.form.fields.titleHint') : undefined}
            >
                <FormInput placeholder={activeLanguage === 'en' ? t('admin.projects.form.fields.titlePlaceholderEn') : t('admin.projects.form.fields.titlePlaceholderKm')} />
            </FormField>

            <FormField
                key={descriptionName}
                label={`${t('admin.projects.form.fields.shortDescription')} (${languageLabel})`}
                name={descriptionName}
                validation={activeLanguage === 'en' ? { required: t('admin.projects.form.fields.descriptionRequired') } : {}}
                hint={t('admin.projects.form.fields.descriptionHint')}
            >
                <FormInput isTextArea rows="4" placeholder={activeLanguage === 'en' ? t('admin.projects.form.fields.descriptionPlaceholderEn') : t('admin.projects.form.fields.descriptionPlaceholderKm')} />
            </FormField>

            <FormField
                key={contentName}
                label={`${t('admin.projects.form.fields.projectContent')} (${languageLabel})`}
                name={contentName}
            >
                <FormMarkdownEditor
                    id={`project-content-${activeLanguage}`}
                    rows={8}
                    fullWidth={false}
                    placeholder={activeLanguage === 'en' ? t('admin.projects.form.fields.contentPlaceholderEn') : t('admin.projects.form.fields.contentPlaceholderKm')}
                />
            </FormField>

            <FormField
                key={problemName}
                label={`${t('admin.projects.form.fields.problem')} (${languageLabel})`}
                name={problemName}
            >
                <FormMarkdownEditor
                    id={`project-problem-${activeLanguage}`}
                    rows={6}
                    fullWidth={false}
                    placeholder={t('admin.projects.form.fields.problemPlaceholder')}
                />
            </FormField>

            <FormField
                key={solutionName}
                label={`${t('admin.projects.form.fields.solution')} (${languageLabel})`}
                name={solutionName}
            >
                <FormMarkdownEditor
                    id={`project-solution-${activeLanguage}`}
                    rows={6}
                    fullWidth={false}
                    placeholder={t('admin.projects.form.fields.solutionPlaceholder')}
                />
            </FormField>

            <FormField
                key={architectureName}
                label={`${t('admin.projects.form.fields.architecture')} (${languageLabel})`}
                name={architectureName}
            >
                <FormMarkdownEditor
                    id={`project-architecture-${activeLanguage}`}
                    rows={6}
                    fullWidth={false}
                    placeholder={t('admin.projects.form.fields.architecturePlaceholder')}
                />
            </FormField>

            <FormField
                key={impactName}
                label={`${t('admin.projects.form.fields.impact')} (${languageLabel})`}
                name={impactName}
            >
                <FormMarkdownEditor
                    id={`project-impact-${activeLanguage}`}
                    rows={6}
                    fullWidth={false}
                    placeholder={t('admin.projects.form.fields.resultsPlaceholder')}
                />
            </FormField>
        </>
    );
};

const ProjectsFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const { t } = useTranslation();

    const defaultValues = {
        titleEn: getLanguageValue(initialData?.title, 'en', true),
        titleKm: getLanguageValue(initialData?.title, 'km', false),
        descriptionEn: getLanguageValue(initialData?.description, 'en', true),
        descriptionKm: getLanguageValue(initialData?.description, 'km', false),
        contentEn: getLanguageValue(initialData?.content, 'en', true),
        contentKm: getLanguageValue(initialData?.content, 'km', false),
        problemEn: getLanguageValue(initialData?.problem, 'en', true),
        problemKm: getLanguageValue(initialData?.problem, 'km', false),
        solutionEn: getLanguageValue(initialData?.solution, 'en', true),
        solutionKm: getLanguageValue(initialData?.solution, 'km', false),
        architectureEn: getLanguageValue(initialData?.architecture, 'en', true),
        architectureKm: getLanguageValue(initialData?.architecture, 'km', false),
        impactEn: getLanguageValue(initialData?.impact, 'en', true),
        impactKm: getLanguageValue(initialData?.impact, 'km', false),
        techStack: Array.isArray(initialData?.techStack) ? initialData.techStack.join(', ') : (initialData?.techStack || ''),
        githubUrl: initialData?.githubUrl || '',
        liveUrl: initialData?.liveUrl || '',
        slug: initialData?.slug || '',
        galleryUrls: Array.isArray(initialData?.galleryUrls) ? initialData.galleryUrls.join(', ') : (initialData?.galleryUrls || ''),
        imageUrl: initialData?.imageUrl || '',
        image: null,
        status: getStoredStatus(initialData || {}),
        publishAt: initialData?.publishAt || '',
        expireAt: initialData?.expireAt || '',
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

                                    <ProjectLocalizedFields />

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

                                    <FormField label={t('admin.projects.form.fields.galleryImageUrls')} name="galleryUrls" hint={t('admin.projects.form.fields.galleryHint')}>
                                        <FormInput placeholder={t('admin.projects.form.fields.galleryPlaceholder')} 
                                            onChange={() => {
                                                // Convert comma separated to array before form submit in parent, or handle as string and let domain parse it
                                            }} 
                                        />
                                    </FormField>
                                </div>

                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{t('admin.projects.form.sections.publishing.title')}</h3>
                                        <p>{t('admin.projects.form.sections.publishing.description')}</p>
                                    </div>

                                    <FormField
                                        label={t('admin.common.schedule.status')}
                                        name="status"
                                    >
                                        <FormSelect
                                            options={STATUS_VALUES.map((value) => ({
                                                label: t(`admin.common.status.${value}`),
                                                value
                                            }))}
                                        />
                                    </FormField>

                                    <FormField
                                        label={t('admin.common.schedule.publishAt')}
                                        name="publishAt"
                                        hint={t('admin.common.schedule.publishAtHint')}
                                    >
                                        <FormInput type="datetime-local" />
                                    </FormField>

                                    <FormField
                                        label={t('admin.common.schedule.expireAt')}
                                        name="expireAt"
                                        hint={t('admin.common.schedule.expireAtHint')}
                                    >
                                        <FormInput type="datetime-local" />
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
