import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Dialog, Button, Tabs } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import FormSelect from '../../components/FormSelect';
import { getLanguageValue } from '../../../../utils/localization';
import { useTranslation } from '../../../../hooks/useTranslation';

const ExperienceLocalizedFields = ({ activeLanguage, setActiveLanguage, tr }) => {
    const languageLabel = activeLanguage === 'en' ? tr('English', 'អង់គ្លេស') : tr('Khmer', 'ខ្មែរ');
    const companyName = activeLanguage === 'en' ? 'companyEn' : 'companyKm';
    const roleName = activeLanguage === 'en' ? 'roleEn' : 'roleKm';
    const descriptionName = activeLanguage === 'en' ? 'descriptionEn' : 'descriptionKm';

    return (
        <>
            <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="ui-inlineLangTabs">
                <Tabs.List>
                    <Tabs.Trigger value="en">EN</Tabs.Trigger>
                    <Tabs.Trigger value="km">KM</Tabs.Trigger>
                </Tabs.List>
            </Tabs>

            <FormField
                label={`${tr('Company Name', 'ឈ្មោះក្រុមហ៊ុន')} (${languageLabel})`}
                name={companyName}
                validation={activeLanguage === 'en' ? { required: tr('English company name is required', 'ត្រូវការឈ្មោះក្រុមហ៊ុនជាអង់គ្លេស') } : {}}
                hint={activeLanguage === 'km' ? tr('Optional. English fallback is automatic.', 'ស្រេចចិត្ត។ ប្រើអង់គ្លេសជំនួសដោយស្វ័យប្រវត្តិ។') : undefined}
            >
                <FormInput placeholder={activeLanguage === 'en' ? 'e.g. Google Inc.' : 'ឧ. ក្រុមហ៊ុន Google'} />
            </FormField>

            <FormField
                label={`${tr('Role / Job Title', 'តួនាទី / មុខតំណែង')} (${languageLabel})`}
                name={roleName}
                validation={activeLanguage === 'en' ? { required: tr('English role is required', 'ត្រូវការតួនាទីជាអង់គ្លេស') } : {}}
            >
                <FormInput placeholder={activeLanguage === 'en' ? 'e.g. Senior Developer' : 'ឧ. អ្នកអភិវឌ្ឍជាន់ខ្ពស់'} />
            </FormField>

            <FormField
                label={`${tr('Description', 'ការពិពណ៌នា')} (${languageLabel})`}
                name={descriptionName}
                validation={activeLanguage === 'en' ? { required: tr('English description is required', 'ត្រូវការការពិពណ៌នាជាអង់គ្លេស') } : {}}
                hint={tr('Use Markdown to highlight impact and measurable outcomes.', 'ប្រើ Markdown ដើម្បីបង្ហាញផលប៉ះពាល់ និងលទ្ធផលដែលវាស់វែងបាន។')}
            >
                <FormMarkdownEditor
                    id={`experience-description-${activeLanguage}`}
                    rows={8}
                    fullWidth={false}
                    placeholder={activeLanguage === 'en' ? 'Describe responsibilities in english...' : 'ពិពណ៌នាភារកិច្ចជាភាសាខ្មែរ...'}
                />
            </FormField>
        </>
    );
};

