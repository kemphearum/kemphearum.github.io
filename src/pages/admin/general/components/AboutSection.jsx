import React from 'react';
import { User, Save, History } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import { useTranslation } from '../../../../hooks/useTranslation';

const AboutSection = ({
    aboutPreview,
    setAboutPreview,
    loading,
    onOpenHistory
}) => {
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const { watch } = useFormContext();
    const skills = watch('skills') || '';

    return (
        <div className="ui-card">
            <div className={'ui-cardHeader'}>
                <div className={'ui-icon-wrapper'}>
                    <User size={24} />
                </div>
                <div className={'ui-title-meta'}>
                    <h3>{tr('About Section', 'ផ្នែកអំពី')}</h3>
                    <p>{tr('Update your biography, professional summary, and key skills.', 'ធ្វើបច្ចុប្បន្នភាពជីវប្រវត្តិ សេចក្តីសង្ខេបវិជ្ជាជីវៈ និងជំនាញសំខាន់ៗ។')}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('about', tr('About Section', 'ផ្នែកអំពី'))}
                    className={'ui-history-btn'}
                >
                    <History size={16} /> <span>{tr('History', 'ប្រវត្តិ')}</span>
                </Button>
            </div>
            <div className={'ui-form'}>
                <div className="ui-generalSectionGrid">
                    <div className="ui-generalPrimary">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{tr('Biography', 'ជីវប្រវត្តិ')}</h4>
                                <p>{tr('Write the narrative that introduces your background, experience, and point of view.', 'សរសេរអត្ថបទណែនាំពីផ្ទៃខាងក្រោយ បទពិសោធន៍ និងទស្សនៈរបស់អ្នក។')}</p>
                            </div>

                            <FormField
                                label={tr('Biography (EN)', 'ជីវប្រវត្តិ (EN)')}
                                name="bioEn"
                                validation={{ required: tr('English bio is required', 'ត្រូវការជីវប្រវត្តិជាភាសាអង់គ្លេស') }}
                            >
                                <FormMarkdownEditor
                                    id="about-bio-en"
                                    placeholder={tr('Write your professional bio...', 'សរសេរជីវប្រវត្តិវិជ្ជាជីវៈរបស់អ្នក...')}
                                    isPreviewMode={aboutPreview}
                                    onTogglePreview={() => setAboutPreview(!aboutPreview)}
                                    rows="8"
                                />
                            </FormField>

                            <FormField
                                label={tr('Biography (KM)', 'ជីវប្រវត្តិ (KM)')}
                                name="bioKm"
                            >
                                <FormMarkdownEditor
                                    id="about-bio-km"
                                    placeholder={tr('Write your Khmer biography...', 'សរសេរជីវប្រវត្តិជាភាសាខ្មែរ...')}
                                    isPreviewMode={aboutPreview}
                                    onTogglePreview={() => setAboutPreview(!aboutPreview)}
                                    rows="8"
                                />
                            </FormField>
                        </div>
                    </div>

                    <aside className="ui-generalAside">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{tr('Skills snapshot', 'សង្ខេបជំនាញ')}</h4>
                                <p>{tr('List the capabilities you want visitors to notice first.', 'រាយបញ្ជីសមត្ថភាពដែលអ្នកចង់ឱ្យអ្នកទស្សនាឃើញមុនគេ។')}</p>
                            </div>

                            <FormField
                                label={tr('Professional Skills', 'ជំនាញវិជ្ជាជីវៈ')}
                                name="skills"
                            >
                                <FormInput
                                    placeholder={tr('React, Python, Firebase, ...', 'React, Python, Firebase, ...')}
                                    hint={tr('comma separated', 'បំបែកដោយសញ្ញាក្បៀស')}
                                />
                            </FormField>

                            {skills && (
                                <div className={'ui-skill-preview'}>
                                    {skills.split(',').map((s, i) => s.trim() && (
                                        <span key={`skill-${s.trim()}-${i}`} className={'ui-tech-tag'}>{s.trim()}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>

                <div className={'ui-formFooter'}>
                    <Button type="submit" isLoading={loading} className="ui-button-block">
                        <Save size={18} /> {tr('Save Changes', 'រក្សាទុកការកែប្រែ')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AboutSection;
