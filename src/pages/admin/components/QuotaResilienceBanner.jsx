import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

const QuotaResilienceBanner = ({ onRefresh }) => {
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

    return (
        <div className="ui-quota-banner">
            <div className="ui-quota-banner-icon">
                <AlertTriangle size={24} />
            </div>
            <div className="ui-quota-banner-content">
                <h3>{tr('Daily Resource Limit Reached', 'ដល់កម្រិតធនធានប្រចាំថ្ងៃ')}</h3>
                <p>
                    {tr(
                        'The Firebase daily free-tier quota has been exceeded. Some data may be temporarily unavailable until the next daily reset (usually at midnight).',
                        'បានលើសកម្រិតឥតគិតថ្លៃប្រចាំថ្ងៃរបស់ Firebase។ ទិន្នន័យខ្លះអាចមិនមានជាបណ្តោះអាសន្ន រហូតដល់ពេលកំណត់ឡើងវិញបន្ទាប់ (ជាទូទៅពាក់កណ្តាលអធ្រាត្រ)។'
                    )}
                </p>
                <div className="ui-quota-banner-actions">
                    <button onClick={onRefresh} className="ui-btn ui-btn-outline">
                        <Clock size={16} /> {tr('Check Again', 'ពិនិត្យម្តងទៀត')}
                    </button>
                    <span className="ui-text-muted">{tr('Estimated reset: Midnight', 'ពេលកំណត់ឡើងវិញប៉ាន់ស្មាន៖ កណ្តាលអធ្រាត្រ')}</span>
                </div>
            </div>
        </div>
    );
};

export default QuotaResilienceBanner;