const ExperienceFormFields = ({ activeLanguage, setActiveLanguage, tr }) => {
    const { register, watch } = useFormContext();
    const isPresent = watch('isPresent');
    const startDate = watch('startDate');

    return (
        <div className="ui-blog-formLayout">
            <div className="ui-blog-formLayout__main">
                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>{tr('Role details', 'ព័ត៌មានតួនាទី')}</h3>
                        <p>{tr('Use EN/KM tabs to maintain bilingual experience entries in one record.', 'ប្រើផ្ទាំង EN/KM ដើម្បីថែរក្សាទិន្នន័យពីរភាសាក្នុងកំណត់ត្រាតែមួយ។')}</p>
                    </div>

                    <ExperienceLocalizedFields
                        activeLanguage={activeLanguage}
                        setActiveLanguage={setActiveLanguage}
                        tr={tr}
                    />
                </div>

                <div className="ui-blog-formSection ui-blog-formSection--editor">
                    <div className="ui-blog-formSection__head">
                        <h3>{tr('Timeline guidance', 'ណែនាំពេលវេលា')}</h3>
                        <p>{tr('Use month precision to keep sorting and career progression consistent.', 'ប្រើកម្រិតខែដើម្បីរក្សាការរៀបលំដាប់ និងវឌ្ឍនភាពការងារឲ្យត្រឹមត្រូវ។')}</p>
                    </div>
                    <div className="ui-experienceTimelineHint">
                        {tr('Current roles can leave the end date empty. Past roles should include both start and end months.', 'តួនាទីបច្ចុប្បន្នអាចទុកកាលបរិច្ឆេទបញ្ចប់ទទេ។ តួនាទីអតីតគួរមានខែចាប់ផ្ដើម និងខែបញ្ចប់។')}
                    </div>
                </div>
            </div>

            <aside className="ui-blog-formLayout__aside">
                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>{tr('Timeline', 'ពេលវេលា')}</h3>
                        <p>{tr('Set role duration accurately so the public timeline stays trustworthy.', 'កំណត់រយៈពេលតួនាទីឲ្យត្រឹមត្រូវ ដើម្បីឲ្យ timeline សាធារណៈអាចទុកចិត្តបាន។')}</p>
                    </div>

                    <FormField
                        label={tr('Start Date', 'ថ្ងៃចាប់ផ្ដើម')}
                        name="startDate"
                        validation={{ required: tr('Start date is required', 'ត្រូវការថ្ងៃចាប់ផ្ដើម') }}
                    >
                        <FormInput type="month" />
                    </FormField>

                    <label className={`ui-experiencePresentToggle ${isPresent ? 'ui-experiencePresentToggle--active' : ''}`}>
                        <input type="checkbox" {...register('isPresent')} />
                        <span className="ui-experiencePresentToggle__control" />
                        <span className="ui-experiencePresentToggle__copy">
                            <strong>{tr('This role is current', 'តួនាទីនេះគឺបច្ចុប្បន្ន')}</strong>
                            <span>{tr('Hide the end date and label the role as present.', 'លាក់ថ្ងៃបញ្ចប់ ហើយសម្គាល់ថាកំពុងបន្ត។')}</span>
                        </span>
                    </label>

                    <FormField
                        label={tr('End Date', 'ថ្ងៃបញ្ចប់')}
                        name="endDate"
                        hint={isPresent ? tr('Current roles do not need an end date.', 'តួនាទីបច្ចុប្បន្នមិនចាំបាច់មានថ្ងៃបញ្ចប់។') : tr('Required for past roles.', 'ត្រូវការសម្រាប់តួនាទីអតីត។')}
                        validation={{
                            required: !isPresent ? tr('End date is required', 'ត្រូវការថ្ងៃបញ្ចប់') : false,
                            validate: (value) => {
                                if (isPresent || !value || !startDate) return true;
                                return value >= startDate || tr('End date must be the same or after start date', 'ថ្ងៃបញ្ចប់ត្រូវស្មើ ឬក្រោយថ្ងៃចាប់ផ្ដើម');
                            }
                        }}
                    >
                        <FormInput type="month" disabled={isPresent} />
                    </FormField>
                </div>

                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>{tr('Visibility', 'ការបង្ហាញ')}</h3>
                        <p>{tr('Control whether this role appears publicly or remains admin-only.', 'គ្រប់គ្រងថាតួនាទីនេះបង្ហាញជាសាធារណៈ ឬតែសម្រាប់ Admin ប៉ុណ្ណោះ។')}</p>
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
                                { label: tr('Visible on Homepage', 'បង្ហាញលើទំព័រដើម'), value: true },
                                { label: tr('Hidden from Public', 'លាក់ពីសាធារណៈ'), value: false }
                            ]}
                        />
                    </FormField>
                </div>
            </aside>
        </div>
    );
};

const ExperienceFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const [activeLanguage, setActiveLanguage] = useState('en');
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

    const defaultValues = {
        companyEn: getLanguageValue(initialData?.company, 'en', true),
        companyKm: getLanguageValue(initialData?.company, 'km', false),
        roleEn: getLanguageValue(initialData?.role, 'en', true),
        roleKm: getLanguageValue(initialData?.role, 'km', false),
        descriptionEn: getLanguageValue(initialData?.description, 'en', true),
        descriptionKm: getLanguageValue(initialData?.description, 'km', false),
        startDate: '',
        endDate: '',
        isPresent: false,
        visible: true,
        ...initialData
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="1040px" className="ui-blog-dialog">
                <Dialog.Header className="ui-blog-dialog__header">
                    <div className="ui-blog-dialog__heading">
                        <Dialog.Title>{mode === 'create' ? tr('Add New Experience', 'បន្ថែមបទពិសោធន៍ថ្មី') : tr('Edit Experience', 'កែសម្រួលបទពិសោធន៍')}</Dialog.Title>
                        <Dialog.Description>
                            {tr('Keep each entry bilingual in one document. English is required, Khmer is optional.', 'រក្សាទុកទិន្នន័យពីរភាសា​ក្នុងឯកសារតែមួយ។ អង់គ្លេសត្រូវការ ខ្មែរស្រេចចិត្ត។')}
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
                        <ExperienceFormFields
                            activeLanguage={activeLanguage}
                            setActiveLanguage={setActiveLanguage}
                            tr={tr}
                        />
                    </Dialog.Body>

                    <Dialog.Footer className="ui-blog-dialog__footer">
                        <div className="ui-blog-dialog__footerNote">
                            {tr('EN and KM values are stored together. Khmer can stay empty while translations are pending.', 'តម្លៃ EN និង KM ត្រូវបានរក្សាទុកជាមួយគ្នា។ ភាសាខ្មែរអាចទុកទទេ ខណៈពេលកំពុងបកប្រែ។')}
                        </div>
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                {tr('Cancel', 'បោះបង់')}
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? tr('Saving...', 'កំពុងរក្សាទុក...') : tr('Save Experience', 'រក្សាទុកបទពិសោធន៍')}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default ExperienceFormDialog;
