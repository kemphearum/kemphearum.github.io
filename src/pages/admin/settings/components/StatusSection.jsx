import React, { useState } from 'react';
import { Save, ShieldAlert, Type } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import FormField from '../../components/FormField';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import FormSelect from '../../components/FormSelect';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLanguageValue } from '../../../../utils/localization';

const StatusSection = ({ settingsData, setSettingsData, onSave, loading }) => {
    const { t } = useTranslation();
    const [previewMode, setPreviewMode] = useState(false);
    const [activeLang, setActiveLang] = useState('en');


    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setSettingsData({ ...settingsData, [name]: value });
    };

    const handleMarkdownChange = (lang, value) => {
        setSettingsData({
            ...settingsData,
            siteStatusMessage: {
                ...(settingsData.siteStatusMessage || { en: '', km: '' }),
                [lang]: value
            }
        });
    };

    return (
        <div className="ui-card">
            <div className="ui-cardHeader">
                <h3>{t('admin.settings.sections.status.title', 'Site Status & Maintenance')}</h3>
            </div>
            
            <form onSubmit={onSave}>
                <div className="ui-form p-4">
                    <div className="ui-generalSectionGrid ui-generalSectionGrid--compact mb-6">
                        <div className="ui-generalPrimary">
                            <div className="ui-generalAsideCard">
                                <div className="ui-generalAsideCard__head">
                                    <h4>{t('admin.settings.sections.status.modeTitle', 'Operating Mode')}</h4>
                                    <p>{t('admin.settings.sections.status.modeDescription', 'Control the visibility and interaction level of the public site.')}</p>
                                </div>
                                
                                <div className="ui-formGrid">
                                    <FormField label={t('admin.settings.sections.status.fields.siteStatus', 'Site Status')} name="siteStatus">
                                        <FormSelect 
                                            name="siteStatus" 
                                            value={settingsData.siteStatus || 'live'} 
                                            onChange={handleFormChange}
                                            options={[
                                                { value: 'live', label: t('admin.settings.sections.status.options.live', 'Live (Normal)') },
                                                { value: 'testing', label: t('admin.settings.sections.status.options.testing', 'Testing Mode') },
                                                { value: 'maintenance', label: t('admin.settings.sections.status.options.maintenance', 'Maintenance Mode') }
                                            ]}
                                        />
                                    </FormField>

                                    <FormField label={t('admin.settings.sections.status.fields.siteStatusType', 'Presentation Type')} name="siteStatusType">
                                        <FormSelect 
                                            name="siteStatusType" 
                                            value={settingsData.siteStatusType || 'watermark'} 
                                            onChange={handleFormChange}
                                            options={[
                                                { value: 'watermark', label: t('admin.settings.sections.status.options.watermark', 'Subtle Watermark (Non-blocking)') },
                                                { value: 'dialog', label: t('admin.settings.sections.status.options.dialog', 'Full Screen Dialog (Blocking)') }
                                            ]}
                                        />
                                    </FormField>
                                </div>
                            </div>

                            {(settingsData.siteStatus === 'testing' || settingsData.siteStatus === 'maintenance') && (
                                <div className="ui-generalAsideCard mt-6">
                                    <div className="ui-generalAsideCard__head">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <div>
                                                <h4>{t('admin.settings.sections.status.messageTitle', 'Status Message')}</h4>
                                                <p>{t('admin.settings.sections.status.messageDescription', 'The message displayed in the dialog or watermark overlay.')}</p>
                                            </div>
                                            <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface-light)', border: '1px solid var(--divider)', borderRadius: '0.5rem', padding: '0.25rem' }}>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActiveLang('en')}
                                                    style={{
                                                        padding: '0.25rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.375rem',
                                                        transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                                                        backgroundColor: activeLang === 'en' ? 'var(--primary-color)' : 'transparent',
                                                        color: activeLang === 'en' ? '#ffffff' : 'var(--text-secondary)'
                                                    }}
                                                >
                                                    EN
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActiveLang('km')}
                                                    style={{
                                                        padding: '0.25rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.375rem',
                                                        transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                                                        backgroundColor: activeLang === 'km' ? 'var(--primary-color)' : 'transparent',
                                                        color: activeLang === 'km' ? '#ffffff' : 'var(--text-secondary)'
                                                    }}
                                                >
                                                    ខ្មែរ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {activeLang === 'en' ? (
                                        <FormField label={t('admin.settings.sections.status.fields.messageEn', 'Message (English)')} name="siteStatusMessageEn">
                                            <FormMarkdownEditor 
                                                id="site-status-msg-en"
                                                value={getLanguageValue(settingsData.siteStatusMessage, 'en', true)}
                                                onChange={(e) => handleMarkdownChange('en', e.target.value)}
                                                placeholder="e.g. We are currently performing scheduled maintenance..."
                                                isPreviewMode={previewMode}
                                                onTogglePreview={() => setPreviewMode(!previewMode)}
                                                rows="4"
                                            />
                                        </FormField>
                                    ) : (
                                        <FormField label={t('admin.settings.sections.status.fields.messageKm', 'Message (Khmer)')} name="siteStatusMessageKm">
                                            <FormMarkdownEditor 
                                                id="site-status-msg-km"
                                                value={getLanguageValue(settingsData.siteStatusMessage, 'km', false)}
                                                onChange={(e) => handleMarkdownChange('km', e.target.value)}
                                                placeholder="ឧទាហរណ៍៖ យើងកំពុងធ្វើការថែទាំប្រព័ន្ធ..."
                                                isPreviewMode={previewMode}
                                                onTogglePreview={() => setPreviewMode(!previewMode)}
                                                rows="4"
                                            />
                                        </FormField>
                                    )}
                                </div>
                            )}

                            {settingsData.siteStatus === 'testing' && settingsData.siteStatusType === 'dialog' && (
                                <div className="ui-generalAsideCard mt-6">
                                    <div className="ui-generalAsideCard__head">
                                        <h4>{t('admin.settings.sections.status.testingConfigTitle', 'Testing Overlay Settings')}</h4>
                                        <p>{t('admin.settings.sections.status.testingConfigDesc', 'Configure the progress bar, end date, and feedback link for the full-screen beta testing page.')}</p>
                                    </div>
                                    
                                    <div className="ui-formGrid">
                                        <FormField label={t('admin.settings.sections.status.fields.testingProgress', 'Testing Progress (%)')} name="testingProgress">
                                            <input 
                                                type="number" 
                                                name="testingProgress" 
                                                value={settingsData.testingProgress !== undefined ? settingsData.testingProgress : 85} 
                                                onChange={handleFormChange}
                                                min="0"
                                                max="100"
                                                className="ui-input"
                                            />
                                        </FormField>

                                        <FormField label={t('admin.settings.sections.status.fields.testingEndDate', 'Expected End Date')} name="testingEndDate">
                                            <input 
                                                type="date" 
                                                name="testingEndDate" 
                                                value={settingsData.testingEndDate || ''} 
                                                onChange={handleFormChange}
                                                className="ui-input"
                                            />
                                        </FormField>
                                    </div>

                                    <FormField label={t('admin.settings.sections.status.fields.testingFeedbackUrl', 'Feedback / Bug Report URL')} name="testingFeedbackUrl">
                                        <input 
                                            type="url" 
                                            name="testingFeedbackUrl" 
                                            value={settingsData.testingFeedbackUrl || ''} 
                                            onChange={handleFormChange}
                                            placeholder="https://forms.gle/... or mailto:..."
                                            className="ui-input"
                                        />
                                    </FormField>
                                </div>
                            )}

                            {settingsData.siteStatus === 'maintenance' && settingsData.siteStatusType === 'dialog' && (
                                <div className="ui-generalAsideCard mt-6">
                                    <div className="ui-generalAsideCard__head">
                                        <h4>{t('admin.settings.sections.status.maintenanceConfigTitle', 'Maintenance Overlay Settings')}</h4>
                                        <p>{t('admin.settings.sections.status.maintenanceConfigDesc', 'Configure progress, end date, and an optional contact link for the full-screen maintenance page.')}</p>
                                    </div>
                                    
                                    <div className="ui-formGrid">
                                        <FormField label={t('admin.settings.sections.status.fields.maintenanceProgress', 'Maintenance Progress (%)')} name="maintenanceProgress">
                                            <input 
                                                type="number" 
                                                name="maintenanceProgress" 
                                                value={settingsData.maintenanceProgress !== undefined ? settingsData.maintenanceProgress : 0} 
                                                onChange={handleFormChange}
                                                min="0"
                                                max="100"
                                                className="ui-input"
                                            />
                                        </FormField>

                                        <FormField label={t('admin.settings.sections.status.fields.maintenanceEndDate', 'Expected Return Date')} name="maintenanceEndDate">
                                            <input 
                                                type="date" 
                                                name="maintenanceEndDate" 
                                                value={settingsData.maintenanceEndDate || ''} 
                                                onChange={handleFormChange}
                                                className="ui-input"
                                            />
                                        </FormField>
                                    </div>

                                    <FormField label={t('admin.settings.sections.status.fields.maintenanceContactUrl', 'Contact / Support URL')} name="maintenanceContactUrl">
                                        <input 
                                            type="url" 
                                            name="maintenanceContactUrl" 
                                            value={settingsData.maintenanceContactUrl || ''} 
                                            onChange={handleFormChange}
                                            placeholder="https://twitter.com/... or mailto:..."
                                            className="ui-input"
                                        />
                                    </FormField>
                                </div>
                            )}
                        </div>

                        <aside className="ui-generalAside">
                            <div className="ui-generalAsideCard">
                                <div className="ui-generalAsideCard__head">
                                    <h4><ShieldAlert size={16} className="inline mr-2"/> {t('admin.settings.sections.status.behaviorTitle', 'Behavior Notes')}</h4>
                                    <ul className="text-sm mt-2 text-foreground/80 space-y-2 list-disc pl-4">
                                        <li><strong>{t('admin.settings.sections.status.behaviorList.live')}</strong> {t('admin.settings.sections.status.behaviorList.liveDesc')}</li>
                                        <li><strong>{t('admin.settings.sections.status.behaviorList.testing')}</strong> {t('admin.settings.sections.status.behaviorList.testingDesc')}</li>
                                        <li><strong>{t('admin.settings.sections.status.behaviorList.maintenance')}</strong> {t('admin.settings.sections.status.behaviorList.maintenanceDesc')}</li>
                                        <li><strong>{t('admin.settings.sections.status.behaviorList.admin')}</strong> {t('admin.settings.sections.status.behaviorList.adminDesc')}</li>
                                    </ul>
                                </div>
                            </div>
                        </aside>
                    </div>

                    <div className="flex gap-4">
                        <Button type="submit" isLoading={loading}>
                            <Save size={16} /> {t('admin.common.save', 'Save Changes')}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default StatusSection;
