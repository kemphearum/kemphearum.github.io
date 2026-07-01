import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, MessageSquare, FileText, Clock, Save, Upload, Trash, UserPlus, Copy, ExternalLink, ImageDown, Phone, Share2, Link, Printer } from 'lucide-react';
import { Tabs, Button } from '@/shared/components/ui';
import Form from '../components/Form';
import FormField from '../components/FormField';
import FormInput from '../components/FormInput';
import FormMarkdownEditor from '../components/FormMarkdownEditor';
import { useTranslation } from '../../../hooks/useTranslation';
import CommunicationService from '../../../services/CommunicationService';
import ResumeService from '../../../services/ResumeService';
import { ACTIONS, MODULES } from '../../../utils/permissions';
import { getLanguageValue, getLocalizedField } from '../../../utils/localization';
import { useNotifications } from '../../../context/NotificationContextValue';
import tabStyles from '../general/GeneralTab.module.scss';
import ImageProcessingService from '../../../services/ImageProcessingService';
import ContentService from '../../../services/ContentService';
import SettingsService from '../../../services/SettingsService';
import DigitalCard from '../../card/components/DigitalCard';
import { toPng, toJpeg } from 'html-to-image';
import { generateVCard, downloadVCard } from '../../card/utils/VCardGenerator';

