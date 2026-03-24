import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Star, StarOff, Trash2, FileText, Globe2, Sparkles, PenSquare } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import BlogService from '../../../services/BlogService';
import BaseService from '../../../services/BaseService';
import { useActivity } from '../../../hooks/useActivity';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { Button } from '@/shared/components/ui';
import BlogToolbar from './components/BlogToolbar';
import BlogFormDialog from './components/BlogFormDialog';
import BlogTable from './components/BlogTable';
import DeleteConfirmDialog from '../../../shared/components/dialog/DeleteConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import ImportConfirmDialog from '../components/ImportConfirmDialog';
import { useCursorPagination } from '../../../hooks/useCursorPagination';
import { jsonToCsv, csvToJson } from '../../../utils/csvUtils';
import { slugify } from '../../../domain/shared/slugify';
import ImageProcessingService from '../../../services/ImageProcessingService';
import { useTranslation } from '../../../hooks/useTranslation';
import { getLanguageValue, getLocalizedField } from '../../../utils/localization';

const BlogTab = ({ userRole, showToast, isActionAllowed }) => {
  const { language, t } = useTranslation();
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [bulkConfirm, setBulkConfirm] = useState({ isOpen: false, ids: [] });
  const [importDialog, setImportDialog] = useState({
    isOpen: false,
    file: null,
    items: [],
    fileName: '',
    format: '',
    totalCount: 0,
    validCount: 0,
    skippedCount: 0
  });
  const [importLoading, setImportLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Cursor pagination hook
  const pagination = useCursorPagination(5, [searchQuery]);

  const { loading: formLoading, execute: executeForm } = useAsyncAction({
    showToast,
    successMessage: selectedPost ? t('admin.blog.messages.updated') : t('admin.blog.messages.created'),
    invalidateKeys: [['posts']],
    onSuccess: () => setIsFormOpen(false)
  });

  const { loading: deleteLoading, execute: executeDelete } = useAsyncAction({
    showToast,
    successMessage: t('admin.blog.messages.deleted'),
    invalidateKeys: [['posts']],
    onSuccess: () => setIsDeleteOpen(false)
  });
  const { trackRead, trackWrite, trackDelete } = useActivity();

  // Reset page on search
  const handleSearch = (val) => {
    setSearchQuery(val);
    setSelectedPosts([]);
    pagination.reset();
  };

  // Queries
  const { data: postsResult = { data: [], lastDoc: null, hasMore: false, totalCount: null }, isLoading } = useQuery({
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    queryKey: ['posts', searchQuery, pagination.cursor, pagination.limit],
    queryFn: async () => {
      const requestCursor = pagination.cursor;
      const result = await BaseService.safe(() => BlogService.fetchPaginated({
        lastDoc: requestCursor,
        limit: pagination.limit,
        search: searchQuery,
        searchField: 'title.en',
        sortBy: "createdAt",
        sortDirection: "desc",
        includeTotal: true,
        trackRead
      }));

      if (result.error) {
        showToast(result.error, 'error');
        return { data: [], lastDoc: null, hasMore: false, totalCount: null };
      }

      pagination.updateAfterFetch(requestCursor, result.data.lastDoc, result.data.hasMore);
      return result.data;
    }
  });

  const posts = postsResult.data;
  const tablePosts = useMemo(() => posts.map((post) => ({
    ...post,
    __raw: post,
    title: getLocalizedField(post.title, language),
    excerpt: getLocalizedField(post.excerpt, language),
    content: getLocalizedField(post.content, language)
  })), [posts, language]);
  const visiblePostsCount = posts.filter((post) => post.visible !== false).length;
  const featuredPostsCount = posts.filter((post) => !!post.featured).length;
  const draftPostsCount = posts.length - visiblePostsCount;
  const workspaceStats = [
    {
      label: t('admin.common.stats.onThisPage.label'),
      value: posts.length,
      hint: t('admin.common.stats.onThisPage.hint'),
      icon: FileText
    },
    {
      label: t('admin.common.stats.published.label'),
      value: visiblePostsCount,
      hint: t('admin.blog.stats.published.hint'),
      icon: Globe2
    },
    {
      label: t('admin.common.stats.featured.label'),
      value: featuredPostsCount,
      hint: t('admin.blog.stats.featured.hint'),
      icon: Sparkles
    },
    {
      label: t('admin.blog.stats.drafts.label'),
      value: draftPostsCount,
      hint: t('admin.blog.stats.drafts.hint'),
      icon: PenSquare
    }
  ];

  // Handlers
  // Permission Booleans
  const canCreate = isActionAllowed('create', 'blog');
  const canEdit = isActionAllowed('edit', 'blog');
  const canDelete = isActionAllowed('delete', 'blog');

  const handleCreate = () => {
    if (!canCreate) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    setSelectedPost(null);
    setIsFormOpen(true);
  };

  const handleEdit = (post) => {
    if (!isActionAllowed('edit', 'blog')) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    const source = post.__raw || post;
    setSelectedPost({
      ...source,
      tags: Array.isArray(source.tags) ? source.tags.join(', ') : (source.tags || '')
    });
    setIsFormOpen(true);
  };

  const handleDelete = (post) => {
    if (!isActionAllowed('delete', 'blog')) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    setSelectedPost(post.__raw || post);
    setIsDeleteOpen(true);
  };

  // Selection Handlers
  const handleToggleSelectPost = (id) => {
    setSelectedPosts(prev =>
        prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleSelectAllPosts = () => {
    const paginatedIds = posts.map(p => p.id);
    const allSelected = paginatedIds.length > 0 && paginatedIds.every(id => selectedPosts.includes(id));
    
    if (allSelected) {
      setSelectedPosts(prev => prev.filter(id => !paginatedIds.includes(id)));
    } else {
      setSelectedPosts(prev => {
        const newSelections = paginatedIds.filter(id => !prev.includes(id));
        return [...prev, ...newSelections];
      });
    }
  };
  
  // Mutations with Optimistic Updates
  const visibilityMutation = useMutation({
    mutationFn: ({ id, currentVisible }) => 
      BlogService.toggleVisibility(userRole, id, currentVisible, trackWrite),
    onMutate: async ({ id, currentVisible }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts', searchQuery, pagination.cursor, pagination.limit]);
      
      if (previousPosts) {
        queryClient.setQueryData(['posts', searchQuery, pagination.cursor, pagination.limit], {
          ...previousPosts,
          data: previousPosts.data.map(p => 
            p.id === id ? { ...p, visible: !currentVisible } : p
          )
        });
      }
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', searchQuery, pagination.cursor, pagination.limit], context.previousPosts);
      }
      showToast(err?.message || 'Failed to update visibility', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onSuccess: (_, variables) => {
      showToast(
        !variables.currentVisible
          ? t('admin.blog.messages.published')
          : t('admin.blog.messages.hidden')
      );
    }
  });

  const featuredMutation = useMutation({
    mutationFn: ({ id, currentFeatured }) => 
      BlogService.toggleFeatured(userRole, id, currentFeatured, trackWrite),
    onMutate: async ({ id, currentFeatured }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts', searchQuery, pagination.cursor, pagination.limit]);
      
      if (previousPosts) {
        queryClient.setQueryData(['posts', searchQuery, pagination.cursor, pagination.limit], {
          ...previousPosts,
          data: previousPosts.data.map(p => 
            p.id === id ? { ...p, featured: !currentFeatured } : p
          )
        });
      }
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', searchQuery, pagination.cursor, pagination.limit], context.previousPosts);
      }
      showToast(err?.message || 'Failed to update featured status', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onSuccess: (_, variables) => {
      showToast(
        !variables.currentFeatured
          ? t('admin.blog.messages.featured')
          : t('admin.blog.messages.unfeatured')
      );
    }
  });

  const handleToggleVisibility = (id, currentVisible) => {
    if (!canEdit) return showToast(t('admin.common.noPermissionAction'), "error");
    visibilityMutation.mutate({ id, currentVisible });
  };

  const handleToggleFeatured = (id, currentFeatured) => {
    if (!canEdit) return showToast(t('admin.common.noPermissionAction'), "error");
    featuredMutation.mutate({ id, currentFeatured });
  };

  // Bulk Actions Mutations
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => BlogService.batchDeletePosts(userRole, ids, trackDelete),
    onSuccess: (_, ids) => {
      showToast(t('admin.blog.messages.deletedMany', { count: ids.length }));
      setSelectedPosts([]);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => showToast(err?.message || 'Failed to delete posts', 'error')
  });

  const bulkVisibilityMutation = useMutation({
    mutationFn: ({ ids, visible }) => BlogService.batchUpdatePostsVisibility(userRole, ids, visible, trackWrite),
    onSuccess: (_, { ids, visible }) => {
      showToast(
        visible
          ? t('admin.blog.messages.publishedMany', { count: ids.length })
          : t('admin.blog.messages.hiddenMany', { count: ids.length })
      );
      setSelectedPosts([]);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => showToast(err?.message || 'Failed to update posts', 'error')
  });

  const bulkFeaturedMutation = useMutation({
    mutationFn: ({ ids, featured }) => BlogService.batchUpdatePostsFeatured(userRole, ids, featured, trackWrite),
    onSuccess: (_, { ids, featured }) => {
      showToast(
        featured
          ? t('admin.blog.messages.featuredMany', { count: ids.length })
          : t('admin.blog.messages.unfeaturedMany', { count: ids.length })
      );
      setSelectedPosts([]);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => showToast(err?.message || 'Failed to update posts', 'error')
  });

  const handleBulkDelete = () => {
    if (selectedPosts.length === 0) return;
    setBulkConfirm({
        isOpen: true,
        ids: selectedPosts
    });
  };

  const handleBulkVisibility = (visible) => {
    if (selectedPosts.length === 0) return;
    bulkVisibilityMutation.mutate({ ids: selectedPosts, visible });
  };

  const handleBulkFeatured = (featured) => {
    if (selectedPosts.length === 0) return;
    bulkFeaturedMutation.mutate({ ids: selectedPosts, featured });
  };

  const handleViewHistory = (post) => {
    setSelectedPost(post.__raw || post);
    setIsHistoryOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (!isActionAllowed(selectedPost ? 'edit' : 'create', 'blog')) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }
    
    await executeForm(async () => {
      let coverImage = formData.coverImage || '';
      if (formData.image instanceof File) {
        coverImage = await ImageProcessingService.compress(formData.image);
      }

      const { image: _image, ...rest } = formData;
      const action = selectedPost ? 'updated' : 'created';
      await BlogService.savePost(userRole, { ...rest, coverImage, id: selectedPost?.id }, (count, label) => 
        trackWrite(count, label, {
          action,
          module: 'blog',
          entityId: selectedPost?.id || 'new',
          entityName: formData.titleEn
        })
      );
    });
  };

  const parseBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
      if (['false', '0', 'no', 'n'].includes(normalized)) return false;
    }
    return fallback;
  };

  const readImportFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result || '');
    reader.onerror = () => reject(new Error('Failed to read import file.'));
    reader.readAsText(file);
  });

  const parseImportItems = (fileName, content) => {
    let parsed = [];

    if (fileName.toLowerCase().endsWith('.csv')) {
      parsed = csvToJson(content);
    } else {
      parsed = JSON.parse(content);
    }

    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed;
  };

  const downloadJson = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportPosts = async (file) => {
    if (!canCreate && !canEdit) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }

    try {
      const content = await readImportFile(file);
      const items = parseImportItems(file.name, content);
      const validCount = items.filter((item) => getLanguageValue(item?.title, 'en', true) || item?.titleEn).length;
      const skippedCount = items.length - validCount;

      setImportDialog({
        isOpen: true,
        file,
        items,
        fileName: file.name,
        format: file.name.toLowerCase().endsWith('.csv') ? 'CSV' : 'JSON',
        totalCount: items.length,
        validCount,
        skippedCount
      });
    } catch (error) {
      showToast(error?.message || 'Failed to import posts.', 'error');
    }
  };

  const handleConfirmImportPosts = async () => {
    if (!importDialog.items.length) return;

    setImportLoading(true);
    try {
      let created = 0;
      let updated = 0;
      let skipped = 0;
      let failed = 0;

      for (const item of importDialog.items) {
        try {
          const titleEn = (item?.titleEn || getLanguageValue(item?.title, 'en', true) || '').trim();
          if (!titleEn) {
            skipped += 1;
            continue;
          }
          const normalizedSlug = item.slug ? slugify(item.slug) : slugify(titleEn);
          const tags = Array.isArray(item.tags)
            ? item.tags.join(', ')
            : (item.tags || '');
          const titleKm = (item?.titleKm || getLanguageValue(item?.title, 'km', false) || '').trim();
          const excerptEn = (item?.excerptEn || getLanguageValue(item?.excerpt, 'en', true) || '').trim();
          const excerptKm = (item?.excerptKm || getLanguageValue(item?.excerpt, 'km', false) || '').trim();
          const contentEn = (item?.contentEn || getLanguageValue(item?.content, 'en', true) || '').trim();
          const contentKm = (item?.contentKm || getLanguageValue(item?.content, 'km', false) || '').trim();

          const existing = await BlogService.fetchPostBySlug(normalizedSlug, null, true);
          const payload = {
            id: existing?.id || null,
            titleEn,
            titleKm,
            slug: normalizedSlug,
            excerptEn,
            excerptKm,
            contentEn,
            contentKm,
            tags,
            coverImage: item.coverImage || '',
            featured: parseBoolean(item.featured, false),
            visible: parseBoolean(item.visible, true)
          };

          await BlogService.savePost(userRole, payload, trackWrite);
          if (existing?.id) updated += 1;
          else created += 1;
        } catch {
          failed += 1;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setImportDialog({
        isOpen: false,
        file: null,
        items: [],
        fileName: '',
        format: '',
        totalCount: 0,
        validCount: 0,
        skippedCount: 0
      });
      showToast(
        t('admin.blog.messages.importComplete', { created, updated, skipped, failed }),
        failed > 0 || skipped > 0 ? 'warning' : 'success'
      );
    } catch (error) {
      showToast(error?.message || 'Failed to import posts.', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportSelectedPosts = () => {
    if (selectedPosts.length === 0) {
      return showToast(t('admin.blog.messages.selectToExport'), 'warning');
    }

    const selected = posts.filter(post => selectedPosts.includes(post.id));
    if (selected.length === 0) {
      return showToast(t('admin.blog.messages.selectedNotInPage'), 'warning');
    }

    downloadJson(selected, `blog_export_selected_${new Date().toISOString().split('T')[0]}.json`);
    showToast(t('admin.blog.messages.exportedMany', { count: selected.length }));
  };

  const handleDownloadBlogJsonTemplate = () => {
    const template = [{
      title: { en: 'Sample Blog Post', km: '' },
      slug: 'sample-blog-post',
      excerpt: { en: 'A short summary for the list view.', km: '' },
      content: { en: '# Your Content Here\\nThis is sample markdown content.', km: '' },
      tags: ['React', 'Tutorial'],
      featured: false,
      visible: true
    }];

    downloadJson(template, 'blog_template.json');
  };

  const handleDownloadBlogCsvTemplate = () => {
    const template = [{
      titleEn: 'Sample Blog Post',
      titleKm: '',
      slug: 'sample-blog-post',
      excerptEn: 'A short summary for the list view.',
      excerptKm: '',
      contentEn: '# Your Content Here\\nThis is sample markdown content.',
      contentKm: '',
      tags: 'React, Tutorial',
      featured: 'false',
      visible: 'true'
    }];

    const csvData = jsonToCsv(template, ['titleEn', 'titleKm', 'slug', 'excerptEn', 'excerptKm', 'contentEn', 'contentKm', 'tags', 'featured', 'visible']);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'blog_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPost?.id) return;
    if (!isActionAllowed('delete', 'blog')) {
      return showToast(t('admin.common.noPermissionAction'), "error");
    }

    await executeDelete(async () => {
      await BlogService.deletePost(userRole, selectedPost.id, (count, label) => 
        trackDelete(count, label, {
          action: 'deleted',
          module: 'blog',
          entityId: selectedPost.id,
          entityName: getLocalizedField(selectedPost.title, 'en')
        })
      );
    });
  };


  return (
    <div className="admin-tab-container">
      <BlogToolbar
        onCreate={handleCreate}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        canCreate={canCreate}
        canBulkManage={canCreate || canEdit}
        selectedCount={selectedPosts.length}
        stats={workspaceStats}
        onImportFile={handleImportPosts}
        onExportSelected={handleExportSelectedPosts}
        onDownloadTemplateCSV={handleDownloadBlogCsvTemplate}
        onDownloadTemplateJSON={handleDownloadBlogJsonTemplate}
      />

      {selectedPosts.length > 0 && (
        <div className="ui-bulk-actions-bar">
          <div className="ui-bulk-actions-summary">
            <div className="ui-bulk-actions-count">
              {selectedPosts.length}
            </div>
            <span className="ui-bulk-actions-text">
              {t('admin.blog.bulk.selected')}
            </span>
          </div>

          <div className="ui-bulk-actions-controls">
            <Button variant="ghost" size="sm" onClick={() => handleBulkVisibility(true)} title={t('admin.blog.bulk.publishSelected')}>
              <Eye size={16} style={{ marginRight: '0.4rem' }} /> {t('admin.blog.bulk.publish')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkVisibility(false)} title={t('admin.blog.bulk.hideSelected')}>
              <EyeOff size={16} style={{ marginRight: '0.4rem' }} /> {t('admin.blog.bulk.hide')}
            </Button>
            <div className="ui-bulk-divider" />
            <Button variant="ghost" size="sm" onClick={() => handleBulkFeatured(true)} title={t('admin.blog.bulk.featureSelected')}>
              <Star size={16} style={{ marginRight: '0.4rem' }} /> {t('admin.blog.bulk.feature')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkFeatured(false)} title={t('admin.blog.bulk.unfeatureSelected')}>
              <StarOff size={16} style={{ marginRight: '0.4rem' }} /> {t('admin.blog.bulk.unfeature')}
            </Button>
            <div className="ui-bulk-divider" />
            <Button variant="danger" size="sm" onClick={handleBulkDelete} title={t('admin.blog.bulk.deleteSelected')}>
              <Trash2 size={16} style={{ marginRight: '0.4rem' }} /> {t('admin.common.delete')}
            </Button>
          </div>
        </div>
      )}

      <BlogTable
        posts={tablePosts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleVisibility={handleToggleVisibility}
        onToggleFeatured={handleToggleFeatured}
        onViewHistory={handleViewHistory}
        onCreate={handleCreate}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        loading={isLoading || bulkDeleteMutation.isPending || bulkVisibilityMutation.isPending || bulkFeaturedMutation.isPending}
        page={pagination.page}
        pageSize={pagination.limit}
        totalItems={postsResult.totalCount}
        hasMore={postsResult.hasMore}
        isFirstPage={pagination.isFirstPage}
        onNext={() => pagination.fetchNext(postsResult.lastDoc)}
        onPrevious={pagination.fetchPrevious}
        onPageChange={(page, size) => {
          if (size !== pagination.limit) {
            pagination.handlePageSizeChange(size);
          }
        }}
        selection={{
          selectedIds: selectedPosts,
          onSelect: handleToggleSelectPost,
          onSelectAll: handleSelectAllPosts
        }}
      />

      {/* Dialogs */}
      <BlogFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={selectedPost ? 'edit' : 'create'}
        initialData={selectedPost}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      />

      <DeleteConfirmDialog 
        open={isDeleteOpen} 
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title={t('admin.blog.dialogs.deleteTitle')}
        message={t('admin.blog.dialogs.deleteMessage', {
          title: getLocalizedField(selectedPost?.title, language)
        })}
      />

      <DeleteConfirmDialog 
        open={bulkConfirm.isOpen} 
        onOpenChange={(open) => !open && setBulkConfirm({ ...bulkConfirm, isOpen: false })}
        onConfirm={() => {
            bulkDeleteMutation.mutate(bulkConfirm.ids);
            setBulkConfirm({ ...bulkConfirm, isOpen: false });
        }}
        loading={bulkDeleteMutation.isPending}
        title={t('admin.blog.dialogs.deleteManyTitle')}
        message={t('admin.blog.dialogs.deleteManyMessage', { count: bulkConfirm.ids.length })}
      />

      <ImportConfirmDialog
        open={importDialog.isOpen}
        onOpenChange={(open) => !open && !importLoading && setImportDialog({
          isOpen: false,
          file: null,
          items: [],
          fileName: '',
          format: '',
          totalCount: 0,
          validCount: 0,
          skippedCount: 0
        })}
        onConfirm={handleConfirmImportPosts}
        loading={importLoading}
        title={t('admin.blog.import.title')}
        description={t('admin.blog.import.description')}
        fileName={importDialog.fileName}
        format={importDialog.format}
        stats={[
          { label: t('admin.common.import.rowsFound'), value: importDialog.totalCount },
          { label: t('admin.common.import.readyToImport'), value: importDialog.validCount },
          { label: t('admin.common.import.skipped'), value: importDialog.skippedCount }
        ]}
        notes={[
          t('admin.blog.import.noteMissingTitle'),
          t('admin.blog.import.noteSlug')
        ]}
        confirmText={t('admin.common.import.runImport')}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        recordId={selectedPost?.id}
        service={BlogService}
        title={getLocalizedField(selectedPost?.title, language)}
      />
    </div>
  );
};

export default BlogTab;
