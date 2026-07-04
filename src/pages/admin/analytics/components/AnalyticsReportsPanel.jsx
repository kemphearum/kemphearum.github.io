import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileJson, FileSpreadsheet, Calendar } from 'lucide-react';
import AnalyticsService from '../../../../services/AnalyticsService';
import BaseService from '../../../../services/BaseService';
import { Spinner } from '@/shared/components/ui';
import { jsonToCsv } from '../../../../utils/csvUtils';

const AnalyticsReportsPanel = ({ userRole, showToast }) => {
    // Reports panel manages its own date range to generate specific summaries
    const [reportType, setReportType] = useState('daily'); // 'daily', 'weekly', 'monthly'
    
    // We fetch a larger chunk of data (e.g. 30 days) to generate summaries
    const {
        data: visits = [],
        isLoading,
        isFetching
    } = useQuery({
        queryKey: ['analyticsReports', reportType],
        queryFn: async () => {
            const end = new Date();
            const start = new Date();
            
            if (reportType === 'daily') start.setDate(end.getDate() - 7);
            else if (reportType === 'weekly') start.setDate(end.getDate() - 30);
            else if (reportType === 'monthly') start.setMonth(end.getMonth() - 12);

            const range = {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0]
            };

            const res = await BaseService.safe(() => AnalyticsService.fetchAnalytics(userRole, range));
            return res.data || [];
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    const handleExportCsv = () => {
        if (!visits || !visits.length) {
            showToast('No data to export', 'error');
            return;
        }

        const exportData = visits.map(v => ({
            Date: v.date || (v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toISOString().split('T')[0] : 'Unknown'),
            Path: v.path,
            IP: v.ip,
            Country: v.country,
            City: v.city,
            Device: v.device,
            Browser: v.browser || 'Unknown',
            OS: v.os || 'Unknown',
            Type: v.isReturning ? 'Returning' : 'New',
            Duration: v.duration ? `${v.duration}s` : '0s',
            Referrer: v.referrer
        }));

        const csv = jsonToCsv(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `portfolio_analytics_${reportType}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('CSV exported successfully', 'success');
    };

    const handleExportJson = () => {
        if (!visits || !visits.length) {
            showToast('No data to export', 'error');
            return;
        }

        const json = JSON.stringify(visits, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `portfolio_analytics_${reportType}.json`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('JSON exported successfully', 'success');
    };

    if (isLoading && !visits.length) return <div className="flex justify-center py-8"><Spinner /></div>;

    return (
        <div className="analytics-panel fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Generate Reports</h3>

            <div className="admin-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
                    <Calendar size={24} color="var(--primary-color)" />
                    <h4 style={{ margin: 0, fontSize: '1.125rem' }}>Select Report Scope</h4>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button 
                        className={`ui-button ${reportType === 'daily' ? 'primary' : 'outline'}`}
                        onClick={() => setReportType('daily')}
                    >
                        Daily Summary (Last 7 Days)
                    </button>
                    <button 
                        className={`ui-button ${reportType === 'weekly' ? 'primary' : 'outline'}`}
                        onClick={() => setReportType('weekly')}
                    >
                        Weekly Summary (Last 30 Days)
                    </button>
                    <button 
                        className={`ui-button ${reportType === 'monthly' ? 'primary' : 'outline'}`}
                        onClick={() => setReportType('monthly')}
                    >
                        Monthly Summary (Last 12 Months)
                    </button>
                </div>
            </div>

            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div className="admin-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileSpreadsheet size={20} color="var(--primary-color)" />
                            Export as CSV
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            Download a flat table format suitable for Excel, Google Sheets, or data visualization tools.
                        </p>
                    </div>
                    <button 
                        className="ui-button primary" 
                        onClick={handleExportCsv}
                        disabled={isFetching || !visits.length}
                        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Download size={16} /> Download CSV
                    </button>
                </div>

                <div className="admin-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileJson size={20} color="#ffab40" />
                            Export as JSON
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            Download raw structured data containing all properties for programmatic analysis or backup.
                        </p>
                    </div>
                    <button 
                        className="ui-button outline" 
                        onClick={handleExportJson}
                        disabled={isFetching || !visits.length}
                        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Download size={16} /> Download JSON
                    </button>
                </div>
            </div>
            
            {isFetching && (
                <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Preparing report data...
                </div>
            )}
        </div>
    );
};

export default AnalyticsReportsPanel;
