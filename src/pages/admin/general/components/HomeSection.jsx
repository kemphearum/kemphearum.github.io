import React from 'react';
import { Home, Save, History } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormRow from '../../components/FormRow';
import FormInput from '../../components/FormInput';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import FormDropzone from '../../components/FormDropzone';

const HomeSection = ({ 
    homePreview, 
    setHomePreview, 
    loading, 
    onOpenHistory,
    currentImageUrl
}) => {
    return (
        <div className="ui-card">
            <div className={'ui-cardHeader'}>
                <div className={'ui-icon-wrapper'}>
                    <Home size={24} />
                </div>
                <div className={'ui-title-meta'}>
                    <h3>Home Section</h3>
                    <p>Configure the main hero content of your landing page.</p>
                </div>
                <Button 
                    type="button" 
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('home', 'Home Section')} 
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
                                <h4>Hero copy</h4>
                                <p>Set the first lines visitors see when they land on the portfolio.</p>
                            </div>

                            <FormRow>
                                <FormField label="Greeting (EN)" name="greetingEn">
                                    <FormInput placeholder="e.g. Hello, I am" />
                                </FormField>
                                <FormField label="Greeting (KM)" name="greetingKm">
                                    <FormInput placeholder="ឧ. សួស្តី ខ្ញុំឈ្មោះ..." />
                                </FormField>
                            </FormRow>

                            <FormRow>
                                <FormField label="Full Name (EN)" name="nameEn">
                                    <FormInput placeholder="Your professional name" />
                                </FormField>
                                <FormField label="Full Name (KM)" name="nameKm">
                                    <FormInput placeholder="ឈ្មោះអាជីពរបស់អ្នក" />
                                </FormField>
                            </FormRow>

                            <FormRow>
                                <FormField label="Professional Subtitle (EN)" name="subtitleEn">
                                    <FormInput placeholder="e.g. Senior Software Engineer" />
                                </FormField>
                                <FormField label="Professional Subtitle (KM)" name="subtitleKm">
                                    <FormInput placeholder="ឧ. វិស្វករសូហ្វវែរជាន់ខ្ពស់" />
                                </FormField>
                            </FormRow>

                            <FormField label="Hero Description (EN)" name="descriptionEn">
                                <FormMarkdownEditor
                                    id="home-description-en"
                                    placeholder="A brief, impactful introduction..."
                                    isPreviewMode={homePreview}
                                    onTogglePreview={() => setHomePreview(!homePreview)}
                                    rows="6"
                                />
                            </FormField>

                            <FormField label="Hero Description (KM)" name="descriptionKm">
                                <FormMarkdownEditor
                                    id="home-description-km"
                                    placeholder="សេចក្តីណែនាំខ្លីៗជាភាសាខ្មែរ..."
                                    isPreviewMode={homePreview}
                                    onTogglePreview={() => setHomePreview(!homePreview)}
                                    rows="6"
                                />
                            </FormField>
                        </div>

                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>Primary action</h4>
                                <p>Guide visitors toward the next section or strongest conversion point.</p>
                            </div>

                            <FormRow>
                                <FormField label="Call to Action Text (EN)" name="ctaTextEn">
                                    <FormInput placeholder="e.g. View My Work" />
                                </FormField>
                                <FormField label="Call to Action Text (KM)" name="ctaTextKm">
                                    <FormInput placeholder="ឧ. មើលការងាររបស់ខ្ញុំ" />
                                </FormField>
                            </FormRow>

                            <FormRow>
                                <FormField label="CTA Anchor/Link" name="ctaLink">
                                    <FormInput placeholder="e.g. #projects" />
                                </FormField>
                            </FormRow>
                        </div>
                    </div>

                    <aside className="ui-generalAside">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>Portrait</h4>
                                <p>Use a clean image that reads well in the hero and keeps attention on the headline.</p>
                            </div>

                            <FormField label="Profile Portrait" name="image">
                                <Controller
                                    name="image"
                                    render={({ field }) => (
                                        <FormDropzone
                                            hint="Transparent PNG recommended"
                                            file={field.value}
                                            onFileChange={field.onChange}
                                            currentImageUrl={currentImageUrl}
                                            circular={true}
                                            aspectRatio="1/1"
                                        />
                                    )}
                                />
                            </FormField>
                        </div>
                    </aside>
                </div>

                <div className={'ui-formFooter'}>
                    <Button type="submit" isLoading={loading} className="ui-button-block">
                        <Save size={18} /> Save Home Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default HomeSection;
