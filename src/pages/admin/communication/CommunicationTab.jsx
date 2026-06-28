import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, MessageSquare, FileText, Clock, Save, Upload, Trash } from 'lucide-react';
import { Tabs, Button } from '@/shared/components/ui';
import Form from '../components/Form';
import FormField from '../components/FormField';
import FormInput from '../components/FormInput';
import FormMarkdownEditor from '../components/FormMarkdownEditor';
import { useTranslation } from '../../../hooks/useTranslation';
import CommunicationService from '../../../services/CommunicationService';
import ResumeService from '../../../services/ResumeService';
import { ACTIONS, MODULES } from '../../../utils/permissions';
import { getLanguageValue } from '../../../utils/localization';
import { useNotifications } from '../../../context/NotificationContextValue';
import tabStyles from '../general/GeneralTab.module.scss';
import ImageProcessingService from '../../../services/ImageProcessingService';

const CommunicationTab = ({ isActionAllowed }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { record: showNotification } = useNotifications();
    const [activeSection, setActiveSection] = useState('contact');

    const canEditCommunication = isActionAllowed(ACTIONS.EDIT, MODULES.COMMUNICATION);
    const canPublishCommunication = isActionAllowed(ACTIONS.PUBLISH, MODULES.COMMUNICATION);
    const canUploadResume = isActionAllowed(ACTIONS.UPLOAD, 'resume');
    const canPublishResume = isActionAllowed(ACTIONS.PUBLISH, 'resume');
    const canDeleteResume = isActionAllowed(ACTIONS.DELETE, 'resume');

    const { data: commData = {}, isLoading: commLoading } = useQuery({
        queryKey: ['communication'],
        queryFn: () => CommunicationService.get()
    });

    const { data: resumeData = {}, isLoading: resumeLoading } = useQuery({
        queryKey: ['resume'],
        queryFn: () => ResumeService.get()
    });

    const updateCommMutation = useMutation({
        mutationFn: (data) => CommunicationService.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['communication']);
            queryClient.invalidateQueries(['content', 'communication']);
            showNotification(t('admin.common.saved', 'Saved successfully'), 'success');
        },
        onError: (err) => showNotification(err.message, 'error')
    });

    const updateResumeMutation = useMutation({
        mutationFn: (data) => ResumeService.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['resume']);
            showNotification(t('admin.common.saved', 'Saved successfully'), 'success');
        },
        onError: (err) => showNotification(err.message, 'error')
    });

    const handleSaveContact = (data) => {
        console.log("Saving Contact Data:", data);
        updateCommMutation.mutate({
            email: data.email,
            secondaryEmail: data.secondaryEmail,
            phone: data.phone,
            whatsapp: data.whatsapp,
            linkedin: data.linkedin,
            github: data.github,
            facebook: data.facebook,
            twitter: data.twitter,
            website: data.website,
            introText: { en: data.introTextEn, km: data.introTextKm }
        });
    };

    const handleSaveTelegram = async (data) => {
        let qrImage = commData.telegramQrCodeImage;
        if (data.qrCodeImageFile) {
            qrImage = await ImageProcessingService.compress(data.qrCodeImageFile);
        }
        updateCommMutation.mutate({
            telegramUsername: data.telegramUsername,
            telegramUrl: data.telegramUrl,
            telegramEnabled: data.telegramEnabled === 'true',
            telegramQrCodeImage: qrImage
        });
    };

    const handleSaveAvailability = (data) => {
        updateCommMutation.mutate({
            availabilityStatus: data.availabilityStatus,
            availabilityMessage: { en: data.availabilityMessageEn, km: data.availabilityMessageKm },
            preferredContact: (data.preferredContact || '').split(',').map(s => s.trim()).filter(Boolean),
            responseTime: { en: data.responseTimeEn, km: data.responseTimeKm },
            officeHours: { en: data.officeHoursEn, km: data.officeHoursKm },
            timeZone: data.timeZone
        });
    };

    const handleSaveResume = async (data) => {
        let pdfBase64 = resumeData.pdfBase64;
        if (data.resumeFile && data.resumeFile instanceof File) {
            // Read PDF as base64
            pdfBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(data.resumeFile);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }
        
        updateResumeMutation.mutate({
            pdfBase64,
            version: data.version,
            title: { en: data.titleEn, km: data.titleKm },
            description: { en: data.descriptionEn, km: data.descriptionKm },
            publicDownloadEnabled: data.publicDownloadEnabled === 'true',
            printRouteEnabled: data.printRouteEnabled === 'true'
        });
    };

    const handleDeleteResume = () => {
        if (!confirm('Are you sure you want to delete the uploaded resume PDF?')) return;
        updateResumeMutation.mutate({ pdfBase64: '' });
    };

    if (commLoading || resumeLoading) return <div className="p-4">Loading...</div>;

    const loc = (field, lang) => getLanguageValue(field, lang, lang === 'en');

    return (
        <div className={tabStyles.tabContentFadeIn}>
            <Tabs value={activeSection} onValueChange={setActiveSection} className={tabStyles.subTabNav}>
                <Tabs.List className={tabStyles.subtabsList}>
                    <Tabs.Trigger value="contact" className={tabStyles.subTabTrigger}>
                        <span className={tabStyles.triggerIcon}><Mail size={18} /></span>
                        <span className={tabStyles.triggerBody}><strong>Contact Info</strong></span>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="telegram" className={tabStyles.subTabTrigger}>
                        <span className={tabStyles.triggerIcon}><MessageSquare size={18} /></span>
                        <span className={tabStyles.triggerBody}><strong>Telegram</strong></span>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="resume" className={tabStyles.subTabTrigger}>
                        <span className={tabStyles.triggerIcon}><FileText size={18} /></span>
                        <span className={tabStyles.triggerBody}><strong>Resume</strong></span>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="availability" className={tabStyles.subTabTrigger}>
                        <span className={tabStyles.triggerIcon}><Clock size={18} /></span>
                        <span className={tabStyles.triggerBody}><strong>Availability</strong></span>
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="contact" className={tabStyles.tabPanel}>
                    <div className="ui-card">
                        <div className="ui-cardHeader">
                            <h3>Contact Information</h3>
                        </div>
                        <Form onSubmit={handleSaveContact} defaultValues={{
                            ...commData,
                            introTextEn: loc(commData.introText, 'en'),
                            introTextKm: loc(commData.introText, 'km')
                        }}>
                            <div className="ui-form p-4">
                                <div className="ui-formGrid">
                                    <FormField label="Professional Email" name="email"><FormInput /></FormField>
                                    <FormField label="Secondary Email" name="secondaryEmail"><FormInput /></FormField>
                                </div>
                                <div className="ui-formGrid">
                                    <FormField label="Phone" name="phone"><FormInput /></FormField>
                                    <FormField label="WhatsApp" name="whatsapp"><FormInput /></FormField>
                                </div>
                                <div className="ui-formGrid">
                                    <FormField label="LinkedIn URL" name="linkedin"><FormInput /></FormField>
                                    <FormField label="GitHub URL" name="github"><FormInput /></FormField>
                                </div>
                                <div className="ui-formGrid">
                                    <FormField label="X (Twitter) URL" name="twitter"><FormInput /></FormField>
                                    <FormField label="Personal Website" name="website"><FormInput /></FormField>
                                </div>
                                <div className="ui-formGrid" style={{gridTemplateColumns: '1fr'}}>
                                    <FormField label="Intro Text (EN)" name="introTextEn">
                                        <FormMarkdownEditor placeholder="Write a short intro for the contact section..." />
                                    </FormField>
                                    <FormField label="Intro Text (KM)" name="introTextKm">
                                        <FormMarkdownEditor placeholder="សរសេរការណែនាំខ្លីៗសម្រាប់ការទាក់ទង..." />
                                    </FormField>
                                </div>
                                <Button type="submit" disabled={!canEditCommunication} isLoading={updateCommMutation.isPending}>
                                    <Save size={16}/> Save Contact Info
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Tabs.Content>

                <Tabs.Content value="telegram" className={tabStyles.tabPanel}>
                    <div className="ui-card">
                        <div className="ui-cardHeader">
                            <h3>Telegram Management</h3>
                        </div>
                        <Form onSubmit={handleSaveTelegram} defaultValues={{
                            telegramUsername: commData.telegramUsername || '',
                            telegramUrl: commData.telegramUrl || '',
                            telegramEnabled: commData.telegramEnabled ? 'true' : 'false',
                            qrCodeImageFile: null
                        }}>
                            <div className="ui-form p-4">
                                <FormField label="Enable Telegram on Public Site" name="telegramEnabled">
                                    <select disabled={!canPublishCommunication}>
                                        <option value="true">Enabled</option>
                                        <option value="false">Disabled</option>
                                    </select>
                                </FormField>
                                <div className="ui-formGrid">
                                    <FormField label="Telegram Username" name="telegramUsername"><FormInput /></FormField>
                                    <FormField label="Deep Link URL" name="telegramUrl"><FormInput /></FormField>
                                </div>
                                <FormField label="QR Code Override (Optional)" name="qrCodeImageFile" hint="Auto-generated if empty.">
                                    <FormInput type="file" accept="image/*" />
                                </FormField>
                                {commData.telegramQrCodeImage && (
                                    <div style={{marginBottom:'1rem'}}>
                                        <img src={commData.telegramQrCodeImage} alt="QR" width="100"/>
                                    </div>
                                )}
                                <Button type="submit" disabled={!canEditCommunication} isLoading={updateCommMutation.isPending}>
                                    <Save size={16}/> Save Telegram Info
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Tabs.Content>

                <Tabs.Content value="resume" className={tabStyles.tabPanel}>
                    <div className="ui-card">
                        <div className="ui-cardHeader">
                            <h3>Resume Management</h3>
                        </div>
                        <Form onSubmit={handleSaveResume} defaultValues={{
                            titleEn: loc(resumeData.title, 'en'),
                            titleKm: loc(resumeData.title, 'km'),
                            descriptionEn: loc(resumeData.description, 'en'),
                            descriptionKm: loc(resumeData.description, 'km'),
                            version: resumeData.version || '',
                            publicDownloadEnabled: resumeData.publicDownloadEnabled ? 'true' : 'false',
                            printRouteEnabled: resumeData.printRouteEnabled ? 'true' : 'false',
                            resumeFile: null
                        }}>
                            <div className="ui-form p-4">
                                <FormField label="Enable Public Download" name="publicDownloadEnabled">
                                    <select disabled={!canPublishResume}>
                                        <option value="true">Enabled</option>
                                        <option value="false">Disabled</option>
                                    </select>
                                </FormField>
                                <FormField label="Enable Print Route" name="printRouteEnabled">
                                    <select disabled={!canPublishResume}>
                                        <option value="true">Enabled</option>
                                        <option value="false">Disabled</option>
                                    </select>
                                </FormField>
                                <div className="ui-formGrid">
                                    <FormField label="Title (EN)" name="titleEn"><FormInput /></FormField>
                                    <FormField label="Title (KM)" name="titleKm"><FormInput /></FormField>
                                </div>
                                <div className="ui-formGrid">
                                    <FormField label="Version" name="version"><FormInput placeholder="e.g. v2026.1" /></FormField>
                                </div>
                                <FormField label="Upload PDF Resume" name="resumeFile" hint="Max 700KB for base64 storage.">
                                    <FormInput type="file" accept="application/pdf" disabled={!canUploadResume} />
                                </FormField>
                                {resumeData.pdfBase64 && (
                                    <div style={{marginBottom:'1rem', display:'flex', gap:'1rem'}}>
                                        <a href={resumeData.pdfBase64} download="Resume.pdf">
                                            <Button type="button" variant="outline"><FileText size={16}/> Preview/Download Current</Button>
                                        </a>
                                        {canDeleteResume && (
                                            <Button type="button" variant="ghost" onClick={handleDeleteResume} className="text-red">
                                                <Trash size={16}/> Delete PDF
                                            </Button>
                                        )}
                                    </div>
                                )}
                                <Button type="submit" disabled={!canUploadResume && !canPublishResume} isLoading={updateResumeMutation.isPending}>
                                    <Save size={16}/> Save Resume
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Tabs.Content>

                <Tabs.Content value="availability" className={tabStyles.tabPanel}>
                    <div className="ui-card">
                        <div className="ui-cardHeader">
                            <h3>Availability</h3>
                        </div>
                        <Form onSubmit={handleSaveAvailability} defaultValues={{
                            availabilityStatus: commData.availabilityStatus || '',
                            availabilityMessageEn: loc(commData.availabilityMessage, 'en'),
                            availabilityMessageKm: loc(commData.availabilityMessage, 'km'),
                            responseTimeEn: loc(commData.responseTime, 'en'),
                            responseTimeKm: loc(commData.responseTime, 'km'),
                            officeHoursEn: loc(commData.officeHours, 'en'),
                            officeHoursKm: loc(commData.officeHours, 'km'),
                            timeZone: commData.timeZone || '',
                            preferredContact: (commData.preferredContact || []).join(', ')
                        }}>
                            <div className="ui-form p-4">
                                <FormField label="Availability Status" name="availabilityStatus">
                                    <select disabled={!canPublishCommunication}>
                                        <option value="">Select...</option>
                                        <option value="open">Available for Work</option>
                                        <option value="freelance">Freelance/Consulting</option>
                                        <option value="limited">Limited Availability</option>
                                        <option value="busy">Busy / Not Available</option>
                                    </select>
                                </FormField>
                                <div className="ui-formGrid">
                                    <FormField label="Custom Message (EN)" name="availabilityMessageEn"><FormInput disabled={!canPublishCommunication} /></FormField>
                                    <FormField label="Custom Message (KM)" name="availabilityMessageKm"><FormInput disabled={!canPublishCommunication} /></FormField>
                                </div>
                                <div className="ui-formGrid">
                                    <FormField label="Response Time (EN)" name="responseTimeEn"><FormInput /></FormField>
                                    <FormField label="Response Time (KM)" name="responseTimeKm"><FormInput /></FormField>
                                </div>
                                <div className="ui-formGrid">
                                    <FormField label="Time Zone" name="timeZone"><FormInput /></FormField>
                                    <FormField label="Preferred Contact Method" name="preferredContact" hint="Comma separated (e.g. Telegram, Email)"><FormInput /></FormField>
                                </div>
                                <Button type="submit" disabled={!canEditCommunication} isLoading={updateCommMutation.isPending}>
                                    <Save size={16}/> Save Availability
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Tabs.Content>
            </Tabs>
        </div>
    );
};

export default CommunicationTab;
