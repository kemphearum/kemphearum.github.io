import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImagePlus, Save, Upload } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import FormField from '../../components/FormField';
import FormInput from '../../components/FormInput';
import FormRow from '../../components/FormRow';
import ProjectService from '../../../../services/ProjectService';
import BlogService from '../../../../services/BlogService';
import tabStyles from '../SettingsTab.module.scss';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLanguageValue, getLocalizedField, isLocalizedObject } from '../../../../utils/localization';
import { buildBrowserTitle } from '../../../../utils/browserTitle';

const LOCALIZED_IDENTITY_FIELDS = [
    'title',
    'tagline',
    'logoHighlight',
    'logoText',
    'footerText',
    'projectFilters',
    'blogFilters'
];

const normalizeTaxonomyToken = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const parseTaxonomyList = (rawValue) => {
    const source = String(rawValue || '')
        .replace(/\n/g, ',')
        .replace(/;/g, ',');

    const seen = new Set();
    const result = [];

    source
        .split(',')
        .map(normalizeTaxonomyToken)
        .filter(Boolean)
        .forEach((token) => {
            const key = token.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            result.push(token);
        });

    return result;
};

const hasToken = (list, token) => {
    const key = normalizeTaxonomyToken(token).toLowerCase();
    if (!key) return false;
    return list.some((item) => item.toLowerCase() === key);
};

const combineUnique = (...lists) => {
    const seen = new Set();
    const result = [];

    lists.flat().forEach((item) => {
        const normalized = normalizeTaxonomyToken(item);
        if (!normalized) return;
        const key = normalized.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        result.push(normalized);
    });

    return result;
};