const CommunicationTab = ({ isActionAllowed }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { record: showNotification } = useNotifications();
    const [activeSection, setActiveSection] = useState('contact');
    const exportRef = useRef(null);
    const [contactPreview, setContactPreview] = useState(false);

    const canEditCommunication = isActionAllowed(ACTIONS.EDIT, MODULES.COMMUNICATION);
    const canPublishCommunication = isActionAllowed(ACTIONS.PUBLISH, MODULES.COMMUNICATION);
    const canUploadResume = isActionAllowed(ACTIONS.UPLOAD, 'resume');
    const canPublishResume = isActionAllowed(ACTIONS.PUBLISH, 'resume');
    const canDeleteResume = isActionAllowed(ACTIONS.DELETE, 'resume');

    const { data: commData = {}, isLoading: commLoading } = useQuery({
        queryKey: ['contact'],
        queryFn: () => CommunicationService.get()
    });

    const { data: resumeData = {}, isLoading: resumeLoading } = useQuery({
        queryKey: ['resume'],
        queryFn: () => ResumeService.get()
    });
    
    const { data: profileData = {} } = useQuery({
        queryKey: ['content', 'profileInfo'],
        queryFn: () => ContentService.fetchSection('profileInfo')
    });

    const { data: homeData = {} } = useQuery({
        queryKey: ['content', 'home'],
        queryFn: () => ContentService.fetchSection('home')
    });

    const { data: settingsData = {} } = useQuery({
        queryKey: ['settings'],
        queryFn: () => SettingsService.fetchGlobalSettings()
    });

    const { language } = useTranslation();
    const site = settingsData?.site || {};
    const portfolioUrl = site.canonicalUrl || window.location.origin;
    const cardUrl = `${portfolioUrl}/card`;
    
    const cardName = homeData?.name ? getLocalizedField(homeData.name, language) : (profileData?.name ? getLocalizedField(profileData.name, language) : '');
    const cardTitle = profileData?.currentRole ? getLocalizedField(profileData.currentRole, language) : '';
    const cardCompany = homeData?.subtitle ? getLocalizedField(homeData.subtitle, language) : (profileData?.company ? getLocalizedField(profileData.company, language) : '');
    const cardPhotoUrl = homeData?.profileImageUrl || profileData?.profileImageUrl || site.ogImageUrl || '';
    const cardLocation = profileData?.location ? getLocalizedField(profileData.location, language) : '';

    const handleDownloadVCard = () => {
        const vCardData = generateVCard(profileData || {}, commData, portfolioUrl);
        downloadVCard(vCardData, `${cardName.replace(/\s+/g, '_') || 'contact'}.vcf`);
    };

    const handleDownloadImage = async (format = 'png') => {
        if (!exportRef.current) return;
        try {
            const dataUrl = format === 'png'
                ? await toPng(exportRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 })
                : await toJpeg(exportRef.current, { backgroundColor: '#ffffff', quality: 0.95, pixelRatio: 3 });
            
            const link = document.createElement('a');
            link.download = `namecard_${cardName.replace(/\s+/g, '_') || 'contact'}.${format}`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
            showNotification(t('admin.common.error', 'Error'), 'error');
        }
    };

    const updateCommMutation = useMutation({
        mutationFn: (data) => CommunicationService.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['contact']);
            queryClient.invalidateQueries(['content', 'contact']);
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
        if (!confirm(t('admin.communication.resume.deleteConfirm'))) return;
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
                        <span className={tabStyles.triggerBody}><strong>{t('admin.communication.tabs.contact')}</strong></span>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="telegram" className={tabStyles.subTabTrigger}>
                        <span className={tabStyles.triggerIcon}><MessageSquare size={18} /></span>
                        <span className={tabStyles.triggerBody}><strong>{t('admin.communication.tabs.telegram')}</strong></span>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="resume" className={tabStyles.subTabTrigger}>
                        <span className={tabStyles.triggerIcon}><FileText size={18} /></span>
                        <span className={tabStyles.triggerBody}><strong>{t('admin.communication.tabs.resume')}</strong></span>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="namecard" className={tabStyles.subTabTrigger}>
                        <span className={tabStyles.triggerIcon}><UserPlus size={18} /></span>
                        <span className={tabStyles.triggerBody}><strong>{t('admin.communication.tabs.namecard', 'Name Card')}</strong></span>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="availability" className={tabStyles.subTabTrigger}>
                        <span className={tabStyles.triggerIcon}><Clock size={18} /></span>
                        <span className={tabStyles.triggerBody}><strong>{t('admin.communication.tabs.availability')}</strong></span>
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="contact" className={tabStyles.tabPanel}>
                    <div className="ui-card">
                        <div className="ui-cardHeader">
                            <h3>{t('admin.communication.contact.title')}</h3>
                        </div>
                        <Form onSubmit={handleSaveContact} defaultValues={{
                            ...commData,
                            introTextEn: loc(commData.introText, 'en'),
                            introTextKm: loc(commData.introText, 'km')
                        }}>
                            <div className="ui-form p-4">
                                <div className="ui-generalSectionGrid ui-generalSectionGrid--compact mb-6">
                                    <div className="ui-generalPrimary">
                                        <div className="ui-generalAsideCard">
                                            <div className="ui-generalAsideCard__head">
                                                <h4>{t('admin.general.sections.contact.intro.title', 'Contact intro')}</h4>
                                                <p>{t('admin.general.sections.contact.intro.description', 'Set the tone before visitors reach the form so expectations feel clear and welcoming.')}</p>
                                            </div>

                                            <FormField 
                                                label={t('admin.general.sections.contact.fields.introEn', 'Contact Intro (EN) *')} 
                                                name="introTextEn"
                                            >
                                                <FormMarkdownEditor 
                                                    id="contact-intro-en"
                                                    placeholder={t('admin.general.sections.contact.fields.introPlaceholderEn', "Although I'm not currently looking for any new opportunities...")}
                                                    isPreviewMode={contactPreview}
                                                    onTogglePreview={() => setContactPreview(!contactPreview)}
                                                    rows="4"
                                                />
                                            </FormField>
                                            <FormField 
                                                label={t('admin.general.sections.contact.fields.introKm', 'Contact Intro (KM)')} 
                                                name="introTextKm"
                                            >
                                                <FormMarkdownEditor 
                                                    id="contact-intro-km"
                                                    placeholder={t('admin.general.sections.contact.fields.introPlaceholderKm', "សរសេរការណែនាំខ្លីៗសម្រាប់ការទាក់ទង...")}
                                                    isPreviewMode={contactPreview}
                                                    onTogglePreview={() => setContactPreview(!contactPreview)}
                                                    rows="4"
                                                />
                                            </FormField>
                                        </div>
                                    </div>

                                    <aside className="ui-generalAside">
                                        <div className="ui-generalAsideCard">
                                            <div className="ui-generalAsideCard__head">
                                                <h4>{t('admin.general.sections.contact.bestPractice.title', 'Best practice')}</h4>
                                                <p>{t('admin.general.sections.contact.bestPractice.description', 'Keep this copy short. It should invite contact, explain what people can reach out about, and reduce friction.')}</p>
                                            </div>
                                        </div>
                                    </aside>
                                </div>

                                <div className="ui-generalAsideCard mb-6">
                                    <div className="ui-generalAsideCard__head">
                                        <h4>{t('admin.communication.contact.socialTitle')}</h4>
                                        <p>{t('admin.communication.contact.socialDesc')}</p>
                                    </div>
                                    <div className="ui-formGrid">
                                        <FormField label={t('admin.communication.contact.fields.email')} name="email"><FormInput /></FormField>
                                        <FormField label={t('admin.communication.contact.fields.secondaryEmail')} name="secondaryEmail"><FormInput /></FormField>
                                    </div>
                                <div className="ui-formGrid">
                                    <FormField label={t('admin.communication.contact.fields.phone')} name="phone"><FormInput /></FormField>
                                    <FormField label={t('admin.communication.contact.fields.whatsapp')} name="whatsapp"><FormInput /></FormField>
                                </div>
                                <div className="ui-formGrid">
                                    <FormField label={t('admin.communication.contact.fields.linkedin')} name="linkedin"><FormInput /></FormField>
                                    <FormField label={t('admin.communication.contact.fields.github')} name="github"><FormInput /></FormField>
                                </div>
                                <div className="ui-formGrid">
                                    <FormField label={t('admin.communication.contact.fields.twitter')} name="twitter"><FormInput /></FormField>
                                    <FormField label={t('admin.communication.contact.fields.website')} name="website"><FormInput /></FormField>
                                </div>
                                </div>

                                <Button type="submit" disabled={!canEditCommunication} isLoading={updateCommMutation.isPending}>
                                    <Save size={16}/> {t('admin.communication.contact.save')}
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Tabs.Content>

                <Tabs.Content value="telegram" className={tabStyles.tabPanel}>
                    <div className="ui-card">
                        <div className="ui-cardHeader">
                            <h3>{t('admin.communication.telegram.title')}</h3>
                        </div>
                        <Form onSubmit={handleSaveTelegram} defaultValues={{
                            telegramUsername: commData.telegramUsername || '',
                            telegramUrl: commData.telegramUrl || '',
                            telegramEnabled: commData.telegramEnabled ? 'true' : 'false',
                            qrCodeImageFile: null
                        }}>
                            <div className="ui-form p-4">
                                <FormField label={t('admin.communication.telegram.fields.enabled')} name="telegramEnabled">
                                    <select disabled={!canPublishCommunication}>
                                        <option value="true">{t('admin.common.enabled')}</option>
                                        <option value="false">{t('admin.common.disabled')}</option>
                                    </select>
                                </FormField>
                                <div className="ui-formGrid">
                                    <FormField label={t('admin.communication.telegram.fields.username')} name="telegramUsername"><FormInput /></FormField>
                                    <FormField label={t('admin.communication.telegram.fields.url')} name="telegramUrl"><FormInput /></FormField>
                                </div>
                                <FormField label={t('admin.communication.telegram.fields.qr')} name="qrCodeImageFile" hint={t('admin.communication.telegram.fields.qrHint')}>
                                    <FormInput type="file" accept="image/*" />
                                </FormField>
                                {commData.telegramQrCodeImage && (
                                    <div style={{marginBottom:'1rem'}}>
                                        <img src={commData.telegramQrCodeImage} alt="QR" width="100"/>
                                    </div>
                                )}
                                <Button type="submit" disabled={!canEditCommunication} isLoading={updateCommMutation.isPending}>
                                    <Save size={16}/> {t('admin.communication.telegram.save')}
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Tabs.Content>

                <Tabs.Content value="namecard" className={tabStyles.tabPanel}>
                    <div className="ui-card">
                        <div className="ui-cardHeader">
                            <h3>{t('admin.communication.tabs.namecard', 'Digital Name Card')}</h3>
                        </div>
                        <div className="ui-form p-4">
                            <p className="mb-4">
                                {t('admin.communication.namecard.desc', 'Your Digital Name Card is automatically generated from your Profile and Contact info.')}
                            </p>
                            <div className="ui-generalSectionGrid mb-6">
                                <div className="ui-generalPrimary">
                                    <div className="ui-generalAsideCard">
                                        <div className="ui-generalAsideCard__head">
                                            <h4>{t('admin.communication.namecard.preview', 'Live Preview & QR')}</h4>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            {/* Hidden clone for export */}
                                            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                                                <div ref={exportRef} style={{ width: '1050px', height: '600px', display: 'flex' }}>
                                                    <DigitalCard 
                                                        name={cardName}
                                                        title={cardTitle}
                                                        company={cardCompany}
                                                        photoUrl={cardPhotoUrl}
                                                        location={cardLocation}
                                                        social={commData}
                                                        portfolioUrl={portfolioUrl}
                                                        cardUrl={cardUrl}
                                                        onDownloadVCard={() => {}}
                                                        onShare={() => {}}
                                                        exportMode={true}
                                                    />
                                                </div>
                                            </div>

                                            <div className="w-full flex flex-col items-center mt-8 mb-12">
                                                <div className="w-full flex justify-center" style={{ position: 'relative' }}>
                                                    <div style={{ width: '630px', height: '360px', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '1050px', height: '600px', transform: 'scale(0.6)', transformOrigin: 'top left' }}>
                                                            <DigitalCard 
                                                                name={cardName}
                                                                title={cardTitle}
                                                                company={cardCompany}
                                                                photoUrl={cardPhotoUrl}
                                                                location={cardLocation}
                                                                social={commData}
                                                                portfolioUrl={portfolioUrl}
                                                                cardUrl={cardUrl}
                                                                onDownloadVCard={handleDownloadVCard}
                                                                onShare={() => {}}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', marginTop: '32px', width: '100%', maxWidth: '630px' }}>
                                                    <button type="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.color='#0f172a'} onMouseLeave={e => e.currentTarget.style.color='#64748b'}>
                                                        <Link size={18} />
                                                        <span>{t('card.actions.share', 'Share Card')}</span>
                                                    </button>
                                                    <button type="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.color='#0f172a'} onMouseLeave={e => e.currentTarget.style.color='#64748b'}>
                                                        <Printer size={18} />
                                                        <span>{t('card.print', 'Print Card')}</span>
                                                    </button>
                                                    <button type="button" onClick={() => handleDownloadImage('png')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.color='#0f172a'} onMouseLeave={e => e.currentTarget.style.color='#64748b'}>
                                                        <ImageDown size={18} />
                                                        <span>{t('card.saveImage', 'Save as Image')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tabs.Content>

                <Tabs.Content value="resume" className={tabStyles.tabPanel}>
                    <div className="ui-card">
                        <div className="ui-cardHeader">
                            <h3>{t('admin.communication.resume.title')}</h3>
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
                                <FormField label={t('admin.communication.resume.fields.publicDownload')} name="publicDownloadEnabled">
                                    <select disabled={!canPublishResume}>
                                        <option value="true">{t('admin.common.enabled')}</option>
                                        <option value="false">{t('admin.common.disabled')}</option>
                                    </select>
                                </FormField>
                                <FormField label={t('admin.communication.resume.fields.printRoute')} name="printRouteEnabled">
                                    <select disabled={!canPublishResume}>
                                        <option value="true">{t('admin.common.enabled')}</option>
                                        <option value="false">{t('admin.common.disabled')}</option>
                                    </select>
                                </FormField>
                                <div className="ui-formGrid">
                                    <FormField label={t('admin.communication.resume.fields.titleEn')} name="titleEn"><FormInput /></FormField>
                                    <FormField label={t('admin.communication.resume.fields.titleKm')} name="titleKm"><FormInput /></FormField>
                                </div>
                                <div className="ui-formGrid">
                                    <FormField label={t('admin.communication.resume.fields.version')} name="version"><FormInput placeholder={t('admin.communication.resume.fields.versionPlaceholder')} /></FormField>
                                </div>
                                <FormField label={t('admin.communication.resume.fields.upload')} name="resumeFile" hint={t('admin.communication.resume.fields.uploadHint')}>
                                    <FormInput type="file" accept="application/pdf" disabled={!canUploadResume} />
                                </FormField>
                                {resumeData.pdfBase64 && (
                                    <div style={{marginBottom:'1rem', display:'flex', gap:'1rem'}}>
                                        <a href={resumeData.pdfBase64} download="Resume.pdf">
                                            <Button type="button" variant="outline"><FileText size={16}/> {t('admin.communication.resume.preview')}</Button>
                                        </a>
                                        {canDeleteResume && (
                                            <Button type="button" variant="ghost" onClick={handleDeleteResume} className="text-red">
                                                <Trash size={16}/> {t('admin.communication.resume.delete')}
                                            </Button>
                                        )}
                                    </div>
                                )}
                                <Button type="submit" disabled={!canUploadResume && !canPublishResume} isLoading={updateResumeMutation.isPending}>
                                    <Save size={16}/> {t('admin.communication.resume.save')}
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Tabs.Content>

                <Tabs.Content value="availability" className={tabStyles.tabPanel}>
                    <div className="ui-card">
                        <div className="ui-cardHeader">
                            <h3>{t('admin.communication.availability.title')}</h3>
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
                                <FormField label={t('admin.communication.availability.fields.status')} name="availabilityStatus">
                                    <select disabled={!canPublishCommunication}>
                                        <option value="">{t('admin.communication.availability.fields.statusSelect')}</option>
                                        <option value="open">{t('admin.communication.availability.fields.statusOpen')}</option>
                                        <option value="freelance">{t('admin.communication.availability.fields.statusFreelance')}</option>
                                        <option value="limited">{t('admin.communication.availability.fields.statusLimited')}</option>
                                        <option value="busy">{t('admin.communication.availability.fields.statusBusy')}</option>
                                    </select>
                                </FormField>
                                <div className="ui-formGrid">
                                    <FormField label={t('admin.communication.availability.fields.messageEn')} name="availabilityMessageEn"><FormInput disabled={!canPublishCommunication} /></FormField>
                                    <FormField label={t('admin.communication.availability.fields.messageKm')} name="availabilityMessageKm"><FormInput disabled={!canPublishCommunication} /></FormField>
                                </div>
                                <div className="ui-formGrid">
                                    <FormField label={t('admin.communication.availability.fields.responseEn')} name="responseTimeEn"><FormInput /></FormField>
                                    <FormField label={t('admin.communication.availability.fields.responseKm')} name="responseTimeKm"><FormInput /></FormField>
                                </div>
                                <div className="ui-formGrid">
                                    <FormField label={t('admin.communication.availability.fields.timeZone')} name="timeZone"><FormInput /></FormField>
                                    <FormField label={t('admin.communication.availability.fields.preferredContact')} name="preferredContact" hint={t('admin.communication.availability.fields.preferredContactHint')}><FormInput /></FormField>
                                </div>
                                <Button type="submit" disabled={!canEditCommunication} isLoading={updateCommMutation.isPending}>
                                    <Save size={16}/> {t('admin.communication.availability.save')}
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
