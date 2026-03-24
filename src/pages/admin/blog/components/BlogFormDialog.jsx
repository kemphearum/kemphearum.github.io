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

const BlogCoverImageField = ({ currentImageUrl }) => {
    const { control, setValue, watch } = useFormContext();
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
                    placeholder="Upload post cover image"
                    aspectRatio="16 / 7"
                />
            )}
        />
    );
};

const BlogLocalizedFields = ({ activeLanguage, setActiveLanguage }) => {
    const titleName = activeLanguage === 'en' ? 'titleEn' : 'titleKm';
    const excerptName = activeLanguage === 'en' ? 'excerptEn' : 'excerptKm';
    const contentName = activeLanguage === 'en' ? 'contentEn' : 'contentKm';
    const languageLabel = activeLanguage === 'en' ? 'English' : 'Khmer';

    return (
        <>
            <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="ui-inlineLangTabs">
                <Tabs.List>
                    <Tabs.Trigger value="en">EN</Tabs.Trigger>
                    <Tabs.Trigger value="km">KM</Tabs.Trigger>
                </Tabs.List>
            </Tabs>

            <FormField
                label={`Post Title (${languageLabel})`}
                name={titleName}
                validation={activeLanguage === 'en' ? { required: 'English title is required' } : {}}
                hint={activeLanguage === 'km' ? 'Optional. Leave blank to fall back to English.' : undefined}
            >
                <FormInput placeholder={`Enter ${languageLabel.toLowerCase()} title...`} />
            </FormField>

            <FormField
                label={`Short Excerpt (${languageLabel})`}
                name={excerptName}
                hint="Used in cards, previews, and search results."
            >
                <FormInput isTextArea rows="4" placeholder={`A short ${languageLabel.toLowerCase()} summary...`} />
            </FormField>

            <FormField
                label={`Content (${languageLabel})`}
                name={contentName}
                validation={activeLanguage === 'en' ? { required: 'English content is required' } : {}}
            >
                <FormMarkdownEditor
                    rows={16}
                    fullWidth={false}
                    placeholder={`Write the ${languageLabel.toLowerCase()} article in Markdown...`}
                />
            </FormField>
        </>
    );
};

const BlogFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const [activeLanguage, setActiveLanguage] = useState('en');

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
                        <Dialog.Title>{mode === 'create' ? 'Create New Post' : 'Edit Post'}</Dialog.Title>
                        <Dialog.Description>
                            Manage bilingual content in one document. English is required, Khmer is optional and falls back to English.
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
                                        <h3>Story basics</h3>
                                        <p>Switch language tabs to edit EN/KM fields without leaving this form.</p>
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
                                        <h3>Publishing</h3>
                                        <p>Control visibility, homepage promotion, and the public URL.</p>
                                    </div>

                                    <FormField
                                        label="Publish Status"
                                        name="visible"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: 'Published (Publicly Visible)', value: true },
                                                { label: 'Draft (Admin Only)', value: false }
                                            ]}
                                        />
                                    </FormField>

                                    <FormField
                                        label="Homepage Highlight"
                                        name="featured"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: 'Normal Post', value: false },
                                                { label: 'Featured on Homepage', value: true }
                                            ]}
                                        />
                                    </FormField>

                                    <FormField
                                        label="Custom Slug"
                                        name="slug"
                                        hint="Leave blank to generate the URL automatically from the English title."
                                    >
                                        <FormInput placeholder="e.g. my-blog-post" />
                                    </FormField>

                                    <FormField
                                        label="Tags"
                                        name="tags"
                                        hint="Separate topics with commas to improve filtering and related-post suggestions."
                                    >
                                        <FormInput placeholder="React, Firebase, Security" />
                                    </FormField>
                                </div>

                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>Cover image</h3>
                                        <p>Use a clean, wide image to make the blog list and article header feel polished.</p>
                                    </div>

                                    <FormField label="Cover Image">
                                        <BlogCoverImageField currentImageUrl={initialData?.coverImage} />
                                    </FormField>
                                </div>
                            </aside>
                        </div>
                    </Dialog.Body>

                    <Dialog.Footer className="ui-blog-dialog__footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="ui-blog-dialog__footerNote">
                            Both languages are stored in one Firestore document. Khmer can remain empty while content is being translated.
                        </div>
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? 'Saving...' : 'Save Blog Post'}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default BlogFormDialog;
