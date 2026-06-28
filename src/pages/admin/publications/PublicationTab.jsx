import React from 'react';
import PublicationService from '../../../services/PublicationService';
import { useTranslation } from '../../../hooks/useTranslation';

const PublicationTab = () => {
    const { t } = useTranslation();
    return (
        <div className="admin-tab-container">
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1rem' }}>{t('admin.tabs.publications', 'Publications')} Management</h2>
                <p>This section is available via the PublicationService API.</p>
                <p>Currently configured as a simplified placeholder to satisfy CMS routing and schema definition.</p>
            </div>
        </div>
    );
};

export default PublicationTab;
