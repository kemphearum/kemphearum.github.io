import React, { useState, useCallback, useMemo } from 'react';
import { Search, Eye, EyeOff, Edit2, Trash2, Star, ExternalLink, X, Bold, Italic, Link as LinkIcon, Code, Upload, Save, Plus, ArrowLeft, History, Settings2, FileText, Download, ChevronDown, Github } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sortData } from '../../../utils/data/sortData';
import { icons } from '../components/constants';
import ImageProcessingService from '../../../services/ImageProcessingService';
import MarkdownRenderer from '../../../components/common/MarkdownRenderer';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import tableStyles from '../styles/adminTables.module.scss';
import formStyles from '../styles/adminForms.module.scss';
import cardStyles from '../styles/adminCards.module.scss';
import modalStyles from '../styles/adminModals.module.scss';
import utilStyles from '../styles/adminUtilities.module.scss';
import tabStyles from '../styles/adminTabs.module.scss';
import ProjectService from '../../../services/ProjectService';
import ConfirmDialog from '../components/ConfirmDialog';
import HistoryModal from '../components/HistoryModal';
import BaseModal from '../components/BaseModal';
import FormRow from '../components/FormRow';
import FormInput from '../components/FormInput';
import FormMarkdownEditor from '../components/FormMarkdownEditor';
import FormDropzone from '../components/FormDropzone';
import BulkActionModal from '../components/BulkActionModal';
import { jsonToCsv, csvToJson } from '../../../utils/data/csvUtils';

