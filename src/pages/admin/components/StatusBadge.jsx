import React from 'react';
import { Badge } from '@/shared/components/ui';
import { useTranslation } from '../../../hooks/useTranslation';
import { computeEffectiveStatus, getStoredStatus, STATUS } from '../../../domain/shared/contentStatus';

const VARIANT = {
    [STATUS.DRAFT]: 'warning',
    [STATUS.SCHEDULED]: 'primary',
    [STATUS.PUBLISHED]: 'success',
    [STATUS.ARCHIVED]: 'default'
};

/**
 * Renders the effective status of a status-capable record. When the stored
 * status differs from the effective one (e.g. Scheduled that is now live, or
 * expired), the stored status is shown as a secondary badge.
 */
const StatusBadge = ({ row }) => {
    const { t } = useTranslation();
    const effective = computeEffectiveStatus(row);
    const stored = getStoredStatus(row);

    return (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge variant={VARIANT[effective] || 'default'}>{t(`admin.common.status.${effective}`)}</Badge>
            {stored !== effective && (
                <Badge variant="default" title={t('admin.common.schedule.storedHint')}>
                    {t(`admin.common.status.${stored}`)}
                </Badge>
            )}
        </div>
    );
};

export default StatusBadge;
