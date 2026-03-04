import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { Search, Eye, EyeOff, Edit2, Trash2, Star, ExternalLink, X, Bold, Italic, Link as LinkIcon, Code, Upload, Save, Plus, ArrowLeft } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { invalidateCache } from '../../../hooks/useFirebaseData';
import { sortData } from '../../../utils/sortData';
import { icons } from '../components/constants';
import { compressImageToBase64 } from '../../../utils/imageCompression';
import MarkdownRenderer from '../../../components/MarkdownRenderer';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import styles from '../../Admin.module.scss';

const BlogTab = ({ userRole, showToast }) => {
    const [posts, setPosts] = useState([]);
    const [postForm, setPostForm] = useState({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false });
    const [postImage, setPostImage] = useState(null);
    const [showPostForm, setShowPostForm] = useState(false);
    const [viewingPost, setViewingPost] = useState(null);
    const [searchPosts, setSearchPosts] = useState('');
    const [postPage, setPostPage] = useState(1);
    const [postPerPage, setPostPerPage] = useState(10);
    const [postSort, setPostSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const { trackRead, trackWrite, trackDelete } = useActivity();

    const handlePostSort = useCallback((field) => {
        setPostSort(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
        setPostPage(1);
    }, []);

    const fetchPosts = useCallback(async () => {
        try {
            const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            trackRead(querySnapshot.size, 'Fetched blog posts');
            setPosts(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) { console.error("Error fetching posts:", error); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

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
        if (userRole === 'pending') { showToast("Not authorized.", "error"); return; }
        try {
            await updateDoc(doc(db, 'posts', id), { visible: !currentVisible });
            trackWrite(1, 'Toggled post visibility');
            invalidateCache('collection:posts');
            setPosts(prev => prev.map(p => p.id === id ? { ...p, visible: !currentVisible } : p));
            showToast(`Post ${!currentVisible ? 'published' : 'set to draft'}.`);
        } catch { showToast('Failed to toggle visibility.', 'error'); }
    };

    const toggleFeaturedPost = async (id, currentFeatured) => {
        if (userRole === 'pending' || userRole === 'editor') { showToast("Not authorized.", "error"); return; }
        try {
            await updateDoc(doc(db, 'posts', id), { featured: !currentFeatured });
            trackWrite(1, 'Toggled post featured');
            invalidateCache('collection:posts');
            setPosts(prev => prev.map(p => p.id === id ? { ...p, featured: !currentFeatured } : p));
            showToast(!currentFeatured ? 'Featured on homepage!' : 'Removed from homepage.');
        } catch { showToast('Failed to toggle featured status.', 'error'); }
    };

    const handleDeletePost = async (id) => {
        if (userRole === 'pending' || userRole === 'editor') { showToast("Not authorized.", "error"); return; }
        if (!window.confirm("Delete this post?")) return;
        try {
            await deleteDoc(doc(db, "posts", id));
            trackDelete(1, 'Deleted blog post');
            invalidateCache('collection:posts');
            setPosts(posts.filter(p => p.id !== id));
            showToast('Post deleted.');
        } catch { showToast('Failed to delete post.', 'error'); }
    };

    const handleSavePost = async (e) => {
        e.preventDefault();
        if (userRole === 'pending') { showToast("Not authorized.", "error"); return; }
        setLoading(true);
        try {
            let coverImage = postForm.coverImage || '';
            if (postImage) coverImage = await compressImageToBase64(postImage);
            const tagsArray = typeof postForm.tags === 'string' ? postForm.tags.split(',').map(t => t.trim()).filter(t => t) : (Array.isArray(postForm.tags) ? postForm.tags : []);
            const slug = postForm.slug || generateSlug(postForm.title);

            if (postForm.id) {
                await updateDoc(doc(db, "posts", postForm.id), { title: postForm.title, slug, excerpt: postForm.excerpt, content: postForm.content, coverImage, tags: tagsArray, visible: postForm.visible !== false, featured: !!postForm.featured });
                trackWrite(1, 'Updated blog post');
                showToast('Post updated!');
            } else {
                await addDoc(collection(db, "posts"), { title: postForm.title, slug, excerpt: postForm.excerpt, content: postForm.content, coverImage, tags: tagsArray, visible: true, featured: false, createdAt: serverTimestamp() });
                trackWrite(1, 'Added new blog post');
                showToast('Post published!');
            }
            invalidateCache('collection:posts');
            setPostForm({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false });
            setPostImage(null);
            setIsPreviewMode(false);
            setShowPostForm(false);
            fetchPosts();
        } catch { showToast('Error saving post.', 'error'); }
        finally { setLoading(false); }
    };

    const insertMarkdown = (syntax) => {
        const textarea = document.getElementById('markdown-editor');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = postForm.content;
        const selectedText = text.substring(start, end);
        let newText;
        switch (syntax) {
            case 'bold': newText = text.substring(0, start) + `**${selectedText || 'bold text'}**` + text.substring(end); break;
            case 'italic': newText = text.substring(0, start) + `*${selectedText || 'italic text'}*` + text.substring(end); break;
            case 'link': newText = text.substring(0, start) + `[${selectedText || 'Link text'}](url)` + text.substring(end); break;
            case 'code': newText = text.substring(0, start) + `\n\`\`\`\n${selectedText || 'code here'}\n\`\`\`\n` + text.substring(end); break;
            default: return;
        }
        setPostForm({ ...postForm, content: newText });
        setTimeout(() => { textarea.focus(); }, 0);
    };

    return (
        <div className={styles.section} style={{ paddingBottom: '4rem' }}>
            {!showPostForm ? (
                <div className={styles.listSection} style={{ marginTop: '0' }}>
                    <div className={styles.listSectionHeader}>
                        <h3 className={styles.listTitle}>Published Posts</h3>
                        <button onClick={() => { setPostForm({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false }); setPostImage(null); setIsPreviewMode(false); setShowPostForm(true); }} className={styles.addBtn}>
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
                            {paginatedPosts.map((post, index) => (
                                <div key={post.id || `post-${index}`} className={`${styles.listItem} ${styles.clickableRow}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.75rem', borderRadius: '12px', cursor: 'pointer' }} onClick={() => setViewingPost(post)}>
                                    <div className={styles.itemInfo}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{post.title}</h4>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{post.excerpt}</p>
                                        <div className={styles.meta} style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <span className={styles.date}>{post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                            <span style={{ marginLeft: '1rem', color: post.visible ? 'var(--primary-color)' : '#ff9800' }}>{post.visible ? 'Published' : 'Draft'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.itemActions} style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={(e) => { e.stopPropagation(); window.open(`#/blog/${post.slug}`, '_blank'); }} title="View" className={styles.editBtn}><ExternalLink size={16} /></button>
                                        {userRole !== 'editor' && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); toggleFeaturedPost(post.id, post.featured); }} title={post.featured ? "Unfeature" : "Feature"} className={styles.editBtn}>
                                                    <Star size={16} fill={post.featured ? "currentColor" : "none"} style={{ color: post.featured ? '#FFD700' : 'inherit' }} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); toggleVisibility(post.id, post.visible); }} title={post.visible ? "Hide" : "Show"} className={styles.editBtn}>
                                                    {post.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                            </>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setPostForm(post); setShowPostForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Edit" className={styles.editBtn}><Edit2 size={16} /></button>
                                        {userRole !== 'editor' && <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }} className={styles.deleteBtn} title="Delete"><Trash2 size={16} /></button>}
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
                        <h3 style={{ margin: 0 }}>{postForm.id ? <Edit2 size={24} /> : <Plus size={24} />} {postForm.id ? 'Edit Post' : 'New Blog Post'}</h3>
                        <button onClick={() => { setPostForm({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false }); setPostImage(null); setIsPreviewMode(false); setShowPostForm(false); }} className={styles.cancelBtn} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowLeft size={18} /> Cancel & Return
                        </button>
                    </div>
                    <form onSubmit={handleSavePost} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.inputGroup}><label>Title</label><input type="text" placeholder="Post Title" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required /></div>
                            <div className={styles.inputGroup}><label>Slug (URL) <span className={styles.hint}>(leave empty to auto-generate)</span></label><input type="text" placeholder="my-post-url" value={postForm.slug} onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })} /></div>
                            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}><label>Excerpt</label><textarea placeholder="Short summary..." value={postForm.excerpt} onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })} rows="2" /></div>
                            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                <div className={styles.editorHeader}>
                                    <label>Content (Markdown)</label>
                                    <div className={styles.toolbar}>
                                        {!isPreviewMode && (
                                            <div className={styles.formatGroup}>
                                                <button type="button" onClick={() => insertMarkdown('bold')} title="Bold"><Bold size={16} /></button>
                                                <button type="button" onClick={() => insertMarkdown('italic')} title="Italic"><Italic size={16} /></button>
                                                <button type="button" onClick={() => insertMarkdown('link')} title="Link"><LinkIcon size={16} /></button>
                                                <button type="button" onClick={() => insertMarkdown('code')} title="Code Block"><Code size={16} /></button>
                                            </div>
                                        )}
                                        <button type="button" className={styles.previewToggle} onClick={() => setIsPreviewMode(!isPreviewMode)}>
                                            {isPreviewMode ? <><Edit2 size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
                                        </button>
                                    </div>
                                </div>
                                {isPreviewMode ? (
                                    <div className={styles.previewBox}><MarkdownRenderer content={postForm.content || '*Nothing to preview...*'} /></div>
                                ) : (
                                    <textarea id="markdown-editor" placeholder="# Hello World&#10;Write in Markdown..." value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} rows="15" required style={{ fontFamily: 'monospace' }} />
                                )}
                            </div>
                            <div className={styles.inputGroup}><label>Tags (comma separated)</label><input type="text" placeholder="React, Tutorial..." value={Array.isArray(postForm.tags) ? postForm.tags.join(', ') : postForm.tags} onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })} /></div>
                            <div className={styles.fileInputGroup}>
                                <label>Cover Image</label>
                                <div className={styles.fileDropzone}>
                                    <input type="file" accept="image/*" onChange={(e) => setPostImage(e.target.files[0])} />
                                    <div className={styles.fileDropzoneContent}><Upload size={24} /><span>{postImage ? postImage.name : 'Upload Image'}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.formFooter}>
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Blog Details Modal */}
            {viewingPost && (
                <div className={styles.modalOverlay} onClick={() => setViewingPost(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            <h3>{icons.blog || '📝'} Post Details</h3>
                            <button onClick={() => setViewingPost(null)} className={styles.closeBtn}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '75vh' }}>
                            <div className={styles.detailGrid} style={{ marginBottom: '1.5rem' }}>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Title</span><span className={styles.detailValue}>{viewingPost.title}</span></div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Excerpt</span><span className={styles.detailValue}>{viewingPost.excerpt}</span></div>
                                <div className={styles.detailItem}><span className={styles.detailLabel}>Status</span><span className={styles.detailValue}>{viewingPost.visible ? 'Published' : 'Draft'}</span></div>
                                <div className={styles.detailItem}><span className={styles.detailLabel}>Date</span><span className={styles.detailValue}>{viewingPost.createdAt?.seconds ? new Date(viewingPost.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}</span></div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                    <span className={styles.detailLabel}>Tags</span>
                                    <div className={styles.techTags} style={{ marginTop: '0.25rem' }}>
                                        {(Array.isArray(viewingPost.tags) ? viewingPost.tags : (viewingPost.tags ? viewingPost.tags.split(',') : [])).map((t, i) => t.trim() && (
                                            <span key={`${t.trim()}-${i}`} className={styles.techTag} style={{ background: 'var(--card-bg)', border: '1px solid var(--divider)' }}>{t.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {viewingPost.coverImage && (
                                <div style={{ marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden' }}>
                                    <img src={viewingPost.coverImage} alt="Cover" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                                </div>
                            )}
                            <div style={{ background: 'var(--input-bg)', padding: '1rem', borderRadius: '8px' }}>
                                <MarkdownRenderer content={viewingPost.content || '*No content...*'} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogTab;
