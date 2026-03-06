import React, { useState, useCallback, useMemo } from 'react';
import { Search, Eye, EyeOff, Edit2, Trash2, Star, ExternalLink, X, Bold, Italic, Link as LinkIcon, Code, Upload, Save, Plus, ArrowLeft, History } from 'lucide-react';
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
import ConfirmDialog from '../components/ConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import BaseModal from '../components/BaseModal';
import FormRow from '../components/FormRow';
import FormInput from '../components/FormInput';
import FormMarkdownEditor from '../components/FormMarkdownEditor';
import FormDropzone from '../components/FormDropzone';

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
    const [loading, setLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    const [historyModal, setHistoryModal] = useState({ isOpen: false, recordId: null, title: '' });
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
            showToast(`Project ${!currentVisible ? 'shown' : 'hidden'}.`);
        } catch (error) { showToast(error.message || 'Failed to toggle visibility.', 'error'); }
    };

    const toggleFeatured = async (id, currentFeatured) => {
        try {
            await ProjectService.toggleFeatured(userRole, id, currentFeatured, trackWrite);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast(!currentFeatured ? 'Featured on homepage!' : 'Removed from homepage.');
        } catch (error) { showToast(error.message || 'Failed to toggle featured status.', 'error'); }
    };

    const handleDeleteProject = (id) => {
        if (userRole === 'pending' || userRole === 'editor') {
            showToast("Not authorized to delete projects.", "error");
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Delete Project',
            message: 'Are you sure you want to delete this project? This action cannot be undone.',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                setLoading(true);
                try {
                    await ProjectService.deleteProject(userRole, id, trackDelete);
                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                    queryClient.invalidateQueries({ queryKey: ['history'] });
                    showToast('Project deleted successfully.');
                } catch (error) {
                    showToast(error.message || 'Failed to delete project.', 'error');
                } finally {
                    setLoading(false);
                    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
                }
            }
        });
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
            queryClient.invalidateQueries({ queryKey: ['history'] });
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
        setShowProjectForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            {!showProjectForm ? (
                <div className={styles.listSection}>
                    <div className={styles.listSectionHeader}>
                        <h3 className={styles.listTitle}>Existing Projects</h3>
                        <button onClick={() => { setEditingProject(null); setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' }); setProjectImage(null); setShowProjectForm(true); }} className={styles.addBtn}>
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
                                        <button onClick={(e) => { e.stopPropagation(); setHistoryModal({ isOpen: true, recordId: p.id, title: p.title }); }} className={styles.editBtn} title="View Edit History"><History size={16} /></button>
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
                        <button onClick={() => { setEditingProject(null); setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' }); setProjectImage(null); setShowProjectForm(false); }} className={styles.cancelBtn} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowLeft size={18} /> Cancel & Return
                        </button>
                    </div>
                    <form onSubmit={handleSaveProject} className={styles.form}>
                        <FormRow>
                            <FormInput
                                label="Project Title"
                                placeholder="e.g. Portfolio Website"
                                value={project.title}
                                onChange={(e) => setProject({ ...project, title: e.target.value })}
                                required
                            />
                            <FormInput
                                label="Slug"
                                hint="leave empty to auto-generate"
                                placeholder="my-project-url"
                                value={project.slug || ''}
                                onChange={(e) => setProject({ ...project, slug: e.target.value })}
                            />
                        </FormRow>

                        <FormInput
                            label="Short Description (Excerpt)"
                            placeholder="Describe what this project does..."
                            value={project.description}
                            onChange={(e) => setProject({ ...project, description: e.target.value })}
                            required
                            fullWidth
                            isTextArea
                            rows="2"
                        />

                        <FormMarkdownEditor
                            label="Full Content (Markdown)"
                            id="project-markdown-editor"
                            value={project.content || ''}
                            onChange={(e) => setProject({ ...project, content: e.target.value })}
                            rows="12"
                        />

                        <FormInput
                            label="Tech Stack"
                            hint="comma separated"
                            placeholder="React, Firebase, SCSS"
                            value={project.techStack}
                            onChange={(e) => setProject({ ...project, techStack: e.target.value })}
                            required
                            fullWidth
                        />

                        <FormRow>
                            <FormInput
                                label="GitHub URL"
                                hint="optional"
                                type="url"
                                placeholder="https://github.com/..."
                                value={project.githubUrl}
                                onChange={(e) => setProject({ ...project, githubUrl: e.target.value })}
                            />
                            <FormInput
                                label="Live Demo URL"
                                hint="optional"
                                type="url"
                                placeholder="https://..."
                                value={project.liveUrl}
                                onChange={(e) => setProject({ ...project, liveUrl: e.target.value })}
                            />
                        </FormRow>

                        <FormDropzone
                            label="Project Image"
                            hint={editingProject ? "leave empty to keep current" : ""}
                            file={projectImage}
                            onFileChange={setProjectImage}
                        />

                        <div className={styles.formFooter}>
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Project Details Modal */}
            {/* Project Details Modal */}
            <BaseModal
                isOpen={!!viewingProject}
                onClose={() => setViewingProject(null)}
                zIndex={1200}
                maxWidth="720px"
                contentStyle={{ borderRadius: '20px' }}
                headerStyle={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem 2rem' }}
                headerContent={
                    <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {icons.projects || '🗂️'} Project Details
                    </h3>
                }
                bodyStyle={{ padding: 0 }}
                footerStyle={{ padding: '1.25rem 2rem' }}
                footerContent={
                    <button onClick={() => setViewingProject(null)} className={styles.primaryBtn} style={{ margin: 0 }}>Close</button>
                }
            >
                <div style={{ padding: '2rem', overflowY: 'auto', maxHeight: '75vh' }}>
                    <div className={styles.detailGrid} style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                            <span className={styles.detailLabel}>Title</span>
                            <span className={styles.detailValue} style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-color)' }}>{viewingProject?.title}</span>
                        </div>
                        <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                            <span className={styles.detailLabel}>Description</span>
                            <span className={styles.detailValue} style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{viewingProject?.description}</span>
                        </div>
                        <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                            <span className={styles.detailLabel}>Tech Stack</span>
                            <div className={styles.techTags} style={{ marginTop: '0.6rem' }}>
                                {(Array.isArray(viewingProject?.techStack) ? viewingProject.techStack : []).map((t, i) => (
                                    <span key={`preview-tag-${t}-${i}`} className={styles.techTag} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}>{t}</span>
                                ))}
                            </div>
                        </div>
                        <div className={styles.detailItem} style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                            {viewingProject?.liveUrl && <a href={viewingProject.liveUrl} target="_blank" rel="noopener noreferrer" className={styles.primaryBtn} style={{ margin: 0, textDecoration: 'none', padding: '0.6rem 1.25rem' }}><ExternalLink size={16} /> Live Demo</a>}
                            {viewingProject?.githubUrl && <a href={viewingProject.githubUrl} target="_blank" rel="noopener noreferrer" className={styles.editBtn} style={{ margin: 0, textDecoration: 'none', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LinkIcon size={16} /> GitHub Repository</a>}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.015)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)' }}>
                        <MarkdownRenderer content={viewingProject?.content || '*No extended content...*'} />
                    </div>
                </div>
            </BaseModal>


            {/* Confirm Dialog */}
            {confirmDialog.isOpen && (
                <ConfirmDialog
                    confirmDialog={confirmDialog}
                    setConfirmDialog={setConfirmDialog}
                />
            )}

            <HistoryModal
                isOpen={historyModal.isOpen}
                onClose={() => setHistoryModal({ isOpen: false, recordId: null, title: '' })}
                recordId={historyModal.recordId}
                service={ProjectService}
                title={historyModal.title}
            />
        </>
    );
};

export default ProjectsTab;
