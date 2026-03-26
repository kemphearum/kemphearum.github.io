import React from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import { Input, Button } from '../../../../shared/components/ui';
import { useTranslation } from '../../../../hooks/useTranslation';

const UsersToolbar = ({ search, onSearch, onCreate, searchResultCount, totalCount, stats = [] }) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);

  return (
    <section className="ui-users-toolbar">
      <div className="ui-users-toolbar__summary">
        <span className="ui-users-toolbar__eyebrow">
          <Users size={14} />
          {tr('User workspace', 'ផ្ទៃការងារអ្នកប្រើ')}
        </span>
        <div className="ui-users-toolbar__copy">
          <h3>{tr('Manage access and account roles from one place.', 'គ្រប់គ្រងសិទ្ធិ និងតួនាទីគណនីពីកន្លែងតែមួយ។')}</h3>
          <p>
            {tr('Search by email or role, inspect account history, and invite new admins without leaving the table.', 'ស្វែងរកតាមអ៊ីមែល ឬតួនាទី ពិនិត្យប្រវត្តិគណនី និងអញ្ជើញ admin ថ្មីដោយមិនចាកចេញពីតារាង។')}
          </p>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="ui-users-toolbar__stats" aria-label={tr('User workspace summary', 'សង្ខេបផ្ទៃការងារអ្នកប្រើ')}>
          {stats.map((stat, index) => {
            const tone = stat.tone || ['total', 'active', 'elevated', 'disabled'][index] || 'total';

            return (
            <div
              key={stat.label}
              className={`ui-users-toolbar__stat ui-users-toolbar__stat--${tone}`}
            >
              <span className="ui-users-toolbar__statLabel">{stat.label}</span>
              <strong className="ui-users-toolbar__statValue">{stat.value}</strong>
              <span className="ui-users-toolbar__statMeta">{stat.meta}</span>
            </div>
            );
          })}
        </div>
      )}

      <div className="admin-toolbar ui-users-toolbar__controls">
        <div className="admin-search-container ui-users-toolbar__search">
          <Search size={16} className="admin-search-icon" />
          <Input 
            type="text" 
            placeholder={tr('Search by email or role...', 'ស្វែងរកតាមអ៊ីមែល ឬតួនាទី...')} 
            value={search} 
            onChange={(e) => onSearch(e.target.value)} 
            className="admin-search-input"
          />
          <span className="admin-search-result-count">
            {search ? `${searchResultCount} ${tr('of', 'នៃ')} ${totalCount}` : `${totalCount} ${tr('total', 'សរុប')}`}
          </span>
        </div>

        <Button onClick={onCreate} className="ui-primary ui-users-toolbar__create">
          <UserPlus size={18} /> {tr('Add User', 'បន្ថែមអ្នកប្រើ')}
        </Button>
      </div>
    </section>
  );
};

export default UsersToolbar;
