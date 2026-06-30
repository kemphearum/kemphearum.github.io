import React, { useState } from 'react';
import { Dialog, Button, Tabs } from '../../../../shared/components/ui';
import Form from '../../components/Form';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import FormDropzone from '../../components/FormDropzone';
import { Controller, useFormContext } from 'react-hook-form';
import { getLanguageValue } from '../../../../utils/localization';
import { useTranslation } from '../../../../hooks/useTranslation';

const CertificateBadgeField = () => {
    const { t } = useTranslation();
    const { control, setValue, watch } = useFormContext();
    const activeImage = watch('badgeUrl');

    return (
        <Controller
            name="badge"
            control={control}
            render={({ field }) => (
                <FormDropzone
                    file={field.value}
                    onFileChange={(file) => {
                        field.onChange(file);
                        if (file) {
                            setValue('badgeUrl', '', { shouldDirty: true });
                        }
                    }}
                    currentImageUrl={activeImage}
                    onClearExisting={() => setValue('badgeUrl', '', { shouldDirty: true })}
                    placeholder={t('admin.certificates.form.fields.uploadBadgePlaceholder')}
                    circular={true}
                />
            )}
        />
    );
};

const CertificateLocalizedFields = () => {
    const [activeLanguage, setActiveLanguage] = useState('en');
    const { t } = useTranslation();
    const languageLabel = activeLanguage === 'en' ? t('admin.certificates.form.languages.en') : t('admin.certificates.form.languages.km');
    const nameName = activeLanguage === 'en' ? 'nameEn' : 'nameKm';
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
                key={nameName}
                label={`${t('admin.certificates.form.fields.name')} (${languageLabel})`}
                name={nameName}
                validation={activeLanguage === 'en' ? { required: t('admin.certificates.form.fields.nameRequired') } : {}}
            >
                <FormInput placeholder={t('admin.certificates.form.fields.namePlaceholder')} />
            </FormField>

            <FormField
                key={descriptionName}
                label={`${t('admin.certificates.form.fields.description')} (${languageLabel})`}
                name={descriptionName}
            >
                <FormInput isTextArea rows="3" placeholder={t('admin.certificates.form.fields.descriptionPlaceholder')} />
            </FormField>
        </>
    );
};

