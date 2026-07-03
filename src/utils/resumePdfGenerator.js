import React from 'react';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { createRoot } from 'react-dom/client';
import { getLocalizedField } from './localization';
import en from '../i18n/en.json';
import km from '../i18n/km.json';

const translations = { en, km };
const getTranslation = (key, language) => {
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
        if (result && result[k]) {
            result = result[k];
        } else {
            result = undefined;
            break;
        }
    }
    if (result) return result;
    
    // Fallback to English
    result = translations.en;
    for (const k of keys) {
        if (result && result[k]) {
            result = result[k];
        } else {
            result = undefined;
            break;
        }
    }
    return result || key;
};

const ResumePDFView = ({ data, language }) => {
    const { profile, experiences, educations, skills, projects } = data;
    const t = (key) => getTranslation(key, language);

    return (
        <div style={{
            width: '800px',
            backgroundColor: '#ffffff',
            color: '#1a1a1a',
            fontFamily: language === 'km' ? "'Kantumruy Pro', sans-serif" : "Inter, sans-serif",
            padding: '40px',
            boxSizing: 'border-box'
        }}>
            <header style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '20px', marginBottom: '20px' }}>
                <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>{getLocalizedField(profile?.name, language)}</h1>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#555' }}>{getLocalizedField(profile?.currentRole, language)}</h2>
                <div style={{ fontSize: '14px', color: '#666', display: 'flex', gap: '15px' }}>
                    <span>{getLocalizedField(profile?.location, language)}</span>
                    {profile?.email && <span>{profile.email}</span>}
                    {profile?.website && <span>{profile.website}</span>}
                </div>
            </header>

            <section style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', borderBottom: '1px solid #eaeaea', paddingBottom: '8px', marginBottom: '15px', color: '#333' }}>
                    {t('resume.summary')}
                </h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{getLocalizedField(profile?.bio, language)}</p>
            </section>

            {experiences?.length > 0 && (
                <section style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '18px', borderBottom: '1px solid #eaeaea', paddingBottom: '8px', marginBottom: '15px', color: '#333' }}>
                        {t('resume.experience')}
                    </h3>
                    {experiences.map((exp, idx) => {
                        const startStr = exp.startDate?.seconds ? new Date(exp.startDate.seconds * 1000).getFullYear().toString() : '';
                        const endStr = exp.endDate?.seconds ? new Date(exp.endDate.seconds * 1000).getFullYear().toString() : t('present');
                        return (
                            <div key={idx} style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                                    <h4 style={{ margin: 0, fontSize: '16px' }}>{getLocalizedField(exp.role, language)}</h4>
                                    <span style={{ fontSize: '14px', color: '#666' }}>
                                        {startStr} - {endStr}
                                    </span>
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>
                                    {getLocalizedField(exp.company, language)}
                                </div>
                                <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {getLocalizedField(exp.description, language)}
                                </p>
                            </div>
                        );
                    })}
                </section>
            )}

            {educations?.length > 0 && (
                <section style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '18px', borderBottom: '1px solid #eaeaea', paddingBottom: '8px', marginBottom: '15px', color: '#333' }}>
                        {t('resume.education')}
                    </h3>
                    {educations.map((edu, idx) => {
                        const startStr = edu.startDate?.seconds ? new Date(edu.startDate.seconds * 1000).getFullYear().toString() : '';
                        const endStr = edu.endDate?.seconds ? new Date(edu.endDate.seconds * 1000).getFullYear().toString() : t('present');
                        return (
                            <div key={idx} style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                                    <h4 style={{ margin: 0, fontSize: '16px' }}>{getLocalizedField(edu.degree, language)}</h4>
                                    <span style={{ fontSize: '14px', color: '#666' }}>
                                        {startStr} - {endStr}
                                    </span>
                                </div>
                                <div style={{ fontSize: '14px', color: '#555' }}>
                                    {getLocalizedField(edu.institution, language)}
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}

            {projects?.length > 0 && (
                <section style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '18px', borderBottom: '1px solid #eaeaea', paddingBottom: '8px', marginBottom: '15px', color: '#333' }}>
                        {t('resume.projects')}
                    </h3>
                    {projects.map((proj, idx) => (
                        <div key={idx} style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                                <h4 style={{ margin: 0, fontSize: '16px' }}>{getLocalizedField(proj.title, language)}</h4>
                                {proj.liveUrl && (
                                    <span style={{ fontSize: '14px', color: '#666' }}>{proj.liveUrl}</span>
                                )}
                            </div>
                            <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {getLocalizedField(proj.description, language)}
                            </p>
                        </div>
                    ))}
                </section>
            )}

            {skills?.length > 0 && (
                <section style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '18px', borderBottom: '1px solid #eaeaea', paddingBottom: '8px', marginBottom: '15px', color: '#333' }}>
                        {t('resume.skills')}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {skills.map((skill, idx) => (
                            <span key={idx} style={{ padding: '4px 10px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '14px' }}>
                                {getLocalizedField(skill.name, language)}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export const generateResumePdf = async (data, language = 'en') => {
    // 1. Create a container element
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    try {
        // 2. Render the React component into the container
        const root = createRoot(container);
        
        await new Promise((resolve) => {
            root.render(<ResumePDFView data={data} language={language} />);
            setTimeout(resolve, 500); // Give time for render and font application
        });

        // Ensure Kantumruy Pro is ready if it's being used
        if (document.fonts) {
            await document.fonts.ready;
        }

        // 3. Capture it as an image
        const dataUrl = await toJpeg(container.firstChild, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#ffffff'
        });

        // 4. Create the PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = pdfHeight;
        let position = 0;
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
        }

        // 5. Download
        const name = (getLocalizedField(data?.profile?.name, 'en') || 'Resume').replace(/\s+/g, '_');
        pdf.save(`${name}_Resume_${language.toUpperCase()}.pdf`);

        root.unmount();
    } catch (err) {
        console.error("PDF generation failed:", err);
        throw err;
    } finally {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    }
};
