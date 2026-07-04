import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSearch } from 'lucide-react';
import AnalyticsService from '../../../../services/AnalyticsService';
import BaseService from '../../../../services/BaseService';
import { Spinner } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { jsonToCsv } from '../../../../utils/csvUtils';

const toDateKey = (value) => {
    if (!value) return 'Unknown';
    if (typeof value === 'string') return value;
    if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
    return 'Unknown';
};

const AnalyticsExplorerPanel = ({ userRole, showToast, analyticsRange }) => {

    const {
        data: visits = [],
        isLoading,
        isFetching
    } = useQuery({
        queryKey: ['analyticsExplorer', analyticsRange],
        queryFn: async () => {
            const res = await BaseService.safe(() => AnalyticsService.fetchAnalytics(userRole, analyticsRange));
            return res.data || [];
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    const columns = useMemo(() => [
        {
            key: 'timestamp',
            label: 'Time',
            sortable: true,
            render: (v) => toDateKey(v.timestamp) || v.date
        },
        {
            key: 'path',
            label: 'Path',
            sortable: true,
            render: (v) => <span style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>{v.path}</span>
        },
        {
            key: 'ip',
            label: 'IP Address',
            sortable: true
        },
        {
            key: 'location',
            label: 'Location',
            render: (v) => `${v.city || ''}, ${v.country || ''}`.replace(/^,\s*$/, 'Unknown')
        },
        {
            key: 'device',
            label: 'Device',
            sortable: true,
            render: (v) => <span style={{ textTransform: 'capitalize' }}>{v.device || 'Unknown'}</span>
        },
        {
            key: 'browser',
            label: 'Browser',
            sortable: true
        },
        {
            key: 'isReturning',
            label: 'Type',
            sortable: true,
            render: (v) => v.isReturning ? <span style={{ color: 'var(--primary-color)' }}>Returning</span> : <span>New</span>
        },
        {
            key: 'duration',
            label: 'Duration',
            sortable: true,
            render: (v) => v.duration ? `${v.duration}s` : '0s'
        }
    ], []);

    const handleExport = (dataToExport) => {
        if (!dataToExport || !dataToExport.length) return;
        const exportData = dataToExport.map(v => ({
            Time: toDateKey(v.timestamp) || v.date,
            Path: v.path,
            IP: v.ip,
            Location: `${v.city || ''}, ${v.country || ''}`,
            Device: v.device,
            Browser: v.browser,
            OS: v.os,
            Type: v.isReturning ? 'Returning' : 'New',
            Duration: v.duration ? `${v.duration}s` : '0s',
            Referrer: v.referrer
        }));
        
        const csv = jsonToCsv(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `analytics_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Exported successfully', 'success');
    };

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

    return (
        <div className="analytics-panel fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileSearch size={24} color="var(--primary-color)" /> Data Explorer
            </h3>

            <div className="admin-card" style={{ overflow: 'hidden' }}>
                <DataTable
                    columns={columns}
                    data={visits}
                    keyField="id"
                    searchable={true}
                    searchField="path"
                    searchPlaceholder="Search by path..."
                    loading={isFetching}
                    pagination={true}
                    defaultPageSize={20}
                    exportable={true}
                    onExport={() => handleExport(visits)}
                    emptyState={{
                        title: 'No analytics data found',
                        description: 'Try adjusting your date range filter.'
                    }}
                />
            </div>
        </div>
    );
};

export default AnalyticsExplorerPanel;
