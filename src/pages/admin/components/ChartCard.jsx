import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

const ChartCard = ({
    title,
    icon: Icon,
    onRefresh,
    onViewDetails,
    isLoading,
    children,
    headerRight
}) => {
    const { language } = useTranslation();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

    return (
        <div className="ui-chartCard">
            <div className="ui-chartHeader">
                <div className="ui-chartTitle">
                    {Icon && <Icon size={18} style={{ color: 'var(--primary-color)' }} />}
                    <span>{title}</span>
                </div>
                <div className="ui-chartActions">
                    {headerRight}
                    {onViewDetails && (
                        <button className="ui-detailBtn" onClick={onViewDetails}>
                            {tr('View Details', 'មើលលម្អិត')}
                        </button>
                    )}
                    {onRefresh && (
                        <button
                            className="ui-refreshBtn"
                            onClick={onRefresh}
                            disabled={isLoading}
                        >
                            <RefreshCw size={14} className={isLoading ? 'ui-spin' : ''} />
                            {tr('Refresh', 'ធ្វើបច្ចុប្បន្នភាព')}
                        </button>
                    )}
                </div>
            </div>
            <div className={`ui-chartBody ${isLoading ? 'ui-chartLoading' : ''}`}>
                {children}
            </div>
        </div>
    );
};

export default ChartCard;
