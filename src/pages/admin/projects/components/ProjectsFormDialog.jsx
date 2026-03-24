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

const ProjectImageField = ({ currentImageUrl }) => {
    const { control, setValue, watch } = useFormContext();
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
                    currentImageUrl={activeImage || currentImageUrl}
                    onClearExisting={() => setValue('imageUrl', '', { shouldDirty: true })}
                    placeholder="Upload project cover image"
                    aspectRatio="16 / 7"
                />
            )}
        />
    );
};

const ProjectLocalizedFields = ({ activeLanguage, setActiveLanguage }) => {
    const titleName = activeLanguage === 'en' ? 'titleEn' : 'titleKm';
    const descriptionName = activeLanguage === 'en' ? 'descriptionEn' : 'descriptionKm';
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
                label={`Project Title (${languageLabel})`}
                name={titleName}
                validation={activeLanguage === 'en' ? { required: 'English title is required' } : {}}
                hint={activeLanguage === 'km' ? 'Optional. Empty Khmer falls back to English.' : undefined}
            >
                <FormInput placeholder={`Enter ${languageLabel.toLowerCase()} project title...`} />
            </FormField>

            <FormField
                label={`Short Description (${languageLabel})`}
                name={descriptionName}
                validation={activeLanguage === 'en' ? { required: 'English description is required' } : {}}
                hint="Used in cards, previews, and supporting metadata."
            >
                <FormInput isTextArea rows="4" placeholder={`Describe the project in ${languageLabel.toLowerCase()}...`} />
            </FormField>

            <FormField label={`Project Content (${languageLabel})`} name={contentName}>
                <FormMarkdownEditor
                    rows={14}
                    fullWidth={false}
                    placeholder={`Detailed ${languageLabel.toLowerCase()} case study in Markdown...`}
                />
            </FormField>
        </>
    );
};

const ProjectsFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const [activeLanguage, setActiveLanguage] = useState('en');

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
                        <Dialog.Title>{mode === 'create' ? 'Add New Project' : 'Edit Project'}</Dialog.Title>
                        <Dialog.Description>
                            Maintain bilingual project storytelling in a single Firestore document with EN/KM tabs.
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
                                        <h3>Project basics</h3>
                                        <p>Edit content language-by-language while keeping one canonical record.</p>
                                    </div>

                                    <ProjectLocalizedFields
                                        activeLanguage={activeLanguage}
                                        setActiveLanguage={setActiveLanguage}
                                    />

                                    <FormField
                                        label="Tech Stack"
                                        name="techStack"
                                        validation={{ required: 'Tech stack is required' }}
                                        hint="Separate technologies with commas."
                                    >
                                        <FormInput placeholder="e.g. React, Firebase, SCSS" />
                                    </FormField>
                                </div>
                            </div>

                            <aside className="ui-blog-formLayout__aside">
                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>Links and URL</h3>
                                        <p>Keep the public slug and external links ready before publishing.</p>
                                    </div>

                                    <FormField
                                        label="GitHub URL"
                                        name="githubUrl"
                                        validation={{
                                            validate: (value) => !value || /^https?:\/\/.+/i.test(value) || 'Enter a valid URL (http/https)'
                                        }}
                                    >
                                        <FormInput type="url" placeholder="https://github.com/..." />
                                    </FormField>

                                    <FormField
                                        label="Live Demo URL"
                                        name="liveUrl"
                                        validation={{
                                            validate: (value) => !value || /^https?:\/\/.+/i.test(value) || 'Enter a valid URL (http/https)'
                                        }}
                                    >
                                        <FormInput type="url" placeholder="https://..." />
                                    </FormField>

                                    <FormField label="Custom Slug" name="slug" hint="Leave blank to generate from English title.">
                                        <FormInput placeholder="e.g. portfolio-website" />
                                    </FormField>
                                </div>

                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>Publishing</h3>
                                        <p>Control public visibility and homepage highlighting.</p>
                                    </div>

                                    <FormField
                                        label="Visibility"
                                        name="visible"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: 'Published', value: true },
                                                { label: 'Hidden', value: false }
                                            ]}
                                        />
                                    </FormField>
                                    <FormField
                                        label="Featured"
                                        name="featured"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: 'Normal', value: false },
                                                { label: 'Featured', value: true }
                                            ]}
                                        />
                                    </FormField>
                                </div>

                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>Project cover</h3>
                                        <p>Use a wide image that works in cards and detail pages.</p>
                                    </div>

                                    <FormField label="Project Image">
                                        <ProjectImageField currentImageUrl={initialData?.imageUrl} />
                                    </FormField>
                                </div>
                            </aside>
                        </div>
                    </Dialog.Body>

                    <Dialog.Footer className="ui-blog-dialog__footer">
                        <div className="ui-blog-dialog__footerNote">
                            EN and KM are saved together in one document. Khmer can remain empty while translation is in progress.
                        </div>
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? 'Saving...' : 'Save Project'}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default ProjectsFormDialog;
