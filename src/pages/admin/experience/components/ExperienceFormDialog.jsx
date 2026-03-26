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

const ExperienceLocalizedFields = ({ activeLanguage, setActiveLanguage }) => {
    const { t } = useTranslation();
    const languageLabel = activeLanguage === 'en' ? t('admin.experience.form.languages.en') : t('admin.experience.form.languages.km');
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
                label={`${t('admin.experience.form.fields.companyName')} (${languageLabel})`}
                name={companyName}
                validation={activeLanguage === 'en' ? { required: t('admin.experience.form.fields.companyRequired') } : {}}
                hint={activeLanguage === 'km' ? t('admin.experience.form.fields.companyHint') : undefined}
            >
                <FormInput placeholder={activeLanguage === 'en' ? t('admin.experience.form.fields.companyPlaceholderEn') : t('admin.experience.form.fields.companyPlaceholderKm')} />
            </FormField>

            <FormField
                label={`${t('admin.experience.form.fields.role')} (${languageLabel})`}
                name={roleName}
                validation={activeLanguage === 'en' ? { required: t('admin.experience.form.fields.roleRequired') } : {}}
            >
                <FormInput placeholder={activeLanguage === 'en' ? t('admin.experience.form.fields.rolePlaceholderEn') : t('admin.experience.form.fields.rolePlaceholderKm')} />
            </FormField>

            <FormField
                label={`${t('admin.experience.form.fields.description')} (${languageLabel})`}
                name={descriptionName}
                validation={activeLanguage === 'en' ? { required: t('admin.experience.form.fields.descriptionRequired') } : {}}
                hint={t('admin.experience.form.fields.descriptionHint')}
            >
                <FormMarkdownEditor
                    id={`experience-description-${activeLanguage}`}
                    rows={8}
                    fullWidth={false}
                    placeholder={activeLanguage === 'en' ? t('admin.experience.form.fields.descriptionPlaceholderEn') : t('admin.experience.form.fields.descriptionPlaceholderKm')}
                />
            </FormField>
        </>
    );
};

const ExperienceFormFields = ({ activeLanguage, setActiveLanguage }) => {
    const { t } = useTranslation();
    const { register, watch } = useFormContext();
    const isPresent = watch('isPresent');
    const startDate = watch('startDate');

    return (
        <div className="ui-blog-formLayout">
            <div className="ui-blog-formLayout__main">
                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>{t('admin.experience.form.sections.roleDetails.title')}</h3>
                        <p>{t('admin.experience.form.sections.roleDetails.description')}</p>
                    </div>

                    <ExperienceLocalizedFields
                        activeLanguage={activeLanguage}
                        setActiveLanguage={setActiveLanguage}
                    />
                </div>

                <div className="ui-blog-formSection ui-blog-formSection--editor">
                    <div className="ui-blog-formSection__head">
                        <h3>{t('admin.experience.form.sections.timelineGuidance.title')}</h3>
                        <p>{t('admin.experience.form.sections.timelineGuidance.description')}</p>
                    </div>
                    <div className="ui-experienceTimelineHint">
                        {t('admin.experience.form.sections.timelineGuidance.hint')}
                    </div>
                </div>
            </div>

            <aside className="ui-blog-formLayout__aside">
                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>{t('admin.experience.form.sections.timeline.title')}</h3>
                        <p>{t('admin.experience.form.sections.timeline.description')}</p>
                    </div>

                    <FormField
                        label={t('admin.experience.form.fields.startDate')}
                        name="startDate"
                        validation={{ required: t('admin.experience.form.fields.startDateRequired') }}
                    >
                        <FormInput type="month" />
                    </FormField>

                    <label className={`ui-experiencePresentToggle ${isPresent ? 'ui-experiencePresentToggle--active' : ''}`}>
                        <input type="checkbox" {...register('isPresent')} />
                        <span className="ui-experiencePresentToggle__control" />
                        <span className="ui-experiencePresentToggle__copy">
                            <strong>{t('admin.experience.form.fields.isCurrent')}</strong>
                            <span>{t('admin.experience.form.fields.isCurrentDesc')}</span>
                        </span>
                    </label>

                    <FormField
                        label={t('admin.experience.form.fields.endDate')}
                        name="endDate"
                        hint={isPresent ? t('admin.experience.form.fields.endDateHint') : t('admin.experience.form.fields.endDateRequiredHint')}
                        validation={{
                            required: !isPresent ? t('admin.experience.form.fields.endDateRequired') : false,
                            validate: (value) => {
                                if (isPresent || !value || !startDate) return true;
                                return value >= startDate || t('admin.experience.form.fields.endDateInvalid');
                            }
                        }}
                    >
                        <FormInput type="month" disabled={isPresent} />
                    </FormField>
                </div>

                <div className="ui-blog-formSection">
                    <div className="ui-blog-formSection__head">
                        <h3>{t('admin.experience.form.sections.visibility.title')}</h3>
                        <p>{t('admin.experience.form.sections.visibility.description')}</p>
                    </div>

                    <FormField
                        label={t('admin.experience.form.fields.visibility')}
                        name="visible"
                        validation={{
                            setValueAs: (value) => value === true || value === 'true'
                        }}
                    >
                        <FormSelect
                            options={[
                                { label: t('admin.experience.form.fields.optionVisible'), value: true },
                                { label: t('admin.experience.form.fields.optionHidden'), value: false }
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
    const { t } = useTranslation();

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
                        <Dialog.Title>{mode === 'create' ? t('admin.experience.form.dialogs.addTitle') : t('admin.experience.form.dialogs.editTitle')}</Dialog.Title>
                        <Dialog.Description>
                            {t('admin.experience.form.dialogs.description')}
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
                            {t('admin.experience.form.dialogs.footerNote')}
                        </div>
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                {t('admin.experience.form.actions.cancel')}
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? t('admin.experience.form.actions.saving') : t('admin.experience.form.actions.save')}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default ExperienceFormDialog;
