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

const ProjectImageField = ({ currentImageUrl, tr }) => {
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
                    placeholder={tr('Upload project cover image', 'ផ្ទុករូបគម្របគម្រោង')}
                    aspectRatio="16 / 7"
                />
            )}
        />
    );
};

const ProjectLocalizedFields = ({ activeLanguage, setActiveLanguage, tr }) => {
    const titleName = activeLanguage === 'en' ? 'titleEn' : 'titleKm';
    const descriptionName = activeLanguage === 'en' ? 'descriptionEn' : 'descriptionKm';
    const contentName = activeLanguage === 'en' ? 'contentEn' : 'contentKm';
    const languageLabel = activeLanguage === 'en' ? tr('English', 'អង់គ្លេស') : tr('Khmer', 'ខ្មែរ');

    return (
        <>
            <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="ui-inlineLangTabs">
                <Tabs.List>
                    <Tabs.Trigger value="en">EN</Tabs.Trigger>
                    <Tabs.Trigger value="km">KM</Tabs.Trigger>
                </Tabs.List>
            </Tabs>

            <FormField
                label={`${tr('Project Title', 'ចំណងជើងគម្រោង')} (${languageLabel})`}
                name={titleName}
                validation={activeLanguage === 'en' ? { required: tr('English title is required', 'ត្រូវការចំណងជើងជាអង់គ្លេស') } : {}}
                hint={activeLanguage === 'km' ? tr('Optional. Empty Khmer falls back to English.', 'ស្រេចចិត្ត។ បើខ្មែរទទេ នឹងប្រើអង់គ្លេសជំនួស។') : undefined}
            >
                <FormInput placeholder={activeLanguage === 'en' ? 'Enter english project title...' : 'បញ្ចូលចំណងជើងគម្រោងជាភាសាខ្មែរ...'} />
            </FormField>

            <FormField
                label={`${tr('Short Description', 'ការពិពណ៌នាខ្លី')} (${languageLabel})`}
                name={descriptionName}
                validation={activeLanguage === 'en' ? { required: tr('English description is required', 'ត្រូវការការពិពណ៌នាជាអង់គ្លេស') } : {}}
                hint={tr('Used in cards, previews, and supporting metadata.', 'ប្រើសម្រាប់កាត ការមើលជាមុន និង metadata បន្ថែម។')}
            >
                <FormInput isTextArea rows="4" placeholder={activeLanguage === 'en' ? 'Describe the project in english...' : 'ពិពណ៌នាគម្រោងជាភាសាខ្មែរ...'} />
            </FormField>

            <FormField label={`${tr('Project Content', 'មាតិកាគម្រោង')} (${languageLabel})`} name={contentName}>
                <FormMarkdownEditor
                    rows={14}
                    fullWidth={false}
                    placeholder={activeLanguage === 'en' ? 'Detailed english case study in Markdown...' : 'មាតិកាលម្អិតជាភាសាខ្មែរ (Markdown)...'}
                />
            </FormField>
        </>
    );
};

const ProjectsFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const [activeLanguage, setActiveLanguage] = useState('en');
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

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
                        <Dialog.Title>{mode === 'create' ? tr('Add New Project', 'បន្ថែមគម្រោងថ្មី') : tr('Edit Project', 'កែសម្រួលគម្រោង')}</Dialog.Title>
                        <Dialog.Description>
                            {tr('Maintain bilingual project storytelling in a single Firestore document with EN/KM tabs.', 'គ្រប់គ្រងព័ត៌មានគម្រោងពីរភាសា​ក្នុងឯកសារ Firestore តែមួយជាមួយផ្ទាំង EN/KM។')}
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
                                        <h3>{tr('Project basics', 'មូលដ្ឋានគម្រោង')}</h3>
                                        <p>{tr('Edit content language-by-language while keeping one canonical record.', 'កែសម្រួលមាតិកាតាមភាសា ខណៈរក្សាកំណត់ត្រាសំខាន់តែមួយ។')}</p>
                                    </div>

                                    <ProjectLocalizedFields
                                        activeLanguage={activeLanguage}
                                        setActiveLanguage={setActiveLanguage}
                                        tr={tr}
                                    />

                                    <FormField
                                        label={tr('Tech Stack', 'បច្ចេកវិទ្យាប្រើប្រាស់')}
                                        name="techStack"
                                        validation={{ required: tr('Tech stack is required', 'ត្រូវការបញ្ជីបច្ចេកវិទ្យា') }}
                                        hint={tr('Separate technologies with commas.', 'បំបែកបច្ចេកវិទ្យាដោយក្បៀស។')}
                                    >
                                        <FormInput placeholder={tr('e.g. React, Firebase, SCSS', 'ឧ. React, Firebase, SCSS')} />
                                    </FormField>
                                </div>
                            </div>

                            <aside className="ui-blog-formLayout__aside">
                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{tr('Links and URL', 'តំណ និង URL')}</h3>
                                        <p>{tr('Keep the public slug and external links ready before publishing.', 'រៀបចំ slug សាធារណៈ និងតំណខាងក្រៅឲ្យរួចរាល់ មុនពេលបោះពុម្ព។')}</p>
                                    </div>

                                    <FormField
                                        label={tr('GitHub URL', 'តំណ GitHub')}
                                        name="githubUrl"
                                        validation={{
                                            validate: (value) => !value || /^https?:\/\/.+/i.test(value) || tr('Enter a valid URL (http/https)', 'សូមបញ្ចូល URL ត្រឹមត្រូវ (http/https)')
                                        }}
                                    >
                                        <FormInput type="url" placeholder={tr('https://github.com/...', 'https://github.com/...')} />
                                    </FormField>

                                    <FormField
                                        label={tr('Live Demo URL', 'តំណ Live Demo')}
                                        name="liveUrl"
                                        validation={{
                                            validate: (value) => !value || /^https?:\/\/.+/i.test(value) || tr('Enter a valid URL (http/https)', 'សូមបញ្ចូល URL ត្រឹមត្រូវ (http/https)')
                                        }}
                                    >
                                        <FormInput type="url" placeholder={tr('https://...', 'https://...')} />
                                    </FormField>

                                    <FormField label={tr('Custom Slug', 'Slug ផ្ទាល់ខ្លួន')} name="slug" hint={tr('Leave blank to generate from English title.', 'ទុកទទេ ដើម្បីបង្កើតពីចំណងជើងអង់គ្លេស។')}>
                                        <FormInput placeholder={tr('e.g. portfolio-website', 'ឧ. គេហទំព័រ-ផតហ្វូលីយ៉ូ')} />
                                    </FormField>
                                </div>

                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{tr('Publishing', 'ការបោះពុម្ព')}</h3>
                                        <p>{tr('Control public visibility and homepage highlighting.', 'គ្រប់គ្រងការបង្ហាញជាសាធារណៈ និងការលេចធ្លោលើទំព័រដើម។')}</p>
                                    </div>

                                    <FormField
                                        label={tr('Visibility', 'ការបង្ហាញ')}
                                        name="visible"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: tr('Published', 'បានបោះពុម្ព'), value: true },
                                                { label: tr('Hidden', 'លាក់'), value: false }
                                            ]}
                                        />
                                    </FormField>
                                    <FormField
                                        label={tr('Featured', 'ពិសេស')}
                                        name="featured"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: tr('Normal', 'ធម្មតា'), value: false },
                                                { label: tr('Featured', 'ពិសេស'), value: true }
                                            ]}
                                        />
                                    </FormField>
                                </div>

                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{tr('Project cover', 'គម្របគម្រោង')}</h3>
                                        <p>{tr('Use a wide image that works in cards and detail pages.', 'ប្រើរូបភាពទូលាយដែលសមស្របសម្រាប់កាត និងទំព័រលម្អិត។')}</p>
                                    </div>

                                    <FormField label={tr('Project Image', 'រូបភាពគម្រោង')}>
                                        <ProjectImageField currentImageUrl={initialData?.imageUrl} tr={tr} />
                                    </FormField>
                                </div>
                            </aside>
                        </div>
                    </Dialog.Body>

                    <Dialog.Footer className="ui-blog-dialog__footer">
                        <div className="ui-blog-dialog__footerNote">
                            {tr('EN and KM are saved together in one document. Khmer can remain empty while translation is in progress.', 'EN និង KM ត្រូវបានរក្សាទុកជាមួយគ្នា​ក្នុងឯកសារតែមួយ។ ភាសាខ្មែរអាចទុកទទេខណៈពេលកំពុងបកប្រែ។')}
                        </div>
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                {tr('Cancel', 'បោះបង់')}
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? tr('Saving...', 'កំពុងរក្សាទុក...') : tr('Save Project', 'រក្សាទុកគម្រោង')}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default ProjectsFormDialog;
