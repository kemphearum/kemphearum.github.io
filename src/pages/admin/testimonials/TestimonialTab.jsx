import React from 'react';
import TestimonialService from '../../../services/TestimonialService';
import { useTranslation } from '../../../hooks/useTranslation';

const TestimonialTab = () => {
    const { t } = useTranslation();
    return (
        <div className="admin-tab-container">
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1rem' }}>{t('admin.tabs.testimonials', 'Testimonials')} Management</h2>
                <p>This section is available via the TestimonialService API.</p>
                <p>Currently configured as a simplified placeholder to satisfy CMS routing and schema definition.</p>
            </div>
        </div>
    );
};

export default TestimonialTab;
