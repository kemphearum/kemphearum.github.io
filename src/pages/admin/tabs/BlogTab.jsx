import React, { useState, useCallback, useMemo } from 'react';
import { Search, Eye, EyeOff, Edit2, Trash2, Star, ExternalLink, X, Bold, Italic, Link as LinkIcon, Code, Upload, Save, Plus, ArrowLeft } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sortData } from '../../../utils/sortData';
import { icons } from '../components/constants';
import ImageProcessingService from '../../../services/ImageProcessingService';
import MarkdownRenderer from '../../../components/MarkdownRenderer';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import styles from '../../Admin.module.scss';
import BlogService from '../../../services/BlogService';
import ConfirmDialog from '../components/ConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import BaseModal from '../components/BaseModal';
import { History } from 'lucide-react';
import FormRow from '../components/FormRow';
import FormInput from '../components/FormInput';
import FormMarkdownEditor from '../components/FormMarkdownEditor';
import FormDropzone from '../components/FormDropzone';

const BlogTab = ({ userRole, showToast }) => {
    const [post, setPost] = useState({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false });
    const [postImage, setPostImage] = useState(null);
    const [showPostForm, setShowPostForm] = useState(false);
    const [viewingPost, setViewingPost] = useState(null);
    const [searchPosts, setSearchPosts] = useState('');
    const [postPage, setPostPage] = useState(1);
    const [postPerPage, setPostPerPage] = useState(10);
    const [postSort, setPostSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [isBlogPreviewMode, setIsBlogPreviewMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    const [historyModal, setHistoryModal] = useState({ isOpen: false, recordId: null, title: '' });
    const { trackRead, trackWrite, trackDelete } = useActivity();
    const queryClient = useQueryClient();

    const { data: posts = [], isLoading: postsLoading } = useQuery({
        queryKey: ['posts'],
        queryFn: async () => {
            const allPosts = await BlogService.getAll("createdAt", "desc");
            trackRead(allPosts.length, 'Fetched blog posts');
            return allPosts;
        }
    });

    const handlePostSort = useCallback((field) => {
        setPostSort(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
        setPostPage(1);
    }, []);

    const filteredPosts = useMemo(() => {
        let result = posts;
        if (searchPosts) {
            const lower = searchPosts.toLowerCase();
            result = result.filter(p =>
                (p.title && p.title.toLowerCase().includes(lower)) ||
                (p.excerpt && p.excerpt.toLowerCase().includes(lower))
            );
        }
        return sortData(result, postSort);
    }, [posts, searchPosts, postSort]);

    const postTotalPages = Math.ceil(filteredPosts.length / postPerPage) || 1;
    const paginatedPosts = useMemo(() => {
        const start = (postPage - 1) * postPerPage;
        return filteredPosts.slice(start, start + postPerPage);
    }, [filteredPosts, postPage, postPerPage]);

    const generateSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const toggleVisibility = async (id, currentVisible) => {
        try {
            await BlogService.toggleVisibility(userRole, id, currentVisible, trackWrite);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            showToast(`Post ${!currentVisible ? 'published' : 'set to draft'}.`);
        } catch (error) {
            showToast(error.message || 'Failed to toggle visibility.', 'error');
        }
    };

    const toggleFeaturedPost = async (id, currentFeatured) => {
        try {
            await BlogService.toggleFeatured(userRole, id, currentFeatured, trackWrite);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            showToast(!currentFeatured ? 'Featured on homepage!' : 'Removed from homepage.');
        } catch (error) {
            showToast(error.message || 'Failed to toggle featured status.', 'error');
        }
    };

    const handleDeletePost = (id) => {
        if (userRole === 'pending' || userRole === 'editor') {
            showToast("Not authorized to delete posts.", "error");
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Delete Post',
            message: 'Are you sure you want to delete this blog post? This action cannot be undone.',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                setLoading(true);
                try {
                    await BlogService.deletePost(userRole, id, trackDelete);
                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                    queryClient.invalidateQueries({ queryKey: ['history'] });
                    showToast('Post deleted.');
                } catch (error) {
                    showToast(error.message || 'Failed to delete post.', 'error');
                } finally {
                    setLoading(false);
                    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
                }
            }
        });
    };

    const handleSavePost = async (e) => {
        e.preventDefault();
        if (userRole === 'pending') { showToast("Not authorized.", "error"); return; }
        setLoading(true);
        try {
            let coverImage = post.coverImage || '';
            if (postImage) coverImage = await ImageProcessingService.compress(postImage);
            const tagsArray = typeof post.tags === 'string' ? post.tags.split(',').map(t => t.trim()).filter(t => t) : (Array.isArray(post.tags) ? post.tags : []);
            const slug = post.slug || generateSlug(post.title);

            const postData = { title: post.title, slug, excerpt: post.excerpt, content: post.content, coverImage, tags: tagsArray, visible: post.visible !== false, featured: !!post.featured };
            if (post.id) {
                await BlogService.update(post.id, postData, trackWrite);
                showToast('Post updated!');
            } else {
                // postData.createdAt = serverTimestamp(); // Assuming server handles this
                await BlogService.create(postData, trackWrite);
                showToast('Post published!');
            }
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['history'] });
            setPost({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false });
            setPostImage(null);
            setIsBlogPreviewMode(false);
            setShowPostForm(false);
        } catch (error) { showToast(error.message || 'Error saving post.', 'error'); }
        finally { setLoading(false); }
    };

    const insertMarkdown = (syntax) => {
        const textarea = document.getElementById('blog-markdown-editor');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = post.content;
        const selectedText = text.substring(start, end);
        let newText;
        switch (syntax) {
            case 'bold': newText = text.substring(0, start) + `**${selectedText || 'bold text'}**` + text.substring(end); break;
            case 'italic': newText = text.substring(0, start) + `*${selectedText || 'italic text'}*` + text.substring(end); break;
            case 'link': newText = text.substring(0, start) + `[${selectedText || 'Link text'}](url)` + text.substring(end); break;
            case 'code': newText = text.substring(0, start) + `\n\`\`\`\n${selectedText || 'code here'}\n\`\`\`\n` + text.substring(end); break;
            default: return;
        }
        setPost({ ...post, content: newText });
        setTimeout(() => { textarea.focus(); }, 0);
    };

    const editingPost = !!post.id;

    return (
        <div className={styles.section} style={{ paddingBottom: '4rem' }}>
            {!showPostForm ? (
                <div className={styles.listSection} style={{ marginTop: '0' }}>
                    <div className={styles.listSectionHeader}>
                        <h3 className={styles.listTitle}>Published Posts</h3>
                        <button onClick={() => { setPost({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false }); setPostImage(null); setIsBlogPreviewMode(false); setShowPostForm(true); }} className={styles.addBtn}>
                            <Plus size={18} /> Add New
                        </button>
                    </div>
                    <div className={styles.searchBox}>
                        <Search size={16} className={styles.searchIcon} />
                        <input type="text" placeholder="Search by title or excerpt..." value={searchPosts} onChange={(e) => { setSearchPosts(e.target.value); setPostPage(1); }} />
                        {searchPosts && <span className={styles.searchResultCount}>{filteredPosts.length} of {posts.length}</span>}
                    </div>
                    {filteredPosts.length === 0 ? (
                        <div className={styles.emptyState}>{searchPosts ? 'No matching posts found.' : 'No posts yet.'}</div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 1.5rem', background: 'var(--editor-toolbar-bg, var(--card-bg))', border: '1px solid var(--editor-border, var(--divider))', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <SortableHeader label="Title" field="title" sortField={postSort.field} sortDirection={postSort.dir} onSort={handlePostSort} />
                                <SortableHeader label="Date" field="createdAt" sortField={postSort.field} sortDirection={postSort.dir} onSort={handlePostSort} />
                                <SortableHeader label="Status" field="visible" sortField={postSort.field} sortDirection={postSort.dir} onSort={handlePostSort} />
                                <SortableHeader label="Featured" field="featured" sortField={postSort.field} sortDirection={postSort.dir} onSort={handlePostSort} />
                            </div>
                            {paginatedPosts.map((p, index) => (
                                <div key={p.id || `post-${index}`} className={`${styles.listItem} ${styles.clickableRow}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.75rem', borderRadius: '12px', cursor: 'pointer' }} onClick={() => setViewingPost(p)}>
                                    <div className={styles.itemInfo}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{p.title}</h4>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{p.excerpt}</p>
                                        <div className={styles.meta} style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <span className={styles.date}>{p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                            <span style={{ marginLeft: '1rem', color: p.visible ? 'var(--primary-color)' : '#ff9800' }}>{p.visible ? 'Published' : 'Draft'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.itemActions} style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={(e) => { e.stopPropagation(); window.open(`#/blog/${p.slug}`, '_blank'); }} title="View" className={styles.editBtn}><ExternalLink size={16} /></button>
                                        {userRole !== 'editor' && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); toggleFeaturedPost(p.id, p.featured); }} title={p.featured ? "Unfeature" : "Feature"} className={styles.editBtn}>
                                                    <Star size={16} fill={p.featured ? "currentColor" : "none"} style={{ color: p.featured ? '#FFD700' : 'inherit' }} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); toggleVisibility(p.id, p.visible); }} title={p.visible ? "Hide" : "Show"} className={styles.editBtn}>
                                                    {p.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                            </>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setHistoryModal({ isOpen: true, recordId: p.id, title: p.title }); }} className={styles.editBtn} title="View Edit History"><History size={16} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setPost(p); setShowPostForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Edit" className={styles.editBtn}><Edit2 size={16} /></button>
                                        {userRole !== 'editor' && <button onClick={(e) => { e.stopPropagation(); handleDeletePost(p.id); }} className={styles.deleteBtn} title="Delete"><Trash2 size={16} /></button>}
                                    </div>
                                </div>
                            ))}
                            <Pagination currentPage={postPage} totalPages={postTotalPages} onPageChange={setPostPage} perPage={postPerPage} onPerPageChange={(v) => { setPostPerPage(v); setPostPage(1); }} totalItems={filteredPosts.length} />
                        </>
                    )}
                </div>
            ) : (
                <div className={styles.card}>
                    <div className={styles.cardHeader} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>{editingPost ? <Edit2 size={24} /> : <Plus size={24} />} {editingPost ? 'Edit Post' : 'New Blog Post'}</h3>
                        <button onClick={() => { setPost({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false }); setPostImage(null); setIsBlogPreviewMode(false); setShowPostForm(false); }} className={styles.cancelBtn} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowLeft size={18} /> Cancel & Return
                        </button>
                    </div>
                    <form onSubmit={handleSavePost} className={styles.form}>
                        <FormRow>
                            <FormInput
                                label="Post Title"
                                placeholder="e.g. My First Blog Post"
                                value={post.title}
                                onChange={(e) => setPost({ ...post, title: e.target.value })}
                                required
                            />
                            <FormInput
                                label="Slug (URL)"
                                hint="leave empty to auto-generate"
                                placeholder="my-first-post"
                                value={post.slug || ''}
                                onChange={(e) => setPost({ ...post, slug: e.target.value })}
                            />
                        </FormRow>

                        <FormInput
                            label="Short Excerpt"
                            placeholder="A brief summary of the post..."
                            value={post.excerpt}
                            onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                            required
                            fullWidth
                            isTextArea
                            rows="2"
                        />

                        <FormMarkdownEditor
                            label="Post Content (Markdown)"
                            id="blog-markdown-editor"
                            value={post.content || ''}
                            onChange={(e) => setPost({ ...post, content: e.target.value })}
                            rows="15"
                            isPreviewMode={isBlogPreviewMode}
                            onTogglePreview={() => setIsBlogPreviewMode(!isBlogPreviewMode)}
                            onInsertMarkdown={insertMarkdown}
                            required
                        />

                        <FormInput
                            label="Tags"
                            hint="comma separated"
                            placeholder="React, Tutorial, WebDev"
                            value={Array.isArray(post.tags) ? post.tags.join(', ') : post.tags}
                            onChange={(e) => setPost({ ...post, tags: e.target.value })}
                            fullWidth
                        />

                        <FormDropzone
                            label="Cover Image"
                            hint={editingPost ? "leave empty to keep current" : ""}
                            file={postImage}
                            onFileChange={setPostImage}
                            currentImageUrl={post.coverImage}
                        />

                        <div className={styles.formFooter}>
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Blog Details Modal */}
            <BaseModal
                isOpen={!!viewingPost}
                onClose={() => setViewingPost(null)}
                zIndex={1200}
                maxWidth="800px"
                contentStyle={{ borderRadius: '20px' }}
                headerStyle={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem 2rem' }}
                headerContent={
                    <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {icons.blog || '📝'} Post Details
                    </h3>
                }
                bodyStyle={{ padding: 0 }}
                footerStyle={{ padding: '1.25rem 2rem' }}
                footerContent={
                    <button onClick={() => setViewingPost(null)} className={styles.primaryBtn} style={{ margin: 0 }}>Close Preview</button>
                }
            >
                <div style={{ padding: '2rem', overflowY: 'auto', maxHeight: '75vh' }}>
                    <div className={styles.detailGrid} style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                            <span className={styles.detailLabel}>Title</span>
                            <span className={styles.detailValue} style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-color)' }}>{viewingPost?.title}</span>
                        </div>
                        <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                            <span className={styles.detailLabel}>Excerpt</span>
                            <span className={styles.detailValue} style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{viewingPost?.excerpt}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Status</span>
                            <span className={styles.detailValue} style={{ color: viewingPost?.visible ? '#10b981' : '#f59e0b', fontWeight: '600' }}>{viewingPost?.visible ? 'Published' : 'Draft Mode'}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Published Date</span>
                            <span className={styles.detailValue}>{viewingPost?.createdAt?.seconds ? new Date(viewingPost.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Pending publication'}</span>
                        </div>
                        <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                            <span className={styles.detailLabel}>Tags</span>
                            <div className={styles.techTags} style={{ marginTop: '0.6rem' }}>
                                {(Array.isArray(viewingPost?.tags) ? viewingPost.tags : (viewingPost?.tags ? viewingPost.tags.split(',') : [])).map((t, i) => t.trim() && (
                                    <span key={`${t.trim()}-${i}`} className={styles.techTag} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}>{t.trim()}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {viewingPost?.coverImage && (
                        <div style={{ marginBottom: '2rem', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                            <img src={viewingPost.coverImage} alt="Cover" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover' }} />
                        </div>
                    )}

                    <div style={{ background: 'rgba(255,255,255,0.015)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)' }}>
                        <MarkdownRenderer content={viewingPost?.content || '*No extended content provided...*'} />
                    </div>
                </div>
            </BaseModal>


            {/* History Modal */}
            <HistoryModal
                isOpen={historyModal.isOpen}
                onClose={() => setHistoryModal({ isOpen: false, recordId: null, title: '' })}
                recordId={historyModal.recordId}
                service={BlogService}
                title={historyModal.title}
            />

            {/* Confirm Dialog */}
            {confirmDialog.isOpen && (
                <ConfirmDialog
                    confirmDialog={confirmDialog}
                    setConfirmDialog={setConfirmDialog}
                />
            )}
        </div>
    );
};

export default BlogTab;
