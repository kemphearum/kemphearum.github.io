import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Dialog, Button, Tabs } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import FormSelect from '../../components/FormSelect';
import { getLanguageValue } from '../../../../utils/localization';

const ExperienceLocalizedFields = ({ activeLanguage, setActiveLanguage }) => {
    const languageLabel = activeLanguage === 'en' ? 'English' : 'Khmer';
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
                label={`Company Name (${languageLabel})`}
                name={companyName}
                validation={activeLanguage === 'en' ? { required: 'English company name is required' } : {}}
                hint={activeLanguage === 'km' ? 'Optional. English fallback is automatic.' : undefined}
            >
                <FormInput placeholder="e.g. Google Inc." />
            </FormField>

            <FormField
                label={`Role / Job Title (${languageLabel})`}
                name={roleName}
                validation={activeLanguage === 'en' ? { required: 'English role is required' } : {}}
            >
                <FormInput placeholder="e.g. Senior Developer" />
            </FormField>

            <FormField
                label={`Description (${languageLabel})`}
                name={descriptionName}
                validation={activeLanguage === 'en' ? { required: 'English description is required' } : {}}
                hint="Use Markdown to highlight impact and measurable outcomes."
            >
                <FormMarkdownEditor
                    id={`experience-description-${activeLanguage}`}
                    rows={8}
                    fullWidth={false}
                    placeholder={`Describe responsibilities in ${languageLabel.toLowerCase()}...`}
                />
            </FormField>
        </>
    );
};

const ExperienceFormFields = ({ activeLanguage, setActiveLanguage }) => {
    const { register, watch } = useFormContext();
    const isPresent = watch('isPresent');
    const startDate = watch('startDate');

    return (
        <div className="ui-blog-formLayout">
            <div className="ui-blog-formLayout__main">
                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>Role details</h3>
                        <p>Use EN/KM tabs to maintain bilingual experience entries in one record.</p>
                    </div>

                    <ExperienceLocalizedFields
                        activeLanguage={activeLanguage}
                        setActiveLanguage={setActiveLanguage}
                    />
                </div>

                <div className="ui-blog-formSection ui-blog-formSection--editor">
                    <div className="ui-blog-formSection__head">
                        <h3>Timeline guidance</h3>
                        <p>Use month precision to keep sorting and career progression consistent.</p>
                    </div>
                    <div className="ui-experienceTimelineHint">
                        Current roles can leave the end date empty. Past roles should include both start and end months.
                    </div>
                </div>
            </div>

            <aside className="ui-blog-formLayout__aside">
                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>Timeline</h3>
                        <p>Set role duration accurately so the public timeline stays trustworthy.</p>
                    </div>

                    <FormField
                        label="Start Date"
                        name="startDate"
                        validation={{ required: 'Start date is required' }}
                    >
                        <FormInput type="month" />
                    </FormField>

                    <label className={`ui-experiencePresentToggle ${isPresent ? 'ui-experiencePresentToggle--active' : ''}`}>
                        <input type="checkbox" {...register('isPresent')} />
                        <span className="ui-experiencePresentToggle__control" />
                        <span className="ui-experiencePresentToggle__copy">
                            <strong>This role is current</strong>
                            <span>Hide the end date and label the role as present.</span>
                        </span>
                    </label>

                    <FormField
                        label="End Date"
                        name="endDate"
                        hint={isPresent ? 'Current roles do not need an end date.' : 'Required for past roles.'}
                        validation={{
                            required: !isPresent ? 'End date is required' : false,
                            validate: (value) => {
                                if (isPresent || !value || !startDate) return true;
                                return value >= startDate || 'End date must be the same or after start date';
                            }
                        }}
                    >
                        <FormInput type="month" disabled={isPresent} />
                    </FormField>
                </div>

                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>Visibility</h3>
                        <p>Control whether this role appears publicly or remains admin-only.</p>
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
                                { label: 'Visible on Homepage', value: true },
                                { label: 'Hidden from Public', value: false }
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
                        <Dialog.Title>{mode === 'create' ? 'Add New Experience' : 'Edit Experience'}</Dialog.Title>
                        <Dialog.Description>
                            Keep each entry bilingual in one document. English is required, Khmer is optional.
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
                        />
                    </Dialog.Body>

                    <Dialog.Footer className="ui-blog-dialog__footer">
                        <div className="ui-blog-dialog__footerNote">
                            EN and KM values are stored together. Khmer can stay empty while translations are pending.
                        </div>
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? 'Saving...' : 'Save Experience'}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default ExperienceFormDialog;
