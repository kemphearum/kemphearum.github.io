import React from 'react';
import { IdCard, Save, History } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import { useTranslation } from '../../../../hooks/useTranslation';

const AVAILABILITY_OPTIONS = ['', 'open', 'open-to-opportunities', 'freelance', 'not-available'];

const ProfileSection = ({
    profilePreview,
    setProfilePreview,
    loading,
    onOpenHistory,
    canEdit = true,
    canViewHistory = true
}) => {
    const { t } = useTranslation();

    return (
        <div className="ui-card">
            <div className={'ui-cardHeader'}>
                <div className={'ui-icon-wrapper'}>
                    <IdCard size={24} />
                </div>
                <div className={'ui-title-meta'}>
                    <h3>{t('admin.general.sections.profile.title')}</h3>
                    <p>{t('admin.general.sections.profile.description')}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('profileInfo', t('admin.general.sections.profile.title'))}
                    className={'ui-history-btn'}
                    disabled={!canViewHistory}
                >
                    <History size={16} /> <span>{t('admin.general.sections.profile.history')}</span>
                </Button>
            </div>

            <div className={'ui-form'}>
                <div className="ui-generalSectionGrid">
                    <div className="ui-generalPrimary">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{t('admin.general.sections.profile.summary.title')}</h4>
                                <p>{t('admin.general.sections.profile.summary.description')}</p>
                            </div>

                            <FormField label={t('admin.general.sections.profile.fields.summaryEn')} name="summaryEn">
                                <FormMarkdownEditor
                                    id="profile-summary-en"
                                    placeholder={t('admin.general.sections.profile.fields.summaryPlaceholderEn')}
                                    isPreviewMode={profilePreview}
                                    onTogglePreview={() => setProfilePreview(!profilePreview)}
                                    rows="5"
                                />
                            </FormField>

                            <FormField label={t('admin.general.sections.profile.fields.summaryKm')} name="summaryKm">
                                <FormMarkdownEditor
                                    id="profile-summary-km"
                                    placeholder={t('admin.general.sections.profile.fields.summaryPlaceholderKm')}
                                    isPreviewMode={profilePreview}
                                    onTogglePreview={() => setProfilePreview(!profilePreview)}
                                    rows="5"
                                />
                            </FormField>

                            <div className="ui-formGrid">
                                <FormField label={t('admin.general.sections.profile.fields.currentRoleEn')} name="currentRoleEn">
                                    <FormInput placeholder={t('admin.general.sections.profile.fields.currentRolePlaceholder')} />
                                </FormField>
                                <FormField label={t('admin.general.sections.profile.fields.currentRoleKm')} name="currentRoleKm">
                                    <FormInput />
                                </FormField>
                            </div>

                            <div className="ui-formGrid">
                                <FormField label={t('admin.general.sections.profile.fields.locationEn')} name="locationEn">
                                    <FormInput placeholder={t('admin.general.sections.profile.fields.locationPlaceholder')} />
                                </FormField>
                                <FormField label={t('admin.general.sections.profile.fields.locationKm')} name="locationKm">
                                    <FormInput />
                                </FormField>
                            </div>

                            <FormField
                                label={t('admin.general.sections.profile.fields.accomplishments')}
                                name="accomplishments"
                                hint={t('admin.general.sections.profile.fields.accomplishmentsHint')}
                            >
                                <FormInput isTextArea rows={4} placeholder={t('admin.general.sections.profile.fields.accomplishmentsPlaceholder')} />
                            </FormField>
                        </div>
                    </div>

                    <aside className="ui-generalAside">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{t('admin.general.sections.profile.availability.title')}</h4>
                                <p>{t('admin.general.sections.profile.availability.description')}</p>
                            </div>

                            <FormField label={t('admin.general.sections.profile.fields.availabilityStatus')} name="availabilityStatus">
                                <select>
                                    {AVAILABILITY_OPTIONS.map((value) => (
                                        <option key={value || 'none'} value={value}>
                                            {value
                                                ? t(`admin.general.sections.profile.availabilityOptions.${value}`)
                                                : t('admin.general.sections.profile.availabilityOptions.none')}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label={t('admin.general.sections.profile.fields.availabilityMessageEn')} name="availabilityMessageEn">
                                <FormInput placeholder={t('admin.general.sections.profile.fields.availabilityMessagePlaceholder')} />
                            </FormField>
                            <FormField label={t('admin.general.sections.profile.fields.availabilityMessageKm')} name="availabilityMessageKm">
                                <FormInput />
                            </FormField>

                            <FormField label={t('admin.general.sections.profile.fields.responseTimeEn')} name="responseTimeEn">
                                <FormInput placeholder={t('admin.general.sections.profile.fields.responseTimePlaceholder')} />
                            </FormField>
                            <FormField label={t('admin.general.sections.profile.fields.responseTimeKm')} name="responseTimeKm">
                                <FormInput />
                            </FormField>

                            <FormField
                                label={t('admin.general.sections.profile.fields.timezone')}
                                name="timezone"
                            >
                                <FormInput placeholder={t('admin.general.sections.profile.fields.timezonePlaceholder')} />
                            </FormField>

                            <FormField
                                label={t('admin.general.sections.profile.fields.yearsExperienceOverride')}
                                name="yearsExperienceOverride"
                                hint={t('admin.general.sections.profile.fields.yearsExperienceOverrideHint')}
                            >
                                <FormInput type="number" min="0" placeholder="0" />
                            </FormField>

                            <FormField
                                label={t('admin.general.sections.profile.fields.workTypes')}
                                name="workTypes"
                                hint={t('admin.general.sections.profile.fields.workTypesHint')}
                            >
                                <FormInput placeholder={t('admin.general.sections.profile.fields.workTypesPlaceholder')} />
                            </FormField>

                            <FormField
                                label={t('admin.general.sections.profile.fields.preferredContact')}
                                name="preferredContact"
                                hint={t('admin.general.sections.profile.fields.preferredContactHint')}
                            >
                                <FormInput placeholder={t('admin.general.sections.profile.fields.preferredContactPlaceholder')} />
                            </FormField>

                            <FormField
                                label={t('admin.general.sections.profile.fields.languages')}
                                name="languages"
                                hint={t('admin.general.sections.profile.fields.languagesHint')}
                            >
                                <FormInput placeholder={t('admin.general.sections.profile.fields.languagesPlaceholder')} />
                            </FormField>

                            <FormField
                                label={t('admin.general.sections.profile.fields.industries')}
                                name="industries"
                                hint={t('admin.general.sections.profile.fields.industriesHint')}
                            >
                                <FormInput placeholder={t('admin.general.sections.profile.fields.industriesPlaceholder')} />
                            </FormField>

                            <div className="ui-formGrid">
                                <FormField label={t('admin.general.sections.profile.fields.clearanceEn')} name="clearanceEn">
                                    <FormInput placeholder={t('admin.general.sections.profile.fields.clearancePlaceholder')} />
                                </FormField>
                                <FormField label={t('admin.general.sections.profile.fields.clearanceKm')} name="clearanceKm">
                                    <FormInput />
                                </FormField>
                            </div>

                            <div className="ui-formGrid">
                                <FormField label={t('admin.general.sections.profile.fields.resumeHeadlineEn')} name="resumeHeadlineEn">
                                    <FormInput placeholder={t('admin.general.sections.profile.fields.resumeHeadlinePlaceholder')} />
                                </FormField>
                                <FormField label={t('admin.general.sections.profile.fields.resumeHeadlineKm')} name="resumeHeadlineKm">
                                    <FormInput />
                                </FormField>
                            </div>

                            <FormField
                                label={t('admin.general.sections.profile.fields.oss')}
                                name="oss"
                                hint={t('admin.general.sections.profile.fields.ossHint')}
                            >
                                <FormInput isTextArea rows={3} placeholder={t('admin.general.sections.profile.fields.ossPlaceholder')} />
                            </FormField>

                            <FormField
                                label={t('admin.general.sections.profile.fields.community')}
                                name="community"
                                hint={t('admin.general.sections.profile.fields.communityHint')}
                            >
                                <FormInput isTextArea rows={3} placeholder={t('admin.general.sections.profile.fields.communityPlaceholder')} />
                            </FormField>
                        </div>
                    </aside>
                </div>

                <div className={'ui-formFooter'}>
                    <Button type="submit" isLoading={loading} className="ui-button-block" disabled={!canEdit}>
                        <Save size={18} /> {t('admin.general.sections.profile.save')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSection;