const ProjectsTab = ({ userRole, showToast }) => {
    const [project, setProject] = useState({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' });
    const [projectImage, setProjectImage] = useState(null);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [viewingProject, setViewingProject] = useState(null);
    const [searchProjects, setSearchProjects] = useState('');
    const [isProjectPreviewMode, setIsProjectPreviewMode] = useState(false);
    const [projPage, setProjPage] = useState(1);
    const [projPerPage, setProjPerPage] = useState(10);
    const [projSort, setProjSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [loading, setLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    const [historyModal, setHistoryModal] = useState({ isOpen: false, recordId: null, title: '' });
    const [overwriteExisting, setOverwriteExisting] = useState(true);
    const [bulkModal, setBulkModal] = useState({ isOpen: false, mode: 'import', data: [] });
    const [importProgress, setImportProgress] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const fileInputRef = React.useRef(null);
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

    const handleImportJSON = (e) => {
        if (userRole === 'pending' || userRole === 'editor') {
            showToast("Not authorized to import projects.", "error");
            return;
        }

        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const content = event.target.result;
                // Detect if CSV or JSON
                let importedProjects = [];
                if (file.name.endsWith('.csv')) {
                    importedProjects = csvToJson(content);
                } else {
                    importedProjects = JSON.parse(content);
                }

                if (!Array.isArray(importedProjects)) {
                    importedProjects = [importedProjects];
                }
                // Prepare for preview
                const previewData = [];
                const seenSlugs = new Set();

                for (const proj of importedProjects) {
                    if (!proj.title) continue;

                    const slug = proj.slug || ProjectService.generateSlug(proj.title);

                    // Internal duplicate check (within the file)
                    const isFileDuplicate = seenSlugs.has(slug);
                    seenSlugs.add(slug);

                    const existing = await ProjectService.fetchProjectBySlug(slug, null, true);

                    // Normalize techStack to array for preview if it's a string
                    const techStack = typeof proj.techStack === 'string'
                        ? proj.techStack.split(',').map(t => t.trim()).filter(t => t)
                        : (proj.techStack || []);

                    previewData.push({
                        ...proj,
                        techStack, // Standardize for preview
                        slug,
                        exists: !!existing,
                        existingId: existing?.id || null,
                        fileDuplicate: isFileDuplicate
                    });
                }

                setBulkModal({
                    isOpen: true,
                    mode: 'import',
                    data: previewData
                });

            } catch (error) {
                console.error("Import Error:", error);
                showToast("Failed to parse JSON file.", "error");
            } finally {
                setLoading(false);
                e.target.value = null;
            }
        };

        reader.onerror = () => {
            setLoading(false);
            showToast("Failed to read the file.", "error");
        };

        reader.readAsText(file);
    };

    const handleExportJSON = () => {
        setBulkModal({
            isOpen: true,
            mode: 'export',
            data: projects
        });
    };

    const handleExportCSV = () => {
        const headers = ["title", "description", "techStack", "githubUrl", "liveUrl", "slug", "content", "featured", "visible"];
        const csvData = jsonToCsv(projects, headers);
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `projects_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Projects exported to CSV.");
    };


    const handleConfirmBulkAction = async (selectedItems) => {
        if (bulkModal.mode === 'import') {
            // Filter out items already marked as duplicate in the file to prevent extra writes
            const itemsToProcess = selectedItems.filter(item => !item.fileDuplicate);
            const total = itemsToProcess.length;

            if (total === 0) {
                showToast("No unique items to import.", "info");
                return;
            }

            const duplicates = itemsToProcess.filter(item => item.exists);

            if (duplicates.length > 0 && overwriteExisting) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Confirm Overwrite',
                    message: `You are about to overwrite ${duplicates.length} existing projects. This action cannot be undone. Proceed with overwriting all?`,
                    confirmText: 'Overwrite All',
                    type: 'warning',
                    onConfirm: () => executeBulkImport(itemsToProcess)
                });
                return;
            }

            executeBulkImport(itemsToProcess);
        } else {
            // Export mode
            const dataStr = JSON.stringify(selectedItems, (key, value) => {
                if (key === 'createdAt' && value?.seconds) {
                    return new Date(value.seconds * 1000).toISOString();
                }
                return value;
            }, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `projects_export_selected_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast(`Exported ${selectedItems.size || selectedItems.length} selected projects.`);
            setBulkModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const executeBulkImport = async (itemsToProcess) => {
        setLoading(true);
        setImportProgress(0);
        try {
            let successCount = 0;
            let updatedCount = 0;
            let failCount = 0;
            const total = itemsToProcess.length;

            for (let i = 0; i < total; i++) {
                const item = itemsToProcess[i];
                try {
                    const formData = {
                        ...item,
                        id: (overwriteExisting && item.existingId) ? item.existingId : null,
                        techStack: Array.isArray(item.techStack) ? item.techStack.join(', ') : (item.techStack || '')
                    };

                    const result = await ProjectService.saveProject(userRole, formData, undefined, trackWrite);
                    if (!result.isNew) updatedCount++;
                    else successCount++;
                } catch (err) {
                    console.error(`Failed to import item: ${item.title}`, err);
                    failCount++;
                }
                setImportProgress(((i + 1) / total) * 100);
            }

            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['history'] });

            if (failCount > 0) {
                showToast(`Import completed with issues: ${successCount} added, ${updatedCount} updated, ${failCount} failed.`, 'warning');
            } else {
                showToast(`Import successful: ${successCount} added, ${updatedCount} updated.`);
            }
        } catch (error) {
            console.error("Bulk Import Error:", error);
            showToast("Bulk import process encountered an error.", "error");
        } finally {
            setLoading(false);
            setImportProgress(0);
            setBulkModal(prev => ({ ...prev, isOpen: false }));
        }
    };
    const downloadTemplate = () => {
        const template = [
            {
                title: "Example Project",
                description: "Short description here",
                techStack: "React, Firebase",
                githubUrl: "https://github.com/...",
                liveUrl: "https://...",
                slug: "example-project",
                content: "# Markdown Content\nDetails here...",
                featured: false,
                visible: true
            }
        ];
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "projects_template.json";
        link.click();
        URL.revokeObjectURL(url);
    };

    const downloadCSVTemplate = () => {
        const template = [
            {
                title: "Example Project",
                description: "Short description here",
                techStack: "React, Firebase",
                githubUrl: "https://github.com/...",
                liveUrl: "https://...",
                slug: "example-project",
                content: "# Markdown Content\nDetails here...",
                featured: "false",
                visible: "true"
            }
        ];
        const csvData = jsonToCsv(template, ["title", "description", "techStack", "githubUrl", "liveUrl", "slug", "content", "featured", "visible"]);
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "projects_template.csv";
        link.click();
        URL.revokeObjectURL(url);
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
                <div className={cardStyles.listSection}>
                    <div className={cardStyles.listSectionHeader}>
                        <h3 className={cardStyles.listTitle}>Existing Projects</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button onClick={() => { setEditingProject(null); setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' }); setProjectImage(null); setShowProjectForm(true); }} className={cardStyles.addBtn}>
                                <Plus size={18} /> Add New
                            </button>
                            <div className={tabStyles.dropdownWrapper}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className={formStyles.secondaryBtn}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <Settings2 size={16} /> Bulk Actions <ChevronDown size={14} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>

                                {dropdownOpen && (
                                    <>
                                        <div className={modalStyles.modalOverlay} style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'none', WebkitBackdropFilter: 'none', zIndex: 999 }} onClick={() => setDropdownOpen(false)} />
                                        <div className={tabStyles.dropdownMenu}>
                                            <button className={tabStyles.dropdownItem} onClick={() => { setDropdownOpen(false); downloadCSVTemplate(); }}>
                                                <FileText size={16} /> Download CSV Template
                                            </button>
                                            <button className={tabStyles.dropdownItem} onClick={() => { setDropdownOpen(false); downloadTemplate(); }}>
                                                <FileText size={16} /> Download JSON Template
                                            </button>
                                            <hr className={tabStyles.dropdownDivider} />
                                            <button className={tabStyles.dropdownItem} onClick={() => { setDropdownOpen(false); handleExportCSV(); }}>
                                                <ExternalLink size={16} /> Export CSV
                                            </button>
                                            <button className={tabStyles.dropdownItem} onClick={() => { setDropdownOpen(false); handleExportJSON(); }}>
                                                <ExternalLink size={16} /> Export JSON
                                            </button>
                                            <hr className={tabStyles.dropdownDivider} />
                                            <button className={tabStyles.dropdownItem} onClick={() => { setDropdownOpen(false); fileInputRef.current?.click(); }}>
                                                <Upload size={16} /> Import (JSON/CSV)
                                            </button>
                                        </div>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".json,.csv"
                                    onChange={handleImportJSON}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={formStyles.searchBox}>
                        <Search size={16} className={formStyles.searchIcon} />
                        <input type="text" placeholder="Search by title or technology..." value={searchProjects} onChange={(e) => { setSearchProjects(e.target.value); setProjPage(1); }} />
                        {searchProjects && <span className={formStyles.searchResultCount}>{filteredProjects.length} of {projects.length}</span>}
                    </div>
                    {filteredProjects.length === 0 ? (
                        <div className={tableStyles.emptyState}>{searchProjects ? 'No matching projects found.' : 'No projects yet.'}</div>
                    ) : (
                        <>
                            <div className={tableStyles.tableHeaderRow}>
                                <div className={tableStyles.colThumbnail}></div>
                                <div className={tableStyles.colInfo}>
                                    <div className={tableStyles.colHeaderFlex}>
                                        <SortableHeader label="Title" field="title" sortField={projSort.field} sortDirection={projSort.dir} onSort={handleProjSort} />
                                    </div>
                                </div>
                                <div className={tableStyles.colDescription}>Description</div>
                                <div className={tableStyles.colTech}>
                                    <SortableHeader label="Tech Stack" field="techStack" sortField={projSort.field} sortDirection={projSort.dir} onSort={handleProjSort} />
                                </div>
                                <div className={tableStyles.colLinks}>
                                    <SortableHeader label="Links" field="githubUrl" sortField={projSort.field} sortDirection={projSort.dir} onSort={handleProjSort} />
                                </div>
                                <div className={tableStyles.colStatus}>
                                    <SortableHeader label="Status" field="visible" sortField={projSort.field} sortDirection={projSort.dir} onSort={handleProjSort} />
                                </div>
                                <div className={tableStyles.colActions}>Actions</div>
                            </div>
                            {paginatedProjects.map((p, index) => (
                                <div key={p.id || `proj-${index}`} className={`${tableStyles.listItem} ${p.visible === false ? tableStyles.hiddenItem : ''} ${tableStyles.clickableRow}`} onClick={() => setViewingProject(p)}>
                                    <div className={tableStyles.colThumbnail}>
                                        <div className={tableStyles.itemThumbnail}>
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt={p.title} />
                                            ) : (
                                                <div className={tableStyles.placeholder}>
                                                    <FileText size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={tableStyles.colInfo}>
                                        <div className={tableStyles.itemMainInfo}>
                                            <h4 className={tableStyles.itemTitle}>{p.title}</h4>
                                        </div>
                                    </div>
                                    <div className={tableStyles.colDescription}>
                                        <p className={tableStyles.itemDescription}>{p.description}</p>
                                    </div>
                                    <div className={tableStyles.colTech}>
                                        <div className={tableStyles.inlineTags}>
                                            {(Array.isArray(p.techStack) ? p.techStack : []).slice(0, 3).map((t, i) => (
                                                <span key={i} className={tableStyles.miniTag}>{t}</span>
                                            ))}
                                            {p.techStack?.length > 3 && <span className={tableStyles.moreTags}>+{p.techStack.length - 3}</span>}
                                            {(!p.techStack || p.techStack.length === 0) && <span className={tableStyles.noData}>None</span>}
                                        </div>
                                    </div>
                                    <div className={tableStyles.colLinks}>
                                        <div className={tableStyles.linkSummary}>
                                            <Github size={14} className={p.githubUrl ? tableStyles.linkIconActive : tableStyles.linkIconInactive} title={p.githubUrl ? "GitHub Repo Available" : "No GitHub Repo"} />
                                            <ExternalLink size={14} className={p.liveUrl ? tableStyles.linkIconActive : tableStyles.linkIconInactive} title={p.liveUrl ? "Live Demo Available" : "No Live Demo"} />
                                        </div>
                                    </div>
                                    <div className={tableStyles.colStatus}>
                                        <span className={`${tableStyles.statusBadge} ${p.visible !== false ? tableStyles.statusPublished : tableStyles.statusDraft}`}>
                                            {p.visible !== false ? 'Published' : 'Unpublished'}
                                        </span>
                                    </div>
                                    <div className={tableStyles.colActions}>
                                        <div className={tableStyles.itemActions}>
                                            {p.slug && <button onClick={(e) => { e.stopPropagation(); window.open(`/projects/${p.slug}`, '_blank'); }} title="View Detail" className={tableStyles.editBtn}><ExternalLink size={16} /></button>}
                                            {userRole !== 'editor' && (
                                                <>
                                                    <button onClick={(e) => { e.stopPropagation(); toggleFeatured(p.id, p.featured); }} title={p.featured ? "Unfeature" : "Feature"} className={tableStyles.editBtn}>
                                                        <Star size={16} fill={p.featured ? "currentColor" : "none"} style={{ color: p.featured ? '#FFD700' : 'inherit' }} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); toggleVisibility(p.id, p.visible !== false); }} title={p.visible !== false ? "Hide" : "Show"} className={tableStyles.editBtn}>
                                                        {p.visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); setHistoryModal({ isOpen: true, recordId: p.id, title: p.title }); }} className={tableStyles.historyIconBtn} title="View Edit History"><History size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleEditClick(p); }} className={tableStyles.editBtn} title="Edit"><Edit2 size={16} /></button>
                                            {userRole !== 'editor' && <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className={tableStyles.deleteBtn} title="Delete"><Trash2 size={16} /></button>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Pagination currentPage={projPage} totalPages={projTotalPages} onPageChange={setProjPage} perPage={projPerPage} onPerPageChange={(v) => { setProjPerPage(v); setProjPage(1); }} totalItems={filteredProjects.length} />
                        </>
                    )}
                </div>
            ) : (
                <div className={cardStyles.card}>
                    <div className={cardStyles.cardHeader}>
                        <h3>{editingProject ? <Edit2 size={24} /> : <Plus size={24} />} {editingProject ? 'Edit Project' : 'Add New Project'}</h3>
                        <button
                            onClick={() => {
                                setEditingProject(null);
                                setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' });
                                setProjectImage(null);
                                setIsProjectPreviewMode(false);
                                setShowProjectForm(false);
                            }}
                            className={formStyles.cancelBtn}
                        >
                            <ArrowLeft size={18} /> Cancel & Return
                        </button>
                    </div>
                    <form onSubmit={handleSaveProject} className={formStyles.form}>
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
                            isPreviewMode={isProjectPreviewMode}
                            onTogglePreview={() => setIsProjectPreviewMode(!isProjectPreviewMode)}
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
                            currentImageUrl={project.imageUrl}
                            onClearExisting={() => setProject(prev => ({ ...prev, imageUrl: '' }))}
                        />

                        <div className={formStyles.formFooter}>
                            <button type="submit" disabled={loading} className={formStyles.submitBtn}>
                                {loading ? <><span className={utilStyles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
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
                    <button onClick={() => setViewingProject(null)} className={cardStyles.primaryBtn} style={{ margin: 0 }}>Close</button>
                }
            >
                <div style={{ padding: '2rem' }}>
                    <div className={tableStyles.detailGrid} style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div className={tableStyles.detailItem} style={{ gridColumn: 'span 2' }}>
                            <span className={tableStyles.detailLabel}>Title</span>
                            <span className={tableStyles.detailValue} style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-color)' }}>{viewingProject?.title}</span>
                        </div>
                        <div className={tableStyles.detailItem} style={{ gridColumn: 'span 2' }}>
                            <span className={tableStyles.detailLabel}>Description</span>
                            <span className={tableStyles.detailValue} style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{viewingProject?.description}</span>
                        </div>
                        <div className={tableStyles.detailItem} style={{ gridColumn: 'span 2' }}>
                            <span className={tableStyles.detailLabel}>Tech Stack</span>
                            <div className={tableStyles.techTags} style={{ marginTop: '0.6rem' }}>
                                {(Array.isArray(viewingProject?.techStack) ? viewingProject.techStack : []).map((t, i) => (
                                    <span key={`preview-tag-${t}-${i}`} className={tableStyles.techTag} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}>{t}</span>
                                ))}
                            </div>
                        </div>
                        <div className={tableStyles.detailItem} style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                            {viewingProject?.liveUrl && <a href={viewingProject.liveUrl} target="_blank" rel="noopener noreferrer" className={cardStyles.primaryBtn} style={{ margin: 0, textDecoration: 'none', padding: '0.6rem 1.25rem' }}><ExternalLink size={16} /> Live Demo</a>}
                            {viewingProject?.githubUrl && <a href={viewingProject.githubUrl} target="_blank" rel="noopener noreferrer" className={tableStyles.editBtn} style={{ margin: 0, textDecoration: 'none', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LinkIcon size={16} /> GitHub Repository</a>}
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

            <BulkActionModal
                isOpen={bulkModal.isOpen}
                onClose={() => setBulkModal(prev => ({ ...prev, isOpen: false, data: [] }))}
                mode={bulkModal.mode}
                type="projects"
                data={bulkModal.data}
                onConfirm={handleConfirmBulkAction}
                overwriteExisting={overwriteExisting}
                setOverwriteExisting={setOverwriteExisting}
                loading={loading}
                progress={importProgress}
            />
        </>
    );
};

export default ProjectsTab;
