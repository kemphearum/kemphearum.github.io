import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useActivity } from '../../../hooks/useActivity';
import { useTranslation } from '../../../hooks/useTranslation';
import { ACTIONS } from '../../../utils/permissions';
import { listDashboardWidgets } from '../../../registry/dashboardWidgetRegistry';
import { Card, Skeleton } from '../../../shared/components/ui';
import styles from './DashboardTab.module.scss';
import { motion } from 'framer-motion';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className={`admin-tab-container ${styles.dashboardGrid}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {widgets.map((widget) => {
        const WidgetComponent = widget.component;
        return (
          <React.Suspense 
            key={widget.id} 
            fallback={
              <motion.div variants={itemVariants} className={`${styles.widgetWrapper} ${styles[`widget-${widget.id}`]}`}>
                <Card className={styles.panel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.7 }}>
                  <Skeleton height="24px" width="140px" />
                  <Skeleton height="100%" width="100%" />
                </Card>
              </motion.div>
            }
          >
            <motion.div variants={itemVariants} className={`${styles.widgetWrapper} ${styles[`widget-${widget.id}`]}`}>
              <WidgetComponent ctx={ctx} />
            </motion.div>
          </React.Suspense>
        );
      })}
    </motion.div>
  );
};

export default DashboardTab;
