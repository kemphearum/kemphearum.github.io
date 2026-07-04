import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ShieldAlert, Sliders, Database, EyeOff } from 'lucide-react';
import SettingsService from '../../../../services/SettingsService';
import BaseService from '../../../../services/BaseService';
import { Spinner } from '@/shared/components/ui';

const AnalyticsSettingsPanel = ({ showToast }) => {
    const queryClient = useQueryClient();
    const [settings, setSettings] = useState({
        dataRetentionDays: 90,
        anonymousTracking: true,
        visitorTracking: true,
        searchTracking: true,
        downloadTracking: true
    });

    const {
        data: globalSettings,
        isLoading
    } = useQuery({
        queryKey: ['globalSettings'],
        queryFn: async () => {
            const res = await BaseService.safe(() => SettingsService.fetchGlobalSettings());
            return res.data || {};
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    useEffect(() => {
        if (globalSettings?.analytics) {
            setSettings(prev => ({ ...prev, ...globalSettings.analytics }));
        }
    }, [globalSettings]);

    const mutation = useMutation({
        mutationFn: async (newSettings) => {
            const res = await BaseService.safe(() => 
                SettingsService.updateGlobalSettings({ analytics: newSettings })
            );
            if (res.error) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            showToast('Analytics settings updated successfully', 'success');
            queryClient.invalidateQueries(['globalSettings']);
        },
        onError: (err) => {
            showToast(err.message || 'Failed to save settings', 'error');
        }
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    const handleSave = () => {
        mutation.mutate(settings);
    };

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

    return (
        <div className="analytics-panel fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={24} color="var(--primary-color)" /> Analytics Settings
            </h3>

            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                
                <div className="admin-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(100, 255, 218, 0.1)', borderRadius: '8px', color: 'var(--primary-color)' }}>
                            <Database size={24} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1.125rem' }}>Data Retention</h4>
                    </div>

                    <div className="ui-form-group">
                        <label>Analytics Retention Period (Days)</label>
                        <select 
                            className="ui-input" 
                            name="dataRetentionDays"
                            value={settings.dataRetentionDays}
                            onChange={handleChange}
                        >
                            <option value={30}>30 Days</option>
                            <option value={90}>90 Days</option>
                            <option value={180}>180 Days</option>
                            <option value={365}>1 Year</option>
                            <option value={9999}>Indefinite</option>
                        </select>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Older analytics data will be automatically purged by client-side janitor routines to save Firestore storage.
                        </p>
                    </div>
                </div>

                <div className="admin-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(124, 77, 255, 0.1)', borderRadius: '8px', color: '#7c4dff' }}>
                            <EyeOff size={24} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1.125rem' }}>Tracking Preferences</h4>
                    </div>

                    <div className="ui-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                name="visitorTracking"
                                checked={settings.visitorTracking}
                                onChange={handleChange}
                                style={{ width: '1.25rem', height: '1.25rem' }}
                            />
                            <div>
                                <div style={{ fontWeight: 500 }}>Enable Visitor Tracking</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Record page views and sessions to Firestore.</div>
                            </div>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                name="anonymousTracking"
                                checked={settings.anonymousTracking}
                                onChange={handleChange}
                                style={{ width: '1.25rem', height: '1.25rem' }}
                            />
                            <div>
                                <div style={{ fontWeight: 500 }}>Anonymize IP Addresses</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mask the last octet of IP addresses before saving.</div>
                            </div>
                        </label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                name="searchTracking"
                                checked={settings.searchTracking}
                                onChange={handleChange}
                                style={{ width: '1.25rem', height: '1.25rem' }}
                            />
                            <div>
                                <div style={{ fontWeight: 500 }}>Enable Search Tracking</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Record search queries from the public frontend.</div>
                            </div>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                name="downloadTracking"
                                checked={settings.downloadTracking}
                                onChange={handleChange}
                                style={{ width: '1.25rem', height: '1.25rem' }}
                            />
                            <div>
                                <div style={{ fontWeight: 500 }}>Enable Download Tracking</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Record file downloads (Resumes, PDFs).</div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button 
                    className="ui-button primary" 
                    onClick={handleSave} 
                    disabled={mutation.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Save size={18} /> {mutation.isPending ? 'Saving...' : 'Save Settings'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <ShieldAlert size={16} /> 
                    <span>Zero-Cost Notice: Tracking settings are enforced client-side.</span>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsSettingsPanel;
