import React from 'react';
import { Layout, Plus, History } from 'lucide-react';
import { Badge, Button } from '@/shared/components/ui';
import DataTable from '@/shared/components/ui/data-table/DataTable';
import { renderAdminActions } from '@/shared/components/ui/data-table/DataTableHelpers';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getLocalizedField } from '../../../../utils/localization';

/**
 * ProjectsTable Component
 * Refactored to use standardized DataTableHelpers for common column rendering.
 */
const ProjectsTable = ({ 
  projects, 
  onEdit, 
  onDelete,
  onViewHistory,
  onToggleVisibility,
  onToggleFeatured,
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
  paginationVariant = 'cursor',
  selection = null
}) => {
  const { language } = useTranslation();
  const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
  const formatProjectDate = (value) => {
    if (!value?.seconds) return { day: '-', time: '' };

    const date = new Date(value.seconds * 1000);
    return {
      day: new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date),
      time: new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit'
      }).format(date)
    };
  };

  const getDescription = (text = '') => {
    const normalized = String(getLocalizedField(text, language) || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return tr('No short description added yet.', 'មិនទាន់មានការពិពណ៌នាខ្លីនៅឡើយទេ។');
    return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
  };

  const getTechStack = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  };

  const columns = [
    {
      key: 'title',
      header: tr('Title', 'ចំណងជើង'),
      sortable: true,
      className: 'ui-table-cell--title',
      render: (row) => {
        const tags = getTechStack(row.techStack).slice(0, 4);

        return (
          <div className="ui-blog-tableTitle">
            <div className="ui-blog-tableTitle__main">{getLocalizedField(row.title, language) || tr('Untitled project', 'គម្រោងគ្មានចំណងជើង')}</div>
            <div className="ui-blog-tableTitle__meta">
              <span>/{row.slug || row.id}</span>
              <span>{getDescription(row.description)}</span>
            </div>
            {tags.length > 0 && (
              <div className="ui-blog-tableTitle__tags">
                {tags.map((tag) => (
                  <Badge key={`${row.id}-${tag}`} variant="default">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'visible',
      header: tr('Status', 'ស្ថានភាព'),
      sortable: true,
      render: (row) => (
        <div className="ui-blog-statusCell">
          <div className="ui-blog-statusCell__badges">
            <Badge variant={row.visible !== false ? 'success' : 'warning'}>
              {row.visible !== false ? tr('Live', 'បង្ហាញ') : tr('Hidden', 'លាក់')}
            </Badge>
            {row.featured && <Badge variant="primary">{tr('Featured', 'ពិសេស')}</Badge>}
          </div>
          <span className="ui-blog-statusCell__note">
            {row.liveUrl
              ? tr('Demo linked', 'មានតំណសាកល្បង')
              : row.githubUrl
                ? tr('Repository linked', 'មានតំណ Repository')
                : tr('No public links yet', 'មិនទាន់មានតំណសាធារណៈ')}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: tr('Date', 'កាលបរិច្ឆេទ'),
      sortable: true,
      render: (row) => {
        const formatted = formatProjectDate(row.createdAt);
        return (
          <div className="ui-blog-dateCell">
            <span className="ui-blog-dateCell__day">{formatted.day}</span>
            {formatted.time && <span className="ui-blog-dateCell__time">{formatted.time}</span>}
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
        onToggleFeatured,
        viewUrlPrefix: '/projects/',
        canEdit,
        canDelete,
        extraActions: (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewHistory(row)}
            title={tr('View History', 'មើលប្រវត្តិ')}
          >
            <History size={16} />
          </Button>
        )
      })
    }
  ];

  return (
    <DataTable 
      data={projects} 
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
      exportFileName="projects_export.csv"
      selection={selection}
      emptyState={{
        icon: Layout,
        title: tr('No Projects Yet', 'មិនទាន់មានគម្រោង'),
        description: tr('Start with a featured case study, import an existing portfolio export, or add the next project you want to showcase.', 'ចាប់ផ្តើមដោយករណីសិក្សា នាំចូលទិន្នន័យដែលមានស្រាប់ ឬបន្ថែមគម្រោងបន្ទាប់ដែលអ្នកចង់បង្ហាញ។'),
        action: canCreate ? {
          label: tr('Create first project', 'បង្កើតគម្រោងដំបូង'),
          onClick: onCreate,
          icon: Plus
        } : null
      }}
    />
  );
};

export default React.memo(ProjectsTable);

