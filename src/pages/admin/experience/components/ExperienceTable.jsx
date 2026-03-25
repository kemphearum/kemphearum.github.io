import React from 'react';
import { Briefcase, Plus } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLocalizedField } from '../../../../utils/localization';

/**
 * ExperienceTable Component
 * Refactored to use standardized DataTableHelpers for common column rendering.
 */
const ExperienceTable = ({ 
  experiences, 
  onEdit, 
  onDelete,
  onToggleVisibility,
  onCreate,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  loading = false,
  page = 1,
  pageSize = 5,
  totalItems,
  hasMore = false,
  isFirstPage = true,
  onNext,
  onPrevious,
  onPageChange,
  paginationVariant = 'cursor'
}) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const normalizeMonthValue = (value) => {
    if (!value) return '';

    if (typeof value === 'object') {
      if (value.seconds) {
        const date = new Date(value.seconds * 1000);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      if (typeof value.toDate === 'function') {
        const date = value.toDate();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    const text = String(value).trim();
    const monthMatch = text.match(/^(\d{4})-(\d{2})/);
    if (monthMatch) return monthMatch[0];

    const nativeDate = new Date(text);
    if (!Number.isNaN(nativeDate.getTime())) {
      return `${nativeDate.getFullYear()}-${String(nativeDate.getMonth() + 1).padStart(2, '0')}`;
    }

    return '';
  };

  const formatMonth = (value) => {
    const normalized = normalizeMonthValue(value);
    if (!normalized) return '';
    const [year, month] = normalized.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getPeriodSummary = (row) => {
    const isCurrent = row.current === true || `${row.endMonthYear || row.endDate || row.period || ''}`.toLowerCase().includes('present');
    const startRaw = row.startMonthYear || row.startDate || row.period;
    const endRaw = row.endMonthYear || row.endDate || row.period;
    const start = formatMonth(startRaw);
    const end = isCurrent ? tr('Present', 'បច្ចុប្បន្ន') : formatMonth(endRaw);

    if (start && end) return `${start} - ${end}`;
    return row.period || start || end || tr('Timeline not set', 'មិនទាន់កំណត់ពេលវេលា');
  };

  const getDescription = (text = '') => {
    const normalized = String(getLocalizedField(text, language) || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return tr('No description added yet.', 'មិនទាន់មានការពិពណ៌នានៅឡើយទេ។');
    return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
  };

  const columns = [
    { 
      key: 'role', 
      header: tr('Role', 'តួនាទី'),
      sortable: true, 
      className: 'ui-table-cell--title',
      render: (row) => (
        <div className="ui-blog-tableTitle">
          <div className="ui-blog-tableTitle__main">{getLocalizedField(row.role, language) || tr('Untitled role', 'តួនាទីគ្មានចំណងជើង')}</div>
          <div className="ui-blog-tableTitle__meta">
            <span>{getLocalizedField(row.company, language) || tr('Company not set', 'មិនទាន់កំណត់ក្រុមហ៊ុន')}</span>
            <span>{getDescription(row.description)}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'period', 
      header: tr('Timeline', 'ពេលវេលា'),
      render: (row) => {
        const isCurrent = row.current === true || `${row.endMonthYear || row.endDate || row.period || ''}`.toLowerCase().includes('present');
        return (
          <div className="ui-blog-dateCell">
            <span className="ui-blog-dateCell__day">{getPeriodSummary(row)}</span>
            <span className="ui-blog-dateCell__time">
              {isCurrent ? tr('Current position', 'តួនាទីបច្ចុប្បន្ន') : tr('Completed role', 'តួនាទីដែលបានបញ្ចប់')}
            </span>
          </div>
        );
      }
    },
    {
      key: 'visible',
      header: tr('Status', 'ស្ថានភាព'),
      sortable: true,
      render: (row) => {
        const isCurrent = row.current === true || `${row.endMonthYear || row.endDate || row.period || ''}`.toLowerCase().includes('present');
        return (
          <div className="ui-blog-statusCell">
            <div className="ui-blog-statusCell__badges">
              <Badge variant={row.visible !== false ? 'success' : 'warning'}>
                {row.visible !== false ? tr('Visible', 'បង្ហាញ') : tr('Hidden', 'លាក់')}
              </Badge>
              {isCurrent && <Badge variant="primary">{tr('Current', 'បច្ចុប្បន្ន')}</Badge>}
            </div>
            <span className="ui-blog-statusCell__note">
              {row.visible !== false
                ? tr('Appears on the public career timeline', 'បង្ហាញលើបទពិសោធន៍សាធារណៈ')
                : tr('Saved only in admin for now', 'រក្សាទុកសម្រាប់តែ Admin សិន')}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: tr('Actions', 'សកម្មភាព'),
      className: 'ui-table-cell--actions',
      render: (row) => renderAdminActions({
        row,
        onEdit,
        onDelete,
        onToggleVisibility,
        canEdit,
        canDelete
      })
    }
  ];

  return (
    <DataTable 
      data={experiences} 
      columns={columns}
      keyField="id"
      loading={loading}
      manualPagination={true}
      paginationVariant={paginationVariant}
      page={page}
      pageSize={pageSize}
      totalItems={totalItems}
      hasMore={hasMore}
      isFirstPage={isFirstPage}
      onNext={onNext}
      onPrevious={onPrevious}
      onPageChange={onPageChange}
      showExport={true}
      exportFileName="experience_export.csv"
      emptyState={{
        icon: Briefcase,
        title: tr('No Experience Entries', 'មិនមានបទពិសោធន៍ការងារ'),
        description: tr('Add your first role to start shaping the public career timeline and internal work history.', 'បន្ថែមតួនាទីដំបូងរបស់អ្នក ដើម្បីចាប់ផ្តើមរៀបចំពេលវេលាការងារសាធារណៈ និងប្រវត្តិការងារខាងក្នុង។'),
        action: canCreate ? {
          label: tr('Create first entry', 'បង្កើតទិន្នន័យដំបូង'),
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(ExperienceTable);

