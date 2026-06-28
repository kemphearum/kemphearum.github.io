import React from 'react';
import AwardService from '../../../services/AwardService';
import { useTranslation } from '../../../hooks/useTranslation';

const AwardTab = () => {
    const { t } = useTranslation();
    return (
        <div className="admin-tab-container">
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1rem' }}>{t('admin.tabs.awards', 'Awards')} Management</h2>
                <p>This section is available via the AwardService API.</p>
                <p>Currently configured as a simplified placeholder to satisfy CMS routing and schema definition.</p>
            </div>
        </div>
    );
};

export default AwardTab;
