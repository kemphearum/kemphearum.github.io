import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Dialog, Button, Tabs } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import FormDropzone from '../../components/FormDropzone';
import { getLanguageValue } from '../../../../utils/localization';
import { useTranslation } from '../../../../hooks/useTranslation';

const BlogCoverImageField = ({ currentImageUrl }) => {
    const { control, setValue, watch } = useFormContext();
    const { t } = useTranslation();
    const activeImage = watch('coverImage');

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
                            setValue('coverImage', '', { shouldDirty: true });
                        }
                    }}
                    currentImageUrl={activeImage || currentImageUrl}
                    onClearExisting={() => setValue('coverImage', '', { shouldDirty: true })}
                    placeholder={t('admin.blog.form.uploadPlaceholder')}
                    aspectRatio="16 / 7"
                />
            )}
        />
    );
};

const BlogLocalizedFields = ({ activeLanguage, setActiveLanguage }) => {
    const { t } = useTranslation();
    const titleName = activeLanguage === 'en' ? 'titleEn' : 'titleKm';
    const excerptName = activeLanguage === 'en' ? 'excerptEn' : 'excerptKm';
    const contentName = activeLanguage === 'en' ? 'contentEn' : 'contentKm';
    const languageLabel = activeLanguage === 'en'
        ? t('admin.blog.form.english')
        : t('admin.blog.form.khmer');

    return (
        <>
            <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="ui-inlineLangTabs">
                <Tabs.List>
                    <Tabs.Trigger value="en">EN</Tabs.Trigger>
                    <Tabs.Trigger value="km">KM</Tabs.Trigger>
                </Tabs.List>
            </Tabs>

            <FormField
                label={`${t('admin.blog.form.postTitle')} (${languageLabel})`}
                name={titleName}
                validation={activeLanguage === 'en' ? { required: t('admin.blog.form.titleRequired') } : {}}
                hint={activeLanguage === 'km' ? t('admin.blog.form.titleOptionalHint') : undefined}
            >
                <FormInput placeholder={activeLanguage === 'en' ? t('admin.blog.form.titlePlaceholderEn') : t('admin.blog.form.titlePlaceholderKm')} />
            </FormField>

            <FormField
                label={`${t('admin.blog.form.shortExcerpt')} (${languageLabel})`}
                name={excerptName}
                hint={t('admin.blog.form.excerptHint')}
            >
                <FormInput isTextArea rows="4" placeholder={activeLanguage === 'en' ? t('admin.blog.form.excerptPlaceholderEn') : t('admin.blog.form.excerptPlaceholderKm')} />
            </FormField>

            <FormField
                label={`${t('admin.blog.form.content')} (${languageLabel})`}
                name={contentName}
                validation={activeLanguage === 'en' ? { required: t('admin.blog.form.contentRequired') } : {}}
            >
                <FormMarkdownEditor
                    rows={16}
                    fullWidth={false}
                    placeholder={activeLanguage === 'en' ? t('admin.blog.form.contentPlaceholderEn') : t('admin.blog.form.contentPlaceholderKm')}
                />
            </FormField>
        </>
    );
};

const BlogFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const [activeLanguage, setActiveLanguage] = useState('en');
    const { t } = useTranslation();

    const defaultValues = {
        titleEn: getLanguageValue(initialData?.title, 'en', true),
        titleKm: getLanguageValue(initialData?.title, 'km', false),
        excerptEn: getLanguageValue(initialData?.excerpt, 'en', true),
        excerptKm: getLanguageValue(initialData?.excerpt, 'km', false),
        contentEn: getLanguageValue(initialData?.content, 'en', true),
        contentKm: getLanguageValue(initialData?.content, 'km', false),
        tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : (initialData?.tags || ''),
        coverImage: initialData?.coverImage || '',
        image: null,
        slug: initialData?.slug || '',
        featured: initialData?.featured ?? false,
        visible: initialData?.visible ?? true
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="1120px" className="ui-blog-dialog">
                <Dialog.Header className="ui-blog-dialog__header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="ui-blog-dialog__heading">
                        <Dialog.Title>{mode === 'create' ? t('admin.blog.form.createTitle') : t('admin.blog.form.editTitle')}</Dialog.Title>
                        <Dialog.Description>
                            {t('admin.blog.form.description')}
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
                                        <h3>{t('admin.blog.form.storyBasics')}</h3>
                                        <p>{t('admin.blog.form.storyBasicsDesc')}</p>
                                    </div>

                                    <BlogLocalizedFields
                                        activeLanguage={activeLanguage}
                                        setActiveLanguage={setActiveLanguage}
                                    />
                                </div>
                            </div>

                            <aside className="ui-blog-formLayout__aside">
                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{t('admin.blog.form.publishing')}</h3>
                                        <p>{t('admin.blog.form.publishingDesc')}</p>
                                    </div>

                                    <FormField
                                        label={t('admin.blog.form.publishStatus')}
                                        name="visible"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: t('admin.blog.form.optionPublished'), value: true },
                                                { label: t('admin.blog.form.optionDraft'), value: false }
                                            ]}
                                        />
                                    </FormField>

                                    <FormField
                                        label={t('admin.blog.form.homepageHighlight')}
                                        name="featured"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: t('admin.blog.form.optionNormal'), value: false },
                                                { label: t('admin.blog.form.optionFeatured'), value: true }
                                            ]}
                                        />
                                    </FormField>

                                    <FormField
                                        label={t('admin.blog.form.customSlug')}
                                        name="slug"
                                        hint={t('admin.blog.form.slugHint')}
                                    >
                                        <FormInput placeholder={t('admin.blog.form.slugPlaceholder')} />
                                    </FormField>

                                    <FormField
                                        label={t('admin.blog.form.tags')}
                                        name="tags"
                                        hint={t('admin.blog.form.tagsHint')}
                                    >
                                        <FormInput placeholder={t('admin.blog.form.tagsPlaceholder')} />
                                    </FormField>
                                </div>

                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{t('admin.blog.form.coverImage')}</h3>
                                        <p>{t('admin.blog.form.coverImageDesc')}</p>
                                    </div>

                                    <FormField label={t('admin.blog.form.coverImageLabel')}>
                                        <BlogCoverImageField currentImageUrl={initialData?.coverImage} />
                                    </FormField>
                                </div>
                            </aside>
                        </div>
                    </Dialog.Body>

                    <Dialog.Footer className="ui-blog-dialog__footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="ui-blog-dialog__footerNote">
                            {t('admin.blog.form.footerNote')}
                        </div>
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                {t('admin.blog.form.cancel')}
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? t('admin.blog.form.saving') : t('admin.blog.form.save')}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default BlogFormDialog;