const IdentitySection = ({
    settingsData,
    setSettingsData,
    settingsFavicon,
    setSettingsFavicon,
    previewBase64,
    setPreviewBase64,
    onSave,
    loading
}) => {
    const { language, t } = useTranslation();
    const getInputText = (value, fallback = '') => {
        if (isLocalizedObject(value)) {
            return getLanguageValue(value, language, false);
        }
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return fallback;
    };

    const getPreviewText = (value, fallback = '') => {
        if (isLocalizedObject(value)) {
            const localized = getLocalizedField(value, language);
            return localized || fallback;
        }
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return fallback;
    };

    const updateField = (key, value) => {
        const current = settingsData[key];
        const isLocalizedField = LOCALIZED_IDENTITY_FIELDS.includes(key);

        if (isLocalizedObject(current) || isLocalizedField) {
            const currentObj = isLocalizedObject(current) 
                ? current 
                : { en: current || '', km: current || '' }; 
            
            setSettingsData({
                ...settingsData,
                [key]: {
                    ...currentObj,
                    [language]: value
                }
            });
            return;
        }
        setSettingsData({ ...settingsData, [key]: value });
    };

    const titleText = getInputText(settingsData.title);
    const taglineText = getInputText(settingsData.tagline);
    const logoHighlightText = getInputText(settingsData.logoHighlight);
    const logoTextText = getInputText(settingsData.logoText);
    const footerTextText = getInputText(settingsData.footerText);
    const projectFiltersText = getInputText(settingsData.projectFilters);
    const blogFiltersText = getInputText(settingsData.blogFilters);
    const faviconText = getPreviewText(settingsData.favicon);
    const previewLogoHighlightText = getPreviewText(settingsData.logoHighlight);
    const previewLogoTextText = getPreviewText(settingsData.logoText);
    const previewTaglineText = getPreviewText(settingsData.tagline);
    const previewFooterText = getPreviewText(settingsData.footerText);
    const browserTitlePreview = buildBrowserTitle(settingsData, language);
    const hasFavicon = Boolean(settingsFavicon || faviconText || previewBase64);
    const [projectManualInput, setProjectManualInput] = useState('');
    const [blogManualInput, setBlogManualInput] = useState('');

    const {
        data: taxonomySuggestions = { project: [], blog: [] },
        isFetching: taxonomyLoading,
        isError: taxonomyError
    } = useQuery({
        queryKey: ['settings', 'taxonomy', 'suggestions'],
        queryFn: async () => {
            const [project, blog] = await Promise.all([
                ProjectService.getCategorySuggestions(),
                BlogService.getTagSuggestions()
            ]);
            return { project, blog };
        },
        staleTime: 300000,
        gcTime: 900000,
        refetchOnWindowFocus: false
    });

    const projectSelectedFilters = useMemo(
        () => parseTaxonomyList(projectFiltersText),
        [projectFiltersText]
    );
    const blogSelectedFilters = useMemo(
        () => parseTaxonomyList(blogFiltersText),
        [blogFiltersText]
    );

    const projectSuggestionOptions = useMemo(
        () => combineUnique(taxonomySuggestions.project, projectSelectedFilters),
        [taxonomySuggestions.project, projectSelectedFilters]
    );
    const blogSuggestionOptions = useMemo(
        () => combineUnique(taxonomySuggestions.blog, blogSelectedFilters),
        [taxonomySuggestions.blog, blogSelectedFilters]
    );

    const setTaxonomyField = (fieldKey, values) => {
        updateField(fieldKey, values.join(', '));
    };

    const toggleTaxonomy = (fieldKey, currentValues, token) => {
        const normalized = normalizeTaxonomyToken(token);
        if (!normalized) return;

        const nextValues = hasToken(currentValues, normalized)
            ? currentValues.filter((item) => item.toLowerCase() !== normalized.toLowerCase())
            : [...currentValues, normalized];

        setTaxonomyField(fieldKey, nextValues);
    };

    const addManualTaxonomy = (fieldKey, currentValues, manualValue, resetManualInput) => {
        const parsedManual = parseTaxonomyList(manualValue);
        if (parsedManual.length === 0) return;

        const nextValues = combineUnique(currentValues, parsedManual);
        setTaxonomyField(fieldKey, nextValues);
        resetManualInput('');
    };

    return (
        <form onSubmit={onSave} className={tabStyles.tabContentFadeIn}>
            <div className="ui-card">
                <div className={tabStyles.surfaceHeader}>
                    <div className={tabStyles.surfaceCopy}>
                        <span className={tabStyles.surfaceEyebrow}>{t('admin.settings.sections.identity.eyebrow')}</span>
                        <h3 className={tabStyles.surfaceHeadline}>{t('admin.settings.sections.identity.title')}</h3>
                        <p className={tabStyles.surfaceLead}>{t('admin.settings.sections.identity.description')}</p>
                    </div>
                    <div className={tabStyles.surfaceMeta}>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{hasFavicon ? t('admin.settings.sections.identity.ready') : t('admin.settings.sections.identity.pending')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.identity.favicon')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{t('admin.settings.sections.identity.faviconHint')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{logoHighlightText || t('admin.settings.sections.identity.fields.logoPrefixPlaceholder')} {logoTextText || t('admin.settings.sections.identity.fields.logoSuffixPlaceholder')}</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.identity.brandName')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{t('admin.settings.sections.identity.brandNameHint')}</span>
                        </div>
                        <div className={tabStyles.surfaceMetaCard}>
                            <span className={tabStyles.surfaceMetaValue}>{[projectFiltersText, blogFiltersText].filter(Boolean).length}/2</span>
                            <span className={tabStyles.surfaceMetaLabel}>{t('admin.settings.sections.identity.filterSets')}</span>
                            <span className={tabStyles.surfaceMetaHint}>{t('admin.settings.sections.identity.filterSetsHint')}</span>
                        </div>
                    </div>
                </div>

                <div className={tabStyles.settingsSectionGrid}>
                    <div className={tabStyles.settingsPrimaryColumn}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.identity.brandBasics.title')}</span>
                                    <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.identity.brandBasics.subtitle')}</h4>
                                    <p className={tabStyles.panelDescription}>{t('admin.settings.sections.identity.brandBasics.description')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{t('admin.settings.sections.identity.brandBasics.badge')}</span>
                            </div>

                            <div className={tabStyles.formGrid}>
                                <FormField label={t('admin.settings.sections.identity.fields.pageTitle')} columns={1}>
                                    <FormInput
                                        placeholder={t('admin.settings.sections.identity.fields.pageTitlePlaceholder')}
                                        value={titleText || ''}
                                        onChange={(e) => updateField('title', e.target.value)}
                                    />
                                </FormField>

                                <FormField label={t('admin.settings.sections.identity.fields.siteTagline')} columns={1}>
                                    <FormInput
                                        placeholder={t('admin.settings.sections.identity.fields.siteTaglinePlaceholder')}
                                        value={taglineText || ''}
                                        onChange={(e) => updateField('tagline', e.target.value)}
                                    />
                                </FormField>
                            </div>

                            <FormRow>
                                <FormField label={t('admin.settings.sections.identity.fields.logoPrefix')} columns={1}>
                                    <FormInput
                                        placeholder={t('admin.settings.sections.identity.fields.logoPrefixPlaceholder')}
                                        value={logoHighlightText || ''}
                                        onChange={(e) => updateField('logoHighlight', e.target.value)}
                                    />
                                </FormField>

                                <FormField label={t('admin.settings.sections.identity.fields.logoSuffix')} columns={1}>
                                    <FormInput
                                        placeholder={t('admin.settings.sections.identity.fields.logoSuffixPlaceholder')}
                                        value={logoTextText || ''}
                                        onChange={(e) => updateField('logoText', e.target.value)}
                                    />
                                </FormField>
                            </FormRow>

                            <FormField label={t('admin.settings.sections.identity.fields.footerCopyright')} columns={1}>
                                    <FormInput
                                        placeholder={t('admin.settings.sections.identity.fields.footerCopyrightPlaceholder')}
                                        value={footerTextText || ''}
                                        onChange={(e) => updateField('footerText', e.target.value)}
                                    />
                            </FormField>
                        </section>

                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.identity.taxonomy.title')}</span>
                                    <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.identity.taxonomy.subtitle')}</h4>
                                    <p className={tabStyles.panelDescription}>{t('admin.settings.sections.identity.taxonomy.description')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{t('admin.settings.sections.identity.taxonomy.badge')}</span>
                            </div>

                            <div className={tabStyles.taxonomyGrid}>
                                <div className={tabStyles.taxonomyCard}>
                                    <div className={tabStyles.taxonomyCardHeader}>
                                        <div>
                                            <h5 className={tabStyles.taxonomyCardTitle}>{t('admin.settings.sections.identity.taxonomy.projectTitle')}</h5>
                                            <p className={tabStyles.taxonomyCardHint}>{t('admin.settings.sections.identity.taxonomy.projectHint')}</p>
                                        </div>
                                        <span className={tabStyles.taxonomyCount}>{projectSelectedFilters.length}</span>
                                    </div>

                                    <div className={tabStyles.taxonomyChipWrap}>
                                        {taxonomyLoading ? (
                                            <span className={tabStyles.taxonomyState}>{t('admin.settings.sections.identity.taxonomy.loading')}</span>
                                        ) : taxonomyError ? (
                                            <span className={tabStyles.taxonomyState}>{t('admin.settings.sections.identity.taxonomy.error')}</span>
                                        ) : projectSuggestionOptions.length > 0 ? (
                                            projectSuggestionOptions.map((token) => {
                                                const selected = hasToken(projectSelectedFilters, token);
                                                return (
                                                    <button
                                                        key={`project-${token}`}
                                                        type="button"
                                                        onClick={() => toggleTaxonomy('projectFilters', projectSelectedFilters, token)}
                                                        className={`${tabStyles.taxonomyChip} ${selected ? tabStyles.taxonomyChipActive : ''}`}
                                                    >
                                                        {token}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <span className={tabStyles.taxonomyState}>{t('admin.settings.sections.identity.taxonomy.empty')}</span>
                                        )}
                                    </div>

                                    <div className={tabStyles.taxonomyManualRow}>
                                        <FormInput
                                            placeholder={t('admin.settings.sections.identity.taxonomy.typeCustom')}
                                            value={projectManualInput}
                                            onChange={(e) => setProjectManualInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key !== 'Enter') return;
                                                e.preventDefault();
                                                addManualTaxonomy('projectFilters', projectSelectedFilters, projectManualInput, setProjectManualInput);
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => addManualTaxonomy('projectFilters', projectSelectedFilters, projectManualInput, setProjectManualInput)}
                                            disabled={!projectManualInput.trim()}
                                        >
                                            {t('admin.settings.sections.identity.taxonomy.add')}
                                        </Button>
                                    </div>

                                    <FormField label={t('admin.settings.sections.identity.taxonomy.manualLabel')} hint={t('admin.settings.sections.identity.taxonomy.manualFallback')} columns={1}>
                                        <FormInput
                                            placeholder={t('admin.settings.sections.identity.taxonomy.manualPlaceholder')}
                                            value={projectFiltersText || ''}
                                            onChange={(e) => updateField('projectFilters', e.target.value)}
                                        />
                                    </FormField>
                                </div>

                                <div className={tabStyles.taxonomyCard}>
                                    <div className={tabStyles.taxonomyCardHeader}>
                                        <div>
                                            <h5 className={tabStyles.taxonomyCardTitle}>{t('admin.settings.sections.identity.taxonomy.blogTitle')}</h5>
                                            <p className={tabStyles.taxonomyCardHint}>{t('admin.settings.sections.identity.taxonomy.blogHint')}</p>
                                        </div>
                                        <span className={tabStyles.taxonomyCount}>{blogSelectedFilters.length}</span>
                                    </div>

                                    <div className={tabStyles.taxonomyChipWrap}>
                                        {taxonomyLoading ? (
                                            <span className={tabStyles.taxonomyState}>{t('admin.settings.sections.identity.taxonomy.loading')}</span>
                                        ) : taxonomyError ? (
                                            <span className={tabStyles.taxonomyState}>{t('admin.settings.sections.identity.taxonomy.error')}</span>
                                        ) : blogSuggestionOptions.length > 0 ? (
                                            blogSuggestionOptions.map((token) => {
                                                const selected = hasToken(blogSelectedFilters, token);
                                                return (
                                                    <button
                                                        key={`blog-${token}`}
                                                        type="button"
                                                        onClick={() => toggleTaxonomy('blogFilters', blogSelectedFilters, token)}
                                                        className={`${tabStyles.taxonomyChip} ${selected ? tabStyles.taxonomyChipActive : ''}`}
                                                    >
                                                        {token}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <span className={tabStyles.taxonomyState}>{t('admin.settings.sections.identity.taxonomy.empty')}</span>
                                        )}
                                    </div>

                                    <div className={tabStyles.taxonomyManualRow}>
                                        <FormInput
                                            placeholder={t('admin.settings.sections.identity.taxonomy.typeCustom')}
                                            value={blogManualInput}
                                            onChange={(e) => setBlogManualInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key !== 'Enter') return;
                                                e.preventDefault();
                                                addManualTaxonomy('blogFilters', blogSelectedFilters, blogManualInput, setBlogManualInput);
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => addManualTaxonomy('blogFilters', blogSelectedFilters, blogManualInput, setBlogManualInput)}
                                            disabled={!blogManualInput.trim()}
                                        >
                                            {t('admin.settings.sections.identity.taxonomy.add')}
                                        </Button>
                                    </div>

                                    <FormField label={t('admin.settings.sections.identity.taxonomy.manualLabel')} hint={t('admin.settings.sections.identity.taxonomy.manualFallback')} columns={1}>
                                        <FormInput
                                            placeholder={t('admin.settings.sections.identity.taxonomy.blogPlaceholder')}
                                            value={blogFiltersText || ''}
                                            onChange={(e) => updateField('blogFilters', e.target.value)}
                                        />
                                    </FormField>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className={tabStyles.settingsAsideColumn}>
                        <section className={tabStyles.settingsPanel}>
                            <div className={tabStyles.panelHeader}>
                                <div className={tabStyles.panelTitleGroup}>
                                    <span className={tabStyles.panelEyebrow}>{t('admin.settings.sections.identity.browserAsset.title')}</span>
                                    <h4 className={tabStyles.panelTitle}>{t('admin.settings.sections.identity.browserAsset.subtitle')}</h4>
                                    <p className={tabStyles.panelDescription}>{t('admin.settings.sections.identity.browserAsset.description')}</p>
                                </div>
                                <span className={tabStyles.panelBadge}>{t('admin.settings.sections.identity.browserAsset.badge')}</span>
                            </div>

                            <FormField label={t('admin.settings.sections.identity.browserAsset.label')} columns={1}>
                                <div className={tabStyles.fileInputWrapper}>
                                    {hasFavicon && (
                                        <div className={tabStyles.faviconPreview}>
                                            {(previewBase64 || faviconText) ? (
                                                <img src={previewBase64 || faviconText} alt={t('admin.settings.sections.identity.browserAsset.preview')} />
                                            ) : null}
                                        </div>
                                    )}
                                    <div className={tabStyles.fileDropzone}>
                                        <input
                                            type="file"
                                            accept="image/x-icon,image/png,image/svg+xml"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                setSettingsFavicon(file);
                                                if (!file) setPreviewBase64('');
                                            }}
                                        />
                                        <div className={tabStyles.fileDropzoneContent}>
                                            <Upload size={16} />
                                            <div>
                                                <span className={tabStyles.fileDropzoneTitle}>
                                                    {settingsFavicon ? settingsFavicon.name : (faviconText ? t('admin.settings.sections.identity.browserAsset.replace') : t('admin.settings.sections.identity.browserAsset.upload'))}
                                                </span>
                                                <span className={tabStyles.fileDropzoneHint}>{t('admin.settings.sections.identity.browserAsset.hint')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </FormField>
                        </section>

                        <section className={tabStyles.identityPreviewCard}>
                            <span className={tabStyles.identityPreviewEyebrow}>{t('admin.settings.sections.identity.preview.title')}</span>
                            <div className={tabStyles.browserTabPreview}>
                                <span className={tabStyles.browserTabPreviewLabel}>{t('admin.settings.sections.identity.preview.browserTab')}</span>
                                <div className={tabStyles.browserTabMock}>
                                    <div className={tabStyles.browserTabChrome}>
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                    <div className={tabStyles.browserTabPill}>
                                        <div className={tabStyles.browserTabIcon}>
                                            {(previewBase64 || faviconText) ? (
                                                <img src={previewBase64 || faviconText} alt={t('admin.settings.sections.identity.preview.currentFavicon')} />
                                            ) : (
                                                <ImagePlus size={14} />
                                            )}
                                        </div>
                                        <span className={tabStyles.browserTabText}>{browserTitlePreview}</span>
                                    </div>
                                </div>
                                <p className={tabStyles.browserTabHint}>{t('admin.settings.sections.identity.preview.browserTabHint')}</p>
                            </div>
                            <div className={tabStyles.identityPreviewHeader}>
                                <div className={tabStyles.faviconPreview}>
                                    {(previewBase64 || faviconText) ? (
                                        <img src={previewBase64 || faviconText} alt={t('admin.settings.sections.identity.preview.currentFavicon')} />
                                    ) : (
                                        <ImagePlus size={20} />
                                    )}
                                </div>
                                <div>
                                    <div className={tabStyles.identityPreviewLogo}>
                                        {previewLogoHighlightText || t('admin.settings.sections.identity.fields.logoPrefixPlaceholder')} <span>{previewLogoTextText || t('admin.settings.sections.identity.fields.logoSuffixPlaceholder')}</span>
                                    </div>
                                    <div className={tabStyles.identityPreviewTitle}>{browserTitlePreview}</div>
                                </div>
                            </div>
                            <p className={tabStyles.identityPreviewTagline}>
                                {previewTaglineText || t('admin.settings.sections.identity.fields.siteTaglinePlaceholder')}
                            </p>
                            <div className={tabStyles.identityPreviewMetaList}>
                                <div className={tabStyles.identityPreviewMeta}>
                                    <span>{t('admin.settings.sections.identity.preview.footerCopy')}</span>
                                    <strong>{previewFooterText || t('admin.settings.sections.identity.fields.footerCopyrightPlaceholder')}</strong>
                                </div>
                                <div className={tabStyles.identityPreviewMeta}>
                                    <span>{t('admin.settings.sections.identity.preview.filterReadiness')}</span>
                                    <strong>
                                        {[projectFiltersText, blogFiltersText].filter(Boolean).length === 2
                                            ? t('admin.settings.sections.identity.preview.filtersConfigured')
                                            : t('admin.settings.sections.identity.preview.filtersPending')}
                                    </strong>
                                </div>
                            </div>
                            <ul className={tabStyles.identityChecklist}>
                                {t('admin.settings.sections.identity.checklist', { returnObjects: true }).map((item, id) => (
                                    <li key={id}>{item}</li>
                                ))}
                            </ul>
                        </section>
                    </aside>
                </div>

                <div className={tabStyles.formFooter}>
                    <Button
                        type="submit"
                        isLoading={loading}
                        className={tabStyles.saveButton}
                    >
                        <Save size={18} /> {t('admin.settings.sections.identity.save')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default IdentitySection;
