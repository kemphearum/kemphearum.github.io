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

const BlogCoverImageField = ({ currentImageUrl, tr }) => {
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
                    placeholder={tr('Upload post cover image', 'ផ្ទុករូបគម្របអត្ថបទ')}
                    aspectRatio="16 / 7"
                />
            )}
        />
    );
};

const BlogLocalizedFields = ({ activeLanguage, setActiveLanguage, tr }) => {
    const titleName = activeLanguage === 'en' ? 'titleEn' : 'titleKm';
    const excerptName = activeLanguage === 'en' ? 'excerptEn' : 'excerptKm';
    const contentName = activeLanguage === 'en' ? 'contentEn' : 'contentKm';
    const languageLabel = activeLanguage === 'en'
        ? tr('English', 'អង់គ្លេស')
        : tr('Khmer', 'ខ្មែរ');

    return (
        <>
            <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="ui-inlineLangTabs">
                <Tabs.List>
                    <Tabs.Trigger value="en">EN</Tabs.Trigger>
                    <Tabs.Trigger value="km">KM</Tabs.Trigger>
                </Tabs.List>
            </Tabs>

            <FormField
                label={`${tr('Post Title', 'ចំណងជើងអត្ថបទ')} (${languageLabel})`}
                name={titleName}
                validation={activeLanguage === 'en' ? { required: tr('English title is required', 'ត្រូវការចំណងជើងជាភាសាអង់គ្លេស') } : {}}
                hint={activeLanguage === 'km' ? tr('Optional. Leave blank to fall back to English.', 'ស្រេចចិត្ត។ ទុកទទេ ដើម្បីប្រើអង់គ្លេសជំនួស។') : undefined}
            >
                <FormInput placeholder={activeLanguage === 'en' ? 'Enter english title...' : 'បញ្ចូលចំណងជើងជាភាសាខ្មែរ...'} />
            </FormField>

            <FormField
                label={`${tr('Short Excerpt', 'សេចក្តីសង្ខេបខ្លី')} (${languageLabel})`}
                name={excerptName}
                hint={tr('Used in cards, previews, and search results.', 'ប្រើសម្រាប់កាត ការមើលជាមុន និងលទ្ធផលស្វែងរក។')}
            >
                <FormInput isTextArea rows="4" placeholder={activeLanguage === 'en' ? 'A short english summary...' : 'សេចក្តីសង្ខេបខ្លីជាភាសាខ្មែរ...'} />
            </FormField>

            <FormField
                label={`${tr('Content', 'មាតិកា')} (${languageLabel})`}
                name={contentName}
                validation={activeLanguage === 'en' ? { required: tr('English content is required', 'ត្រូវការមាតិកាជាភាសាអង់គ្លេស') } : {}}
            >
                <FormMarkdownEditor
                    rows={16}
                    fullWidth={false}
                    placeholder={activeLanguage === 'en' ? 'Write the english article in Markdown...' : 'សរសេរអត្ថបទជាភាសាខ្មែរ (Markdown)...'}
                />
            </FormField>
        </>
    );
};

const BlogFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const [activeLanguage, setActiveLanguage] = useState('en');
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

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
                        <Dialog.Title>{mode === 'create' ? tr('Create New Post', 'បង្កើតអត្ថបទថ្មី') : tr('Edit Post', 'កែសម្រួលអត្ថបទ')}</Dialog.Title>
                        <Dialog.Description>
                            {tr(
                                'Manage bilingual content in one document. English is required, Khmer is optional and falls back to English.',
                                'គ្រប់គ្រងមាតិកាពីរភាសា​ក្នុងឯកសារតែមួយ។ ភាសាអង់គ្លេសត្រូវការ ខណៈភាសាខ្មែរស្រេចចិត្ត និងអាចប្រើអង់គ្លេសជំនួស។'
                            )}
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
                                        <h3>{tr('Story basics', 'មូលដ្ឋានអត្ថបទ')}</h3>
                                        <p>{tr('Switch language tabs to edit EN/KM fields without leaving this form.', 'ប្ដូរផ្ទាំងភាសា ដើម្បីកែសម្រួល EN/KM ដោយមិនចាកចេញពីសំណុំបែបបទនេះ។')}</p>
                                    </div>

                                    <BlogLocalizedFields
                                        activeLanguage={activeLanguage}
                                        setActiveLanguage={setActiveLanguage}
                                        tr={tr}
                                    />
                                </div>
                            </div>

                            <aside className="ui-blog-formLayout__aside">
                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{tr('Publishing', 'ការបោះពុម្ព')}</h3>
                                        <p>{tr('Control visibility, homepage promotion, and the public URL.', 'គ្រប់គ្រងការបង្ហាញ ការដាក់លេចធ្លោលើទំព័រដើម និង URL សាធារណៈ។')}</p>
                                    </div>

                                    <FormField
                                        label={tr('Publish Status', 'ស្ថានភាពបោះពុម្ព')}
                                        name="visible"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: tr('Published (Publicly Visible)', 'បានបោះពុម្ព (បង្ហាញជាសាធារណៈ)'), value: true },
                                                { label: tr('Draft (Admin Only)', 'សេចក្តីព្រាង (សម្រាប់ Admin ប៉ុណ្ណោះ)'), value: false }
                                            ]}
                                        />
                                    </FormField>

                                    <FormField
                                        label={tr('Homepage Highlight', 'លេចធ្លោលើទំព័រដើម')}
                                        name="featured"
                                        validation={{
                                            setValueAs: (value) => value === true || value === 'true'
                                        }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: tr('Normal Post', 'អត្ថបទធម្មតា'), value: false },
                                                { label: tr('Featured on Homepage', 'លេចធ្លោលើទំព័រដើម'), value: true }
                                            ]}
                                        />
                                    </FormField>

                                    <FormField
                                        label={tr('Custom Slug', 'Slug ផ្ទាល់ខ្លួន')}
                                        name="slug"
                                        hint={tr('Leave blank to generate the URL automatically from the English title.', 'ទុកទទេ ដើម្បីបង្កើត URL ពីចំណងជើងអង់គ្លេសដោយស្វ័យប្រវត្តិ។')}
                                    >
                                        <FormInput placeholder={tr('e.g. my-blog-post', 'ឧ. អត្ថបទ-របស់-ខ្ញុំ')} />
                                    </FormField>

                                    <FormField
                                        label={tr('Tags', 'ស្លាក')}
                                        name="tags"
                                        hint={tr('Separate topics with commas to improve filtering and related-post suggestions.', 'បំបែកប្រធានបទដោយក្បៀស ដើម្បីជួយការតម្រង និងអត្ថបទពាក់ព័ន្ធ។')}
                                    >
                                        <FormInput placeholder={tr('React, Firebase, Security', 'React, Firebase, សន្តិសុខ')} />
                                    </FormField>
                                </div>

                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{tr('Cover image', 'រូបភាពគម្រប')}</h3>
                                        <p>{tr('Use a clean, wide image to make the blog list and article header feel polished.', 'ប្រើរូបភាពទូលាយ និងច្បាស់ ដើម្បីឲ្យបញ្ជីប្លុក និងក្បាលអត្ថបទមើលទៅមានគុណភាព។')}</p>
                                    </div>

                                    <FormField label={tr('Cover Image', 'រូបគម្រប')}>
                                        <BlogCoverImageField currentImageUrl={initialData?.coverImage} tr={tr} />
                                    </FormField>
                                </div>
                            </aside>
                        </div>
                    </Dialog.Body>

                    <Dialog.Footer className="ui-blog-dialog__footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="ui-blog-dialog__footerNote">
                            {tr(
                                'Both languages are stored in one Firestore document. Khmer can remain empty while content is being translated.',
                                'ទិន្នន័យភាសាទាំងពីរត្រូវបានរក្សាទុកក្នុងឯកសារ Firestore តែមួយ។ ភាសាខ្មែរអាចទុកទទេខណៈពេលកំពុងបកប្រែ។'
                            )}
                        </div>
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                {tr('Cancel', 'បោះបង់')}
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? tr('Saving...', 'កំពុងរក្សាទុក...') : tr('Save Blog Post', 'រក្សាទុកអត្ថបទប្លុក')}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default BlogFormDialog;
