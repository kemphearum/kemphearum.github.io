import React from 'react';
import { User, Save, History } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';

const AboutSection = ({ 
    aboutPreview, 
    setAboutPreview, 
    loading,
    onOpenHistory 
}) => {
    const { watch } = useFormContext();
    const skills = watch('skills') || '';

    return (
        <div className="ui-card">
            <div className={'ui-cardHeader'}>
                <div className={'ui-icon-wrapper'}>
                    <User size={24} />
                </div>
                <div className={'ui-title-meta'}>
                    <h3>About Section</h3>
                    <p>Update your biography, professional summary, and key skills.</p>
                </div>
                <Button 
                    type="button" 
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('about', 'About Section')} 
                    className={'ui-history-btn'}
                >
                    <History size={16} /> <span>History</span>
                </Button>
            </div>
            <div className={'ui-form'}>
                <div className="ui-generalSectionGrid">
                    <div className="ui-generalPrimary">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>Biography</h4>
                                <p>Write the narrative that introduces your background, experience, and point of view.</p>
                            </div>

                            <FormField
                                label="Biography"
                                name="bio"
                                validation={{ required: 'Bio is required' }}
                            >
                                <FormMarkdownEditor
                                    id="about-bio"
                                    placeholder="Write your professional bio..."
                                    isPreviewMode={aboutPreview}
                                    onTogglePreview={() => setAboutPreview(!aboutPreview)}
                                    rows="12"
                                />
                            </FormField>
                        </div>
                    </div>

                    <aside className="ui-generalAside">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>Skills snapshot</h4>
                                <p>List the capabilities you want visitors to notice first.</p>
                            </div>

                            <FormField
                                label="Professional Skills"
                                name="skills"
                            >
                                <FormInput
                                    placeholder="React, Python, Firebase, ..."
                                    hint="comma separated"
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
                        <Save size={18} /> Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AboutSection;
