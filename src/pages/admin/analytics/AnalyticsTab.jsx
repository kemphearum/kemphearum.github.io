import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/shared/components/ui';
import { useTranslation } from '../../../hooks/useTranslation';
import PermissionService from '../../../services/auth/PermissionService';

import AnalyticsOverviewPanel from './components/AnalyticsOverviewPanel';
import AnalyticsVisitorsPanel from './components/AnalyticsVisitorsPanel';
import AnalyticsContentPanel from './components/AnalyticsContentPanel';
import AnalyticsContactPanel from './components/AnalyticsContactPanel';
import AnalyticsSearchPanel from './components/AnalyticsSearchPanel';
import AnalyticsDownloadsPanel from './components/AnalyticsDownloadsPanel';
import AnalyticsTechPanel from './components/AnalyticsTechPanel';
import AnalyticsReportsPanel from './components/AnalyticsReportsPanel';
import AnalyticsExplorerPanel from './components/AnalyticsExplorerPanel';
import AnalyticsSettingsPanel from './components/AnalyticsSettingsPanel';
import AnalyticsFilterBar from './components/AnalyticsFilterBar';

const AnalyticsTab = ({ userRole, showToast }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');

    // 1. FILTER STATE (Shared across all panels)
    const [analyticsRange, setAnalyticsRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6); // Default 7d
        return { 
            start: start.toISOString().split('T')[0], 
            end: end.toISOString().split('T')[0], 
            preset: '7d' 
        };
    });

    const canView = PermissionService.can(userRole, PermissionService.ACTIONS.VIEW, PermissionService.RESOURCES.ANALYTICS);

    if (!canView) {
        return (
            <EmptyState 
                title={t('admin.analytics.restricted.title') || 'Access Denied'}
                description={t('admin.analytics.restricted.description') || 'You do not have permission to view analytics.'}
                icon={ShieldAlert}
            />
        );
    }

    const commonProps = { userRole, showToast, analyticsRange };

    return (
        <div className="admin-tab-container ui-tabs-root">
            <AnalyticsFilterBar 
                range={analyticsRange} 
                onRangeChange={setAnalyticsRange} 
                onRefresh={() => {}} 
                lastUpdated={new Date().toISOString()} 
            />

            <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="ui-tabs">
                <Tabs.List className="ui-tabs-list" aria-label="Analytics & Insights">
                    <Tabs.Trigger className="ui-tabs-trigger" value="overview">Overview</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="visitors">Visitors</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="content">Content</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="contact">Contact</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="search">Search</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="downloads">Downloads</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="tech">Technology</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="reports">Reports</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="explorer">Data Explorer</Tabs.Trigger>
                    <Tabs.Trigger className="ui-tabs-trigger" value="settings">Settings</Tabs.Trigger>
                </Tabs.List>

                <div className="ui-tabs-content-container" style={{ marginTop: '2rem' }}>
                    <Tabs.Content value="overview">
                        <AnalyticsOverviewPanel {...commonProps} />
                    </Tabs.Content>
                    <Tabs.Content value="visitors">
                        <AnalyticsVisitorsPanel {...commonProps} />
                    </Tabs.Content>
                    <Tabs.Content value="content">
                        <AnalyticsContentPanel {...commonProps} />
                    </Tabs.Content>
                    <Tabs.Content value="contact">
                        <AnalyticsContactPanel {...commonProps} />
                    </Tabs.Content>
                    <Tabs.Content value="search">
                        <AnalyticsSearchPanel {...commonProps} />
                    </Tabs.Content>
                    <Tabs.Content value="downloads">
                        <AnalyticsDownloadsPanel {...commonProps} />
                    </Tabs.Content>
                    <Tabs.Content value="tech">
                        <AnalyticsTechPanel {...commonProps} />
                    </Tabs.Content>
                    <Tabs.Content value="reports">
                        <AnalyticsReportsPanel {...commonProps} />
                    </Tabs.Content>
                    <Tabs.Content value="explorer">
                        <AnalyticsExplorerPanel {...commonProps} />
                    </Tabs.Content>
                    <Tabs.Content value="settings">
                        <AnalyticsSettingsPanel {...commonProps} />
                    </Tabs.Content>
                </div>
            </Tabs.Root>
        </div>
    );
};

export default AnalyticsTab;
