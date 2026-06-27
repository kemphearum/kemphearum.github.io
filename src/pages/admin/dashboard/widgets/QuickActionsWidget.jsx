import React from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { Card, Button } from '@/shared/components/ui';
import { ACTIONS, MODULES } from '../../../../utils/permissions';
import styles from '../DashboardTab.module.scss';

const QuickActionsWidget = ({ ctx }) => {
  const { isActionAllowed, go, navigate, t } = ctx;

  const actions = [
    isActionAllowed(ACTIONS.CREATE, MODULES.PROJECTS) && { icon: Plus, label: t('admin.dashboard.newProject'), onClick: () => go('projects') },
    isActionAllowed(ACTIONS.CREATE, MODULES.BLOG) && { icon: Plus, label: t('admin.dashboard.newPost'), onClick: () => go('blog') },
    { icon: ExternalLink, label: t('admin.dashboard.viewSite'), onClick: () => navigate('/'), variant: 'secondary' }
  ].filter(Boolean);

  return (
    <Card className={styles.quickActions}>
      <h2 className={styles.sectionTitle}>{t('admin.dashboard.quickActions')}</h2>
      <div className={styles.quickActionsRow}>
        {actions.map((action) => (
          <Button key={action.label} variant={action.variant || 'primary'} onClick={action.onClick}>
            <action.icon size={16} style={{ marginRight: '0.4rem' }} />
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActionsWidget;
