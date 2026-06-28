import React, { useState } from 'react';
import { Dialog, Button, Tabs } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import { getLanguageValue } from '../../../../utils/localization';
import { useTranslation } from '../../../../hooks/useTranslation';

const AwardLocalizedFields = () => {
    const [activeLanguage, setActiveLanguage] = useState('en');
    const { t } = useTranslation();
    const languageLabel = activeLanguage === 'en' ? t('admin.awards.form.languages.en', 'English') : t('admin.awards.form.languages.km', 'Khmer');
    const titleName = activeLanguage === 'en' ? 'titleEn' : 'titleKm';
    const organizationName = activeLanguage === 'en' ? 'organizationEn' : 'organizationKm';
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
                label={`${t('admin.awards.form.fields.title', 'Title')} (${languageLabel})`}
                name={titleName}
                validation={activeLanguage === 'en' ? { required: t('admin.awards.form.fields.titleRequired', 'Title is required') } : {}}
            >
                <FormInput placeholder={t('admin.awards.form.fields.titlePlaceholder', 'e.g., Best Security Policy')} />
            </FormField>

            <FormField
                key={organizationName}
                label={`${t('admin.awards.form.fields.organization', 'Organization')} (${languageLabel})`}
                name={organizationName}
            >
                <FormInput placeholder={t('admin.awards.form.fields.organizationPlaceholder', 'e.g., ISC2')} />
            </FormField>

            <FormField
                key={descriptionName}
                label={`${t('admin.awards.form.fields.description', 'Description')} (${languageLabel})`}
                name={descriptionName}
            >
                <FormInput isTextArea rows="3" placeholder={t('admin.awards.form.fields.descriptionPlaceholder', 'Description...')} />
            </FormField>
        </>
    );
};

const AwardFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const { t } = useTranslation();

    const defaultValues = {
        titleEn: getLanguageValue(initialData?.title, 'en', true),
        titleKm: getLanguageValue(initialData?.title, 'km', false),
        organizationEn: getLanguageValue(initialData?.organization, 'en', true),
        organizationKm: getLanguageValue(initialData?.organization, 'km', false),
        descriptionEn: getLanguageValue(initialData?.description, 'en', true),
        descriptionKm: getLanguageValue(initialData?.description, 'km', false),
        issueDate: '',
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
                        {mode === 'create' ? t('admin.awards.dialogs.createTitle', 'Add Award') : t('admin.awards.dialogs.editTitle', 'Edit Award')}
                    </Dialog.Title>
                </Dialog.Header>
                <div className="ui-blog-dialog__body">
                    <Form id="award-form" defaultValues={defaultValues} onSubmit={onSubmit} className="ui-blog-formLayout">
                        <div className="ui-blog-formLayout__main">
                            <div className="ui-blog-formCard">
                                <AwardLocalizedFields />
                            </div>
                        </div>
                        <div className="ui-blog-formLayout__sidebar">
                            <div className="ui-blog-formCard">
                                <h3 className="ui-blog-formCard__title">{t('admin.awards.form.sections.details', 'Details')}</h3>
                                
                                <FormField label={t('admin.awards.form.fields.issueDate', 'Issue Date')} name="issueDate">
                                    <FormInput type="date" />
                                </FormField>

                                <FormField label={t('admin.awards.form.fields.link', 'URL / Link')} name="link">
                                    <FormInput placeholder="https://..." />
                                </FormField>
                            </div>

                            <div className="ui-blog-formCard">
                                <h3 className="ui-blog-formCard__title">{t('admin.common.status', 'Status')}</h3>
                                <div className="ui-blog-formCard__toggles">
                                    <FormField
                                        label={t('admin.common.visible', 'Visible')}
                                        name="visible"
                                        description={t('admin.awards.form.hints.visible', 'Show on public site')}
                                        isToggle
                                    />
                                    <FormField
                                        label={t('admin.common.featured', 'Featured')}
                                        name="featured"
                                        description={t('admin.awards.form.hints.featured', 'Highlight on main page')}
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
                    <Button type="submit" form="award-form" disabled={loading} loading={loading}>
                        {mode === 'create' ? t('admin.common.create', 'Create') : t('admin.common.save', 'Save')}
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog>
    );
};

export default AwardFormDialog;
