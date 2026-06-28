import React, { useState } from 'react';
import { Dialog, Button, Tabs } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import { getLanguageValue } from '../../../../utils/localization';
import { useTranslation } from '../../../../hooks/useTranslation';

const SpeakingLocalizedFields = () => {
    const [activeLanguage, setActiveLanguage] = useState('en');
    const { t } = useTranslation();
    const languageLabel = activeLanguage === 'en' ? t('admin.speaking.form.languages.en', 'English') : t('admin.speaking.form.languages.km', 'Khmer');
    const titleName = activeLanguage === 'en' ? 'titleEn' : 'titleKm';
    const eventNameName = activeLanguage === 'en' ? 'eventNameEn' : 'eventNameKm';
    const locationName = activeLanguage === 'en' ? 'locationEn' : 'locationKm';
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
                key={titleName}
                label={`${t('admin.speaking.form.fields.title', 'Topic/Title')} (${languageLabel})`}
                name={titleName}
                validation={activeLanguage === 'en' ? { required: t('admin.speaking.form.fields.titleRequired', 'Title is required') } : {}}
            >
                <FormInput placeholder={t('admin.speaking.form.fields.titlePlaceholder', 'e.g., Securing the Cloud')} />
            </FormField>

            <FormField
                key={eventNameName}
                label={`${t('admin.speaking.form.fields.eventName', 'Event Name')} (${languageLabel})`}
                name={eventNameName}
            >
                <FormInput placeholder={t('admin.speaking.form.fields.eventNamePlaceholder', 'e.g., DEF CON 30')} />
            </FormField>
            
            <FormField
                key={locationName}
                label={`${t('admin.speaking.form.fields.location', 'Location')} (${languageLabel})`}
                name={locationName}
            >
                <FormInput placeholder={t('admin.speaking.form.fields.locationPlaceholder', 'e.g., Las Vegas, NV')} />
            </FormField>

            <FormField
                key={descriptionName}
                label={`${t('admin.speaking.form.fields.description', 'Description')} (${languageLabel})`}
                name={descriptionName}
            >
                <FormInput isTextArea rows="3" placeholder={t('admin.speaking.form.fields.descriptionPlaceholder', 'Summary of the talk...')} />
            </FormField>
        </>
    );
};

const SpeakingFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const { t } = useTranslation();

    const defaultValues = {
        titleEn: getLanguageValue(initialData?.title, 'en', true),
        titleKm: getLanguageValue(initialData?.title, 'km', false),
        eventNameEn: getLanguageValue(initialData?.eventName, 'en', true),
        eventNameKm: getLanguageValue(initialData?.eventName, 'km', false),
        locationEn: getLanguageValue(initialData?.location, 'en', true),
        locationKm: getLanguageValue(initialData?.location, 'km', false),
        descriptionEn: getLanguageValue(initialData?.description, 'en', true),
        descriptionKm: getLanguageValue(initialData?.description, 'km', false),
        date: '',
        link: '',
        visible: true,
        featured: false,
        ...initialData,
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="860px" className="ui-blog-dialog">
                <Dialog.Header className="ui-blog-dialog__header">
                    <Dialog.Title className="ui-blog-dialog__title">
                        {mode === 'create' ? t('admin.speaking.dialogs.createTitle', 'Add Speaking Event') : t('admin.speaking.dialogs.editTitle', 'Edit Speaking Event')}
                    </Dialog.Title>
                </Dialog.Header>
                <div className="ui-blog-dialog__body">
                    <Form id="speaking-form" defaultValues={defaultValues} onSubmit={onSubmit} className="ui-blog-formLayout">
                        <div className="ui-blog-formLayout__main">
                            <div className="ui-blog-formCard">
                                <SpeakingLocalizedFields />
                            </div>
                        </div>
                        <div className="ui-blog-formLayout__sidebar">
                            <div className="ui-blog-formCard">
                                <h3 className="ui-blog-formCard__title">{t('admin.speaking.form.sections.details', 'Details')}</h3>
                                
                                <FormField label={t('admin.speaking.form.fields.date', 'Event Date')} name="date">
                                    <FormInput type="date" />
                                </FormField>

                                <FormField label={t('admin.speaking.form.fields.link', 'URL / Link')} name="link">
                                    <FormInput placeholder="https://..." />
                                </FormField>
                            </div>

                            <div className="ui-blog-formCard">
                                <h3 className="ui-blog-formCard__title">{t('admin.common.status', 'Status')}</h3>
                                <div className="ui-blog-formCard__toggles">
                                    <FormField
                                        label={t('admin.common.visible', 'Visible')}
                                        name="visible"
                                        description={t('admin.speaking.form.hints.visible', 'Show on public site')}
                                        isToggle
                                    />
                                    <FormField
                                        label={t('admin.common.featured', 'Featured')}
                                        name="featured"
                                        description={t('admin.speaking.form.hints.featured', 'Highlight on main page')}
                                        isToggle
                                    />
                                </div>
                            </div>
                        </div>
                    </Form>
                </div>
                <Dialog.Footer className="ui-blog-dialog__footer">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        {t('admin.common.cancel', 'Cancel')}
                    </Button>
                    <Button type="submit" form="speaking-form" disabled={loading} loading={loading}>
                        {mode === 'create' ? t('admin.common.create', 'Create') : t('admin.common.save', 'Save')}
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog>
    );
};

export default SpeakingFormDialog;
