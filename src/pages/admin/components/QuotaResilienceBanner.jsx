import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

const QuotaResilienceBanner = ({ onRefresh }) => {
    return (
        <div className="ui-quota-banner">
            <div className="ui-quota-banner-icon">
                <AlertTriangle size={24} />
            </div>
            <div className="ui-quota-banner-content">
                <h3>Daily Resource Limit Reached</h3>
                <p>
                    The Firebase daily free-tier quota has been exceeded. 
                    Some data may be temporarily unavailable until the next daily reset (usually at midnight).
                </p>
                <div className="ui-quota-banner-actions">
                    <button onClick={onRefresh} className="ui-btn ui-btn-outline">
                        <Clock size={16} /> Check Again
                    </button>
                    <span className="ui-text-muted">Estimated reset: Midnight</span>
                </div>
            </div>
        </div>
    );
};

export default QuotaResilienceBanner;
