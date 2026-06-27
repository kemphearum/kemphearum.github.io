import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useActivity } from '../../../hooks/useActivity';
import { useTranslation } from '../../../hooks/useTranslation';
import { ACTIONS } from '../../../utils/permissions';
import { listDashboardWidgets } from '../../../registry/dashboardWidgetRegistry';

/**
 * Dashboard shell. Widgets are composed from the dashboard widget registry —
 * each is independent (own queries), permission-gated, and ordered by the
 * registry. Adding a dashboard card means registering a widget.
 */
const DashboardTab = ({ userRole, isActionAllowed, setActiveTab }) => {
  const { t, language } = useTranslation();
  const { trackRead, currentDateKey } = useActivity();
  const navigate = useNavigate();

  const ctx = useMemo(() => ({
    isActionAllowed,
    can: (module) => isActionAllowed(ACTIONS.VIEW, module),
    go: (tab) => setActiveTab?.(tab),
    navigate,
    userRole,
    t,
    language,
    trackRead,
    currentDateKey
  }), [isActionAllowed, setActiveTab, navigate, userRole, t, language, trackRead, currentDateKey]);

  const widgets = useMemo(
    () => listDashboardWidgets().filter((widget) => widget.canView(ctx)),
    [ctx]
  );

  return (
    <div className="admin-tab-container">
      {widgets.map((widget) => {
        const WidgetComponent = widget.component;
        return (
          <React.Suspense key={widget.id} fallback={<div className="loading-state">{t('admin.common.loading')}</div>}>
            <WidgetComponent ctx={ctx} />
          </React.Suspense>
        );
      })}
    </div>
  );
};

export default DashboardTab;
