import React from 'react';
import { Home, Save, History } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormRow from '../../components/FormRow';
import FormInput from '../../components/FormInput';
import FormMarkdownEditor from '../../components/FormMarkdownEditor';
import FormDropzone from '../../components/FormDropzone';
import { useTranslation } from '../../../../hooks/useTranslation';

const HomeSection = ({
    homePreview,
    setHomePreview,
    loading,
    onOpenHistory,
    currentImageUrl
}) => {
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

    return (
        <div className="ui-card">
            <div className={'ui-cardHeader'}>
                <div className={'ui-icon-wrapper'}>
                    <Home size={24} />
                </div>
                <div className={'ui-title-meta'}>
                    <h3>{tr('Home Section', 'ផ្នែកដើម')}</h3>
                    <p>{tr('Configure the main hero content of your landing page.', 'កំណត់មាតិកា Hero សំខាន់សម្រាប់ទំព័រចម្បងរបស់អ្នក។')}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenHistory('home', tr('Home Section', 'ផ្នែកដើម'))}
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
                                <h4>{tr('Hero copy', 'មាតិកា Hero')}</h4>
                                <p>{tr('Set the first lines visitors see when they land on the portfolio.', 'កំណត់បន្ទាត់ដំបូងដែលអ្នកទស្សនានឹងឃើញនៅពេលចូលមក Portfolio។')}</p>
                            </div>

                            <FormRow>
                                <FormField label={tr('Greeting (EN)', 'ពាក្យស្វាគមន៍ (EN)')} name="greetingEn">
                                    <FormInput placeholder={tr('e.g. Hello, I am', 'ឧ. សួស្តី ខ្ញុំគឺ')} />
                                </FormField>
                                <FormField label={tr('Greeting (KM)', 'ពាក្យស្វាគមន៍ (KM)')} name="greetingKm">
                                    <FormInput placeholder={tr('e.g. Hello, I am', 'ឧ. សួស្តី ខ្ញុំគឺ')} />
                                </FormField>
                            </FormRow>

                            <FormRow>
                                <FormField label={tr('Full Name (EN)', 'ឈ្មោះពេញ (EN)')} name="nameEn">
                                    <FormInput placeholder={tr('Your professional name', 'ឈ្មោះវិជ្ជាជីវៈរបស់អ្នក')} />
                                </FormField>
                                <FormField label={tr('Full Name (KM)', 'ឈ្មោះពេញ (KM)')} name="nameKm">
                                    <FormInput placeholder={tr('Your professional name', 'ឈ្មោះវិជ្ជាជីវៈរបស់អ្នក')} />
                                </FormField>
                            </FormRow>

                            <FormRow>
                                <FormField label={tr('Professional Subtitle (EN)', 'ចំណងជើងវិជ្ជាជីវៈ (EN)')} name="subtitleEn">
                                    <FormInput placeholder={tr('e.g. Senior Software Engineer', 'ឧ. វិស្វករកម្មវិធីជាន់ខ្ពស់')} />
                                </FormField>
                                <FormField label={tr('Professional Subtitle (KM)', 'ចំណងជើងវិជ្ជាជីវៈ (KM)')} name="subtitleKm">
                                    <FormInput placeholder={tr('e.g. Senior Software Engineer', 'ឧ. វិស្វករកម្មវិធីជាន់ខ្ពស់')} />
                                </FormField>
                            </FormRow>

                            <FormField label={tr('Hero Description (EN)', 'ការពិពណ៌នា Hero (EN)')} name="descriptionEn">
                                <FormMarkdownEditor
                                    id="home-description-en"
                                    placeholder={tr('A brief, impactful introduction...', 'សេចក្តីណែនាំខ្លីៗដែលមានឥទ្ធិពល...')}
                                    isPreviewMode={homePreview}
                                    onTogglePreview={() => setHomePreview(!homePreview)}
                                    rows="6"
                                />
                            </FormField>

                            <FormField label={tr('Hero Description (KM)', 'ការពិពណ៌នា Hero (KM)')} name="descriptionKm">
                                <FormMarkdownEditor
                                    id="home-description-km"
                                    placeholder={tr('A brief Khmer introduction...', 'សេចក្តីណែនាំជាខ្មែរខ្លីៗ...')}
                                    isPreviewMode={homePreview}
                                    onTogglePreview={() => setHomePreview(!homePreview)}
                                    rows="6"
                                />
                            </FormField>
                        </div>

                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{tr('Primary action', 'សកម្មភាពចម្បង')}</h4>
                                <p>{tr('Guide visitors toward the next section or strongest conversion point.', 'ដឹកនាំអ្នកទស្សនាទៅកាន់ផ្នែកបន្ទាប់ ឬគោលដៅសំខាន់បំផុត។')}</p>
                            </div>

                            <FormRow>
                                <FormField label={tr('Call to Action Text (EN)', 'អត្ថបទប៊ូតុងសកម្មភាព (EN)')} name="ctaTextEn">
                                    <FormInput placeholder={tr('e.g. View My Work', 'ឧ. មើលការងាររបស់ខ្ញុំ')} />
                                </FormField>
                                <FormField label={tr('Call to Action Text (KM)', 'អត្ថបទប៊ូតុងសកម្មភាព (KM)')} name="ctaTextKm">
                                    <FormInput placeholder={tr('e.g. View My Work', 'ឧ. មើលការងាររបស់ខ្ញុំ')} />
                                </FormField>
                            </FormRow>

                            <FormRow>
                                <FormField label={tr('CTA Anchor/Link', 'តំណ CTA')} name="ctaLink">
                                    <FormInput placeholder={tr('e.g. #projects', '?. #projects')} />
                                </FormField>
                            </FormRow>
                        </div>
                    </div>

                    <aside className="ui-generalAside">
                        <div className="ui-generalAsideCard">
                            <div className="ui-generalAsideCard__head">
                                <h4>{tr('Portrait', 'រូបភាពមុខ')}</h4>
                                <p>{tr('Use a clean image that reads well in the hero and keeps attention on the headline.', 'ប្រើរូបភាពស្អាតដែលមើលច្បាស់ក្នុង Hero ហើយរក្សាឱ្យចំណាប់អារម្មណ៍នៅលើចំណងជើង។')}</p>
                            </div>

                            <FormField label={tr('Profile Portrait', 'រូបភាពប្រវត្តិរូប')} name="image">
                                <Controller
                                    name="image"
                                    render={({ field }) => (
                                        <FormDropzone
                                            hint={tr('Transparent PNG recommended', 'ណែនាំឱ្យប្រើ PNG ផ្ទៃថ្លា')}
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
                        <Save size={18} /> {tr('Save Home Changes', 'រក្សាទុកការកែប្រែផ្នែកដើម')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default HomeSection;