const CertificatesFormDialog = ({ open, onOpenChange, mode, initialData, onSubmit, loading }) => {
    const { t } = useTranslation();

    const defaultValues = {
        nameEn: getLanguageValue(initialData?.name, 'en', true),
        nameKm: getLanguageValue(initialData?.name, 'km', false),
        descriptionEn: getLanguageValue(initialData?.description, 'en', true),
        descriptionKm: getLanguageValue(initialData?.description, 'km', false),
        organization: '',
        issueDate: '',
        expiryDate: '',
        credentialId: '',
        url: '',
        badgeUrl: '',
        badge: null,
        slug: '',
        visible: true,
        featured: false,
        ...initialData,
        skillsCovered: Array.isArray(initialData?.skillsCovered) ? initialData.skillsCovered.join(', ') : (initialData?.skillsCovered || ''),
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="860px" className="ui-blog-dialog">
                <Dialog.Header className="ui-blog-dialog__header">
                    <div className="ui-blog-dialog__heading">
                        <Dialog.Title>{mode === 'create' ? t('admin.certificates.form.dialogs.addTitle') : t('admin.certificates.form.dialogs.editTitle')}</Dialog.Title>
                        <Dialog.Description>{t('admin.certificates.form.dialogs.description')}</Dialog.Description>
                    </div>
                    <Dialog.Close />
                </Dialog.Header>

                <Form onSubmit={onSubmit} defaultValues={defaultValues} key={open ? 'open' : 'closed'}>
                    <Dialog.Body className="ui-blog-dialog__body">
                        <div className="ui-blog-formLayout">
                            <div className="ui-blog-formLayout__main">
                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{t('admin.certificates.form.sections.details.title')}</h3>
                                        <p>{t('admin.certificates.form.sections.details.description')}</p>
                                    </div>
                                    <CertificateLocalizedFields />

                                    <FormField
                                        label={t('admin.certificates.form.fields.organization')}
                                        name="organization"
                                        validation={{ required: t('admin.certificates.form.fields.organizationRequired') }}
                                    >
                                        <FormInput placeholder={t('admin.certificates.form.fields.organizationPlaceholder')} />
                                    </FormField>
                                </div>
                            </div>

                            <aside className="ui-blog-formLayout__aside">
                                <div className="ui-blog-formSection">
                                    <div className="ui-blog-formSection__head">
                                        <h3>{t('admin.certificates.form.sections.credential.title')}</h3>
                                        <p>{t('admin.certificates.form.sections.credential.description')}</p>
                                    </div>

                                    <FormField label={t('admin.certificates.form.fields.issueDate')} name="issueDate">
                                        <FormInput type="month" />
                                    </FormField>

                                    <FormField label={t('admin.certificates.form.fields.expiryDate')} name="expiryDate" hint={t('admin.certificates.form.fields.expiryHint')}>
                                        <FormInput type="month" />
                                    </FormField>

                                    <FormField label={t('admin.certificates.form.fields.credentialId')} name="credentialId">
                                        <FormInput placeholder={t('admin.certificates.form.fields.credentialIdPlaceholder')} />
                                    </FormField>

                                    <FormField label={t('admin.certificates.form.fields.url')} name="url">
                                        <FormInput placeholder={t('admin.certificates.form.fields.urlPlaceholder')} />
                                    </FormField>

                                    <FormField label={t('admin.certificates.form.fields.skillsCovered')} name="skillsCovered" hint={t('admin.certificates.form.fields.skillsCoveredHint')}>
                                        <FormInput placeholder={t('admin.certificates.form.fields.skillsCoveredPlaceholder')} />
                                    </FormField>

                                    <FormField label={t('admin.certificates.form.fields.credentialBadge')}>
                                        <CertificateBadgeField />
                                    </FormField>

                                    <FormField label={t('admin.certificates.form.fields.slug')} name="slug" hint={t('admin.certificates.form.fields.slugHint')}>
                                        <FormInput placeholder={t('admin.certificates.form.fields.slugPlaceholder')} />
                                    </FormField>

                                    <FormField
                                        label={t('admin.certificates.form.fields.visibility')}
                                        name="visible"
                                        validation={{ setValueAs: (value) => value === true || value === 'true' }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: t('admin.certificates.form.fields.optionVisible'), value: true },
                                                { label: t('admin.certificates.form.fields.optionHidden'), value: false }
                                            ]}
                                        />
                                    </FormField>

                                    <FormField
                                        label={t('admin.certificates.form.fields.featured')}
                                        name="featured"
                                        validation={{ setValueAs: (value) => value === true || value === 'true' }}
                                    >
                                        <FormSelect
                                            options={[
                                                { label: t('admin.certificates.form.fields.optionFeatured'), value: true },
                                                { label: t('admin.certificates.form.fields.optionNotFeatured'), value: false }
                                            ]}
                                        />
                                    </FormField>
                                </div>
                            </aside>
                        </div>
                    </Dialog.Body>

                    <Dialog.Footer className="ui-blog-dialog__footer">
                        <div className="ui-blog-dialog__footerActions">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
                                {t('admin.certificates.form.actions.cancel')}
                            </Button>
                            <Button type="submit" isLoading={loading} className="ui-primary">
                                {loading ? t('admin.certificates.form.actions.saving') : t('admin.certificates.form.actions.save')}
                            </Button>
                        </div>
                    </Dialog.Footer>
                </Form>
            </Dialog.Content>
        </Dialog>
    );
};

export default CertificatesFormDialog;
