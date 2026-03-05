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
import ProjectService from '../../../services/ProjectService';

const ProjectsTab = ({ userRole, showToast }) => {
    const [project, setProject] = useState({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' });
    const [projectImage, setProjectImage] = useState(null);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [viewingProject, setViewingProject] = useState(null);
    const [searchProjects, setSearchProjects] = useState('');
    const [projPage, setProjPage] = useState(1);
    const [projPerPage, setProjPerPage] = useState(10);
    const [projSort, setProjSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [isProjectPreviewMode, setIsProjectPreviewMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const { trackRead, trackWrite, trackDelete } = useActivity();
    const queryClient = useQueryClient();

    const { data: projects = [], isLoading: projectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const allProjects = await ProjectService.getAll("createdAt", "desc");
            trackRead(allProjects.length, 'Fetched projects');
            return allProjects;
        }
    });

    const handleProjSort = useCallback((field) => {
        setProjSort(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
        setProjPage(1);
    }, []);

    const filteredProjects = useMemo(() => {
        let result = projects;
        if (searchProjects) {
            const lower = searchProjects.toLowerCase();
            result = result.filter(p =>
                (p.title && p.title.toLowerCase().includes(lower)) ||
                (Array.isArray(p.techStack) && p.techStack.some(t => t.toLowerCase().includes(lower)))
            );
        }
        return sortData(result, projSort);
    }, [projects, searchProjects, projSort]);

    const projTotalPages = Math.ceil(filteredProjects.length / projPerPage) || 1;
    const paginatedProjects = useMemo(() => {
        const start = (projPage - 1) * projPerPage;
        return filteredProjects.slice(start, start + projPerPage);
    }, [filteredProjects, projPage, projPerPage]);

    const toggleVisibility = async (id, currentVisible) => {
        try {
            await ProjectService.toggleVisibility(userRole, id, currentVisible, trackWrite);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setProjects(prev => prev.map(p => p.id === id ? { ...p, visible: !currentVisible } : p));
            showToast(`Project ${!currentVisible ? 'shown' : 'hidden'}.`);
        } catch (error) { showToast(error.message || 'Failed to toggle visibility.', 'error'); }
    };

    const toggleFeatured = async (id, currentFeatured) => {
        try {
            await ProjectService.toggleFeatured(userRole, id, currentFeatured, trackWrite);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setProjects(prev => prev.map(p => p.id === id ? { ...p, featured: !currentFeatured } : p));
            showToast(!currentFeatured ? 'Featured on homepage!' : 'Removed from homepage.');
        } catch (error) { showToast(error.message || 'Failed to toggle featured status.', 'error'); }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await ProjectService.deleteProject(userRole, id, trackDelete);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast('Project deleted successfully.');
        } catch (error) { showToast(error.message || 'Failed to delete project.', 'error'); }
    };

    const handleSaveProject = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = undefined;
            if (projectImage) {
                imageUrl = await ImageProcessingService.compress(projectImage);
            }

            const formData = {
                ...project,
                id: editingProject
            };

            const result = await ProjectService.saveProject(userRole, formData, imageUrl, trackWrite);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setEditingProject(null);
            setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' });
            setProjectImage(null);
            setShowProjectForm(false);
            showToast(`Project ${result.isNew ? 'added' : 'updated'} successfully!`);
        } catch (error) {
            showToast(error.message || 'Error saving project.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (p) => {
        setEditingProject(p.id);
        setProject({ ...p, techStack: Array.isArray(p.techStack) ? p.techStack.join(', ') : p.techStack || '' });
        setProjectImage(null);
        setIsProjectPreviewMode(false);
        setShowProjectForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const insertMarkdownProject = (syntax) => {
        const textarea = document.getElementById('project-markdown-editor');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = project.content || '';
        const selectedText = text.substring(start, end);
        let newText;
        switch (syntax) {
            case 'bold': newText = text.substring(0, start) + `**${selectedText || 'bold text'}**` + text.substring(end); break;
            case 'italic': newText = text.substring(0, start) + `*${selectedText || 'italic text'}*` + text.substring(end); break;
            case 'link': newText = text.substring(0, start) + `[${selectedText || 'Link text'}](url)` + text.substring(end); break;
            case 'code': newText = text.substring(0, start) + `\n\`\`\`\n${selectedText || 'code here'}\n\`\`\`\n` + text.substring(end); break;
            default: return;
        }
        setProject({ ...project, content: newText });
        setTimeout(() => { textarea.focus(); }, 0);
    };

    return (
        <>
            {!showProjectForm ? (
                <div className={styles.listSection}>
                    <div className={styles.listSectionHeader}>
                        <h3 className={styles.listTitle}>Existing Projects</h3>
                        <button onClick={() => { setEditingProject(null); setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' }); setProjectImage(null); setIsProjectPreviewMode(false); setShowProjectForm(true); }} className={styles.addBtn}>
                            <Plus size={18} /> Add New
                        </button>
                    </div>
                    <div className={styles.searchBox}>
                        <Search size={16} className={styles.searchIcon} />
                        <input type="text" placeholder="Search by title or technology..." value={searchProjects} onChange={(e) => { setSearchProjects(e.target.value); setProjPage(1); }} />
                        {searchProjects && <span className={styles.searchResultCount}>{filteredProjects.length} of {projects.length}</span>}
                    </div>
                    {filteredProjects.length === 0 ? (
                        <div className={styles.emptyState}>{searchProjects ? 'No matching projects found.' : 'No projects yet.'}</div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 1.5rem', background: 'var(--editor-toolbar-bg, var(--card-bg))', border: '1px solid var(--editor-border, var(--divider))', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <SortableHeader label="Title" field="title" sortField={projSort.field} sortDirection={projSort.dir} onSort={handleProjSort} />
                                <SortableHeader label="Featured" field="featured" sortField={projSort.field} sortDirection={projSort.dir} onSort={handleProjSort} />
                                <SortableHeader label="Visibility" field="visible" sortField={projSort.field} sortDirection={projSort.dir} onSort={handleProjSort} />
                            </div>
                            {paginatedProjects.map((p, index) => (
                                <div key={p.id || `proj-${index}`} className={`${styles.listItem} ${p.visible === false ? styles.hiddenItem : ''} ${styles.clickableRow}`} onClick={() => setViewingProject(p)} style={{ cursor: 'pointer' }}>
                                    <div className={styles.listItemInfo}>
                                        <h4>{p.title} {p.visible === false && <span className={styles.hiddenBadge}>Hidden</span>}</h4>
                                        <div className={styles.techTags}>
                                            {(Array.isArray(p.techStack) ? p.techStack : []).map((t, i) => (
                                                <span key={`${p.id}-tag-${t}-${i}`} className={styles.techTag}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.itemActions} style={{ display: 'flex', gap: '0.5rem' }}>
                                        {p.slug && <button onClick={(e) => { e.stopPropagation(); window.open(`#/projects/${p.slug}`, '_blank'); }} title="View Detail" className={styles.editBtn}><ExternalLink size={16} /></button>}
                                        {userRole !== 'editor' && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); toggleFeatured(p.id, p.featured); }} title={p.featured ? "Unfeature" : "Feature"} className={styles.editBtn}>
                                                    <Star size={16} fill={p.featured ? "currentColor" : "none"} style={{ color: p.featured ? '#FFD700' : 'inherit' }} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); toggleVisibility(p.id, p.visible !== false); }} title={p.visible !== false ? "Hide" : "Show"} className={styles.editBtn}>
                                                    {p.visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                            </>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); handleEditClick(p); }} className={styles.editBtn} title="Edit"><Edit2 size={16} /></button>
                                        {userRole !== 'editor' && <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className={styles.deleteBtn} title="Delete"><Trash2 size={16} /></button>}
                                    </div>
                                </div>
                            ))}
                            <Pagination currentPage={projPage} totalPages={projTotalPages} onPageChange={setProjPage} perPage={projPerPage} onPerPageChange={(v) => { setProjPerPage(v); setProjPage(1); }} totalItems={filteredProjects.length} />
                        </>
                    )}
                </div>
            ) : (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>{editingProject ? <Edit2 size={24} /> : <Plus size={24} />} {editingProject ? 'Edit Project' : 'Add New Project'}</h3>
                        <button onClick={() => { setEditingProject(null); setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' }); setProjectImage(null); setIsProjectPreviewMode(false); setShowProjectForm(false); }} className={styles.cancelBtn} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowLeft size={18} /> Cancel & Return
                        </button>
                    </div>
                    <form onSubmit={handleSaveProject} className={styles.form}>
                        <div className={styles.inputGroup}><label>Project Title</label><input type="text" placeholder="e.g. Portfolio Website" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} required /></div>
                        <div className={styles.inputGroup}><label>Slug (URL) <span className={styles.hint}>(leave empty to auto-generate)</span></label><input type="text" placeholder="my-project-url" value={project.slug || ''} onChange={(e) => setProject({ ...project, slug: e.target.value })} /></div>
                        <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}><label>Short Description (Excerpt)</label><textarea placeholder="Describe what this project does..." value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} rows="2" required /></div>
                        <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                            <div className={styles.editorHeader}>
                                <label>Full Content (Markdown)</label>
                                <div className={styles.toolbar}>
                                    {!isProjectPreviewMode && (
                                        <div className={styles.formatGroup}>
                                            <button type="button" onClick={() => insertMarkdownProject('bold')} title="Bold"><Bold size={16} /></button>
                                            <button type="button" onClick={() => insertMarkdownProject('italic')} title="Italic"><Italic size={16} /></button>
                                            <button type="button" onClick={() => insertMarkdownProject('link')} title="Link"><LinkIcon size={16} /></button>
                                            <button type="button" onClick={() => insertMarkdownProject('code')} title="Code Block"><Code size={16} /></button>
                                        </div>
                                    )}
                                    <button type="button" className={styles.previewToggle} onClick={() => setIsProjectPreviewMode(!isProjectPreviewMode)}>
                                        {isProjectPreviewMode ? <><Edit2 size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
                                    </button>
                                </div>
                            </div>
                            {isProjectPreviewMode ? (
                                <div className={styles.previewBox}><MarkdownRenderer content={project.content || '*Nothing to preview...*'} /></div>
                            ) : (
                                <textarea id="project-markdown-editor" placeholder="# Project Overview&#10;Write full technical details in Markdown..." value={project.content || ''} onChange={(e) => setProject({ ...project, content: e.target.value })} rows="12" style={{ fontFamily: 'monospace' }} />
                            )}
                        </div>
                        <div className={styles.inputGroup}><label>Tech Stack <span className={styles.hint}>(comma separated)</span></label><input type="text" placeholder="React, Firebase, SCSS" value={project.techStack} onChange={(e) => setProject({ ...project, techStack: e.target.value })} required /></div>
                        <div className={styles.formGrid}>
                            <div className={styles.inputGroup}><label>GitHub URL <span className={styles.hint}>(optional)</span></label><input type="url" placeholder="https://github.com/..." value={project.githubUrl} onChange={(e) => setProject({ ...project, githubUrl: e.target.value })} /></div>
                            <div className={styles.inputGroup}><label>Live Demo URL <span className={styles.hint}>(optional)</span></label><input type="url" placeholder="https://..." value={project.liveUrl} onChange={(e) => setProject({ ...project, liveUrl: e.target.value })} /></div>
                        </div>
                        <div className={styles.fileInputGroup}>
                            <label>Project Image {editingProject && <span className={styles.hint}>(leave empty to keep current)</span>}</label>
                            <div className={styles.fileDropzone}>
                                <input type="file" accept="image/*" onChange={(e) => setProjectImage(e.target.files[0])} />
                                <div className={styles.fileDropzoneContent}>
                                    <Upload size={24} />
                                    <span>{projectImage ? projectImage.name : 'Click or drag to upload'}</span>
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

            {/* Project Details Modal */}
            {viewingProject && (
                <div className={styles.modalOverlay} onClick={() => setViewingProject(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            <h3>{icons.projects || '🗂️'} Project Details</h3>
                            <button onClick={() => setViewingProject(null)} className={styles.closeBtn}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '75vh' }}>
                            <div className={styles.detailGrid} style={{ marginBottom: '1.5rem' }}>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Title</span><span className={styles.detailValue}>{viewingProject.title}</span></div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Excerpt</span><span className={styles.detailValue}>{viewingProject.description}</span></div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                    <span className={styles.detailLabel}>Tech Stack</span>
                                    <div className={styles.techTags} style={{ marginTop: '0.25rem' }}>
                                        {(Array.isArray(viewingProject.techStack) ? viewingProject.techStack : []).map((t, i) => (
                                            <span key={`preview-tag-${t}-${i}`} className={styles.techTag} style={{ background: 'var(--card-bg)', border: '1px solid var(--divider)' }}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center' }}>
                                    {viewingProject.liveUrl && <a href={viewingProject.liveUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ExternalLink size={14} /> Live Demo</a>}
                                    {viewingProject.githubUrl && <a href={viewingProject.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><LinkIcon size={14} /> GitHub</a>}
                                </div>
                            </div>
                            <div style={{ background: 'var(--input-bg)', padding: '1rem', borderRadius: '8px' }}>
                                <MarkdownRenderer content={viewingProject.content || '*No extended content...*'} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProjectsTab;
