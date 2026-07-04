import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Activity, RefreshCw } from 'lucide-react';
import { Button, Spinner, EmptyState } from '@/shared/components/ui';
import AuditLogService from '../../../../services/AuditLogService';
import { useActivity } from '../../../../hooks/useActivity';
import BaseService from '../../../../services/BaseService';
import { formatDate } from '../../../../utils/dateUtils';
import clsx from 'clsx';

const AuthActivityPanel = () => {
    const { trackRead } = useActivity();
    const page = 0;

    const { data: result = { data: [], hasMore: false }, isLoading, isFetching, refetch } = useQuery({
        staleTime: 60000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        queryKey: ['authActivity', page],
        queryFn: async () => {
            // We pass filters={{ module: 'users' }} to only get auth-related activity
            const res = await BaseService.safe(() => AuditLogService.fetchActivityDetails({
                activityDateRange: '30d',
                operationType: 'all',
                limit: 15,
                filters: { module: 'users' },
                // Since this is a simple page, we don't fully implement cursor pagination here for simplicity,
                // but in a production app we'd pass lastDoc from the previous page.
                // We're just limiting to recent 15 activities.
            }));
            if (res.error) {
                console.error(res.error);
                return { data: [], hasMore: false };
            }
            if (trackRead) trackRead(res.data?.data?.length || 0, 'Fetched auth activity');
            return res.data;
        }
    });

    const logs = result.data || [];

    if (isLoading && page === 0) {
        return (
            <div className="ui-flex-center ui-p-large">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="auth-activity-panel">
            <div className="ui-flex-between ui-mb-medium">
                <h3 className="ui-heading ui-m-0">Authentication & Authorization Activity</h3>
                <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
                    <RefreshCw size={16} className={clsx(isFetching && "ui-spin")} /> Refresh
                </Button>
            </div>

            <div className="ui-mb-medium">
                <div className="ui-alert ui-alert-info">
                    <ShieldAlert size={16} />
                    <span>
                        <strong>Audit Trail:</strong> This panel shows administrative actions performed on users (role changes, enabling/disabling, etc.) over the last 30 days. For full security audit logs, see the main Audit module.
                    </span>
                </div>
            </div>

            {logs.length === 0 ? (
                <EmptyState 
                    title="No recent activity"
                    description="There have been no user administration actions in the last 30 days."
                    icon={Activity}
                />
            ) : (
                <div className="ui-card">
                    <div className="ui-table-container">
                        <table className="ui-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Action</th>
                                    <th>User (Target)</th>
                                    <th>Performed By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={log.id || i}>
                                        <td className="ui-text-muted">
                                            {log.time?.toDate ? 
                                                formatDate(log.time.toDate().toISOString(), 'en', {
                                                    month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                }) 
                                                : 'Unknown time'
                                            }
                                        </td>
                                        <td>
                                            <span className={clsx(
                                                "ui-badge",
                                                log.type === 'write' ? 'ui-badge-warning' : 
                                                log.type === 'delete' ? 'ui-badge-danger' : 
                                                'ui-badge-secondary'
                                            )}>
                                                {log.label || log.type}
                                            </span>
                                        </td>
                                        <td className="ui-text-bold">
                                            {log.details?.entityName || log.details?.entityId || 'N/A'}
                                        </td>
                                        <td className="ui-text-muted">
                                            {log.user || 'System'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthActivityPanel;
