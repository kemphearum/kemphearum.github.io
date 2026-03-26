import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

const QuotaResilienceBanner = ({ onRefresh }) => {
    const { t } = useTranslation();

    return (
        <div className="ui-quota-banner">
            <div className="ui-quota-banner-icon">
                <AlertTriangle size={24} />
            </div>
            <div className="ui-quota-banner-content">
                <h3>{t('admin.common.quotaBanner.title')}</h3>
                <p>
                    {t('admin.common.quotaBanner.message')}
                </p>
                <div className="ui-quota-banner-actions">
                    <button onClick={onRefresh} className="ui-btn ui-btn-outline">
                        <Clock size={16} /> {t('admin.common.quotaBanner.checkAgain')}
                    </button>
                    <span className="ui-text-muted">{t('admin.common.quotaBanner.estimatedReset')}</span>
                </div>
            </div>
        </div>
    );
};

export default QuotaResilienceBanner;
