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

const EducationLocalizedFields = ({ activeLanguage, setActiveLanguage }) => {
    const { t } = useTranslation();
    const languageLabel = activeLanguage === 'en' ? t('admin.education.form.languages.en') : t('admin.education.form.languages.km');
    const schoolName = activeLanguage === 'en' ? 'schoolEn' : 'schoolKm';
    const degreeName = activeLanguage === 'en' ? 'degreeEn' : 'degreeKm';
    const fieldOfStudyName = activeLanguage === 'en' ? 'fieldOfStudyEn' : 'fieldOfStudyKm';
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
                label={`${t('admin.education.form.fields.schoolName')} (${languageLabel})`}
                name={schoolName}
                validation={activeLanguage === 'en' ? { required: t('admin.education.form.fields.schoolRequired') } : {}}
            >
                <FormInput placeholder={activeLanguage === 'en' ? t('admin.education.form.fields.schoolPlaceholderEn') : t('admin.education.form.fields.schoolPlaceholderKm')} />
            </FormField>

            <FormField
                label={`${t('admin.education.form.fields.degree')} (${languageLabel})`}
                name={degreeName}
                validation={activeLanguage === 'en' ? { required: t('admin.education.form.fields.degreeRequired') } : {}}
            >
                <FormInput placeholder={activeLanguage === 'en' ? t('admin.education.form.fields.degreePlaceholderEn') : t('admin.education.form.fields.degreePlaceholderKm')} />
            </FormField>

            <FormField
                label={`${t('admin.education.form.fields.fieldOfStudy')} (${languageLabel})`}
                name={fieldOfStudyName}
            >
                <FormInput placeholder={activeLanguage === 'en' ? t('admin.education.form.fields.fieldOfStudyPlaceholderEn') : t('admin.education.form.fields.fieldOfStudyPlaceholderKm')} />
            </FormField>

            <FormField
                label={`${t('admin.education.form.fields.description')} (${languageLabel})`}
                name={descriptionName}
            >
                <FormMarkdownEditor
                    id={`education-description-${activeLanguage}`}
                    rows={6}
                    fullWidth={false}
                />
            </FormField>
        </>
    );
};

const EducationFormFields = ({ activeLanguage, setActiveLanguage }) => {
    const { t } = useTranslation();
    const { register, watch } = useFormContext();
    const isPresent = watch('isPresent');

    return (
        <div className="ui-blog-formLayout">
            <div className="ui-blog-formLayout__main">
                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>{t('admin.education.form.sections.degreeDetails.title')}</h3>
                        <p>{t('admin.education.form.sections.degreeDetails.description')}</p>
                    </div>

                    <EducationLocalizedFields
                        activeLanguage={activeLanguage}
                        setActiveLanguage={setActiveLanguage}
                    />
                </div>
            </div>

            <aside className="ui-blog-formLayout__aside">
                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>{t('admin.education.form.sections.timeline.title')}</h3>
                        <p>{t('admin.education.form.sections.timeline.description')}</p>
                    </div>

                    <FormField
                        label={t('admin.education.form.fields.startYear')}
                        name="startYear"
                        validation={{ required: t('admin.education.form.fields.startYearRequired') }}
                    >
                        <FormInput type="text" placeholder="YYYY" />
                    </FormField>

                    <label className={`ui-EducationPresentToggle ${isPresent ? 'ui-EducationPresentToggle--active' : ''}`}>
                        <input type="checkbox" {...register('isPresent')} />
                        <span className="ui-EducationPresentToggle__control" />
                        <span className="ui-EducationPresentToggle__copy">
                            <strong>{t('admin.education.form.fields.isCurrent')}</strong>
                        </span>
                    </label>

                    <FormField
                        label={t('admin.education.form.fields.endYear')}
                        name="endYear"
                        validation={{
                            required: !isPresent ? t('admin.education.form.fields.endYearRequired') : false,
                        }}
                    >
                        <FormInput type="text" placeholder="YYYY" disabled={isPresent} />
                    </FormField>
                </div>

                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>{t('admin.education.form.sections.visibility.title')}</h3>
                        <p>{t('admin.education.form.sections.visibility.description')}</p>
                    </div>

                    <FormField
                        label={t('admin.education.form.fields.visibility')}
                        name="visible"
                        validation={{
                            setValueAs: (value) => value === true || value === 'true'
                        }}
                    >
                        <FormSelect
                            options={[
                                { label: t('admin.education.form.fields.optionVisible'), value: true },
                                { label: t('admin.education.form.fields.optionHidden'), value: false }
                            ]}
                        />
                    </FormField>
                </div>
            </aside>
        </div>
    );
};

const EducationFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const [activeLanguage, setActiveLanguage] = useState('en');
    const { t } = useTranslation();

    const defaultValues = {
        schoolEn: getLanguageValue(initialData?.school, 'en', true),
        schoolKm: getLanguageValue(initialData?.school, 'km', false),
        degreeEn: getLanguageValue(initialData?.degree, 'en', true),
        degreeKm: getLanguageValue(initialData?.degree, 'km', false),
        fieldOfStudyEn: getLanguageValue(initialData?.fieldOfStudy, 'en', true),
        fieldOfStudyKm: getLanguageValue(initialData?.fieldOfStudy, 'km', false),
        descriptionEn: getLanguageValue(initialData?.description, 'en', true),
        descriptionKm: getLanguageValue(initialData?.description, 'km', false),
        startYear: '',
        endYear: '',
        isPresent: false,
        visible: true,
        ...initialData
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="1040px" className="ui-blog-dialog">
                <Dialog.Header className="ui-blog-dialog__header">
                    <div className="ui-blog-dialog__heading">
                        <Dialog.Title>{mode === 'create' ? t('admin.education.form.dialogs.addTitle') : t('admin.education.form.dialogs.editTitle')}</Dialog.Title>
                        <Dialog.Description>
                            {t('admin.education.form.dialogs.description')}
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
                        <EducationFormFields
                            activeLanguage={activeLanguage}
                            setActiveLanguage={setActiveLanguage}
                        />
                    </Dialog.Body>

                    <Dialog.Footer className="ui-blog-dialog__footer">
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                {t('admin.education.form.actions.cancel')}
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? t('admin.education.form.actions.saving') : t('admin.education.form.actions.save')}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default EducationFormDialog;
