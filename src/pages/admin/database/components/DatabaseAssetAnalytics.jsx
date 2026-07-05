import React, { useState } from 'react';
import { Image, Play, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { db } from '../../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import DatabaseService from '../../../../services/DatabaseService';
import { useTranslation } from '../../../../hooks/useTranslation';

const ASSET_REGEX = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif|webp|svg|mp4|webm)/gi;

const DatabaseAssetAnalytics = ({ showToast }) => {
    const { t } = useTranslation();
    const tm = (key, params = {}) => t(`admin.database.${key}`, params);

    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setResults(null);
        try {
            const collectionsToScan = DatabaseService.HEALTH_COLLECTIONS.filter(c => !['auditLogs', 'dailyUsage', 'visits', 'messages'].includes(c));
            const urlMap = new Map();
            let totalDocsScanned = 0;

            for (const col of collectionsToScan) {
                const snap = await getDocs(collection(db, col));
                let i = 0;
                for (const doc of snap.docs) {
                    if (i++ % 50 === 0) await new Promise(r => setTimeout(r, 0)); // Throttle
                    
                    totalDocsScanned++;
                    const dataStr = JSON.stringify(doc.data());
                    const matches = dataStr.match(ASSET_REGEX) || [];
                    
                    const uniqueMatches = [...new Set(matches)];
                    
                    uniqueMatches.forEach(url => {
                        if (!urlMap.has(url)) {
                            urlMap.set(url, []);
                        }
                        urlMap.get(url).push(`${col}/${doc.id}`);
                    });
                }
            }

            let totalAssets = urlMap.size;
            let duplicates = 0;
            let duplicatedUrls = [];
            let allUrls = [];

            urlMap.forEach((refs, url) => {
                allUrls.push({ url, refs, broken: false });
                if (refs.length > 1) {
                    duplicates++;
                    duplicatedUrls.push({ url, refs, broken: false });
                }
            });

            setResults({
                totalAssets,
                duplicates,
                duplicatedUrls: duplicatedUrls.sort((a, b) => b.refs.length - a.refs.length),
                allUrls: allUrls.sort((a, b) => b.refs.length - a.refs.length),
                totalDocsScanned
            });
            showToast(tm('toasts.assetAnalysisComplete'), 'success');
        } catch (error) {
            console.error(error);
            showToast(tm('toasts.failedToAnalyzeAssets'), 'error');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="ui-actions-section">
            <div className="ui-flex-between ui-mb-medium">
                <h4 className="ui-flex-center-gap-small ui-m-0">
                    <Image size={18} className="ui-text-accent" /> {tm('ui.assetDataAnalytics')}
                </h4>
                <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? <RefreshCw size={16} className="ui-spin" /> : <Play size={16} />} 
                    {analyzing ? tm('ui.scanning') : tm('ui.runScan')}
                </Button>
            </div>
            
            {results && (
                <div className="ui-card ui-p-medium">
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="ui-statCard" style={{ flex: 1, cursor: 'default' }}>
                            <div className="ui-statInfo">
                                <div className="ui-statValue">{results.totalAssets}</div>
                                <div className="ui-statLabel">{tm('ui.uniqueAssets')}</div>
                                <div className="ui-statDescription">{tm('ui.foundInDocs', { count: results.totalDocsScanned })}</div>
                            </div>
                        </div>
                        <div className="ui-statCard" style={{ flex: 1, cursor: 'default' }}>
                            <div className="ui-statInfo">
                                <div className="ui-statValue">{results.duplicates}</div>
                                <div className="ui-statLabel">{tm('ui.duplicatedAssets')}</div>
                                <div className="ui-statDescription">{tm('ui.crossReferencedUrls')}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <button 
                            onClick={() => setActiveTab('summary')}
                            style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'summary' ? '2px solid var(--primary-color)' : '2px solid transparent', cursor: 'pointer', color: activeTab === 'summary' ? 'var(--primary-color)' : 'var(--text-muted)' }}
                        >
                            {tm('ui.allAssets')}
                        </button>
                        <button 
                            onClick={() => setActiveTab('duplicates')}
                            style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'duplicates' ? '2px solid var(--primary-color)' : '2px solid transparent', cursor: 'pointer', color: activeTab === 'duplicates' ? 'var(--primary-color)' : 'var(--text-muted)' }}
                        >
                            {tm('ui.duplicates')}
                        </button>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {(activeTab === 'summary' ? results.allUrls : results.duplicatedUrls).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '1rem', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                <div className="ui-bg-subtle" style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                    <img 
                                        src={item.url} 
                                        alt="" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }} 
                                    />
                                    <div className="ui-bg-danger-subtle ui-text-danger" style={{ display: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }} title="Broken Link">
                                        <AlertTriangle size={16} />
                                    </div>
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.url}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {tm('ui.referencedTimes', { count: item.refs.length, refs: item.refs.join(', ') })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(activeTab === 'summary' ? results.allUrls : results.duplicatedUrls).length === 0 && (
                            <div className="ui-p-large ui-text-center ui-text-muted">{tm('ui.noAssetsFound')}</div>
                        )}
                    </div>
                </div>
            )}
            {!results && !analyzing && (
                <div className="ui-text-muted ui-text-small">
                    {tm('ui.assetDataAnalyticsDesc')}
                </div>
            )}
        </div>
    );
};

export default DatabaseAssetAnalytics;
