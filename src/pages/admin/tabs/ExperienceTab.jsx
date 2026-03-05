import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Eye, EyeOff, Edit2, Trash2, X, Bold, Italic, Link as LinkIcon, Code, Save, Plus, ArrowLeft } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { invalidateCache } from '../../../hooks/useFirebaseData';
import { sortData } from '../../../utils/sortData';
import { icons } from '../components/constants';
import MarkdownRenderer from '../../../components/MarkdownRenderer';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import styles from '../../Admin.module.scss';
import ExperienceService from '../../../services/ExperienceService';

const ExperienceTab = ({ userRole, showToast }) => {
    const [experiences, setExperiences] = useState([]);
    const [experience, setExperience] = useState({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false });
    const [showExperienceForm, setShowExperienceForm] = useState(false);
    const [editingExperience, setEditingExperience] = useState(null);
    const [viewingExperience, setViewingExperience] = useState(null);
    const [searchExperience, setSearchExperience] = useState('');
    const [expPage, setExpPage] = useState(1);
    const [expPerPage, setExpPerPage] = useState(10);
    const [expSort, setExpSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [isExpPreviewMode, setIsExpPreviewMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const { trackRead, trackWrite, trackDelete } = useActivity();

    const handleExpSort = useCallback((field) => {
        setExpSort(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
        setExpPage(1);
    }, []);

    const fetchExperiences = useCallback(async () => {
        try {
            const allExperience = await ExperienceService.getAll("createdAt", "desc");
            trackRead(allExperience.length, 'Fetched experience');
            setExperiences(allExperience);
        } catch (error) {
            console.error("Error fetching experience:", error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { fetchExperiences(); }, [fetchExperiences]);

    const filteredExperiences = useMemo(() => {
        let result = experiences;
        if (searchExperience) {
            const lower = searchExperience.toLowerCase();
            result = result.filter(exp =>
                (exp.role && exp.role.toLowerCase().includes(lower)) ||
                (exp.company && exp.company.toLowerCase().includes(lower))
            );
        }
        return sortData(result, expSort);
    }, [experiences, searchExperience, expSort]);

    const expTotalPages = Math.ceil(filteredExperiences.length / expPerPage) || 1;
    const paginatedExperiences = useMemo(() => {
        const start = (expPage - 1) * expPerPage;
        return filteredExperiences.slice(start, start + expPerPage);
    }, [filteredExperiences, expPage, expPerPage]);

    const toggleVisibility = async (id, currentVisible) => {
        try {
            await ExperienceService.toggleVisibility(userRole, id, currentVisible, trackWrite);
            invalidateCache('collection:experience');
            setExperiences(prev => prev.map(e => e.id === id ? { ...e, visible: !currentVisible } : e));
            showToast(`Item ${!currentVisible ? 'visible' : 'hidden'} on homepage.`);
        } catch (error) { showToast(error.message || 'Failed to toggle visibility.', 'error'); }
    };

    const handleDeleteExperience = async (id) => {
        if (!window.confirm("Are you sure you want to delete this experience?")) return;
        try {
            await ExperienceService.deleteExperience(userRole, id, trackDelete);
            invalidateCache('collection:experience');
            setExperiences(experiences.filter(e => e.id !== id));
            showToast('Experience deleted.');
        } catch (error) { showToast(error.message || 'Failed to delete experience.', 'error'); }
    };

    const handleSaveExperience = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = {
                company: experience.company,
                role: experience.role,
                startMonthYear: experience.startDate, // In UI this was called startDate, but the DatePicker is month format (yyyy-mm)
                endMonthYear: experience.endDate,
                current: experience.isPresent,
                description: experience.description,
                id: editingExperience
            };
            const result = await ExperienceService.saveExperience(userRole, formData, trackWrite);
            invalidateCache('collection:experience');
            setEditingExperience(null);
            setExperience({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false });
            setShowExperienceForm(false);
            fetchExperiences();
            showToast(`Experience ${result.isNew ? 'added' : 'updated'} successfully!`);
        } catch (error) { showToast(error.message || 'Error saving experience.', 'error'); }
        finally { setLoading(false); }
    };

    const handleEditExperienceClick = (exp) => {
        setEditingExperience(exp.id);
        setExperience({
            company: exp.company || '',
            role: exp.role || '',
            startDate: exp.startMonthYear || '',
            endDate: exp.endMonthYear || '',
            isPresent: exp.current || false,
            description: exp.description || ''
        });
        setShowExperienceForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const insertMarkdownExp = (syntax) => {
        const textarea = document.getElementById('exp-markdown-editor');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = experience.description;
        const selectedText = text.substring(start, end);
        let newText;
        switch (syntax) {
            case 'bold': newText = text.substring(0, start) + `**${selectedText || 'bold text'}**` + text.substring(end); break;
            case 'italic': newText = text.substring(0, start) + `*${selectedText || 'italic text'}*` + text.substring(end); break;
            case 'link': newText = text.substring(0, start) + `[${selectedText || 'Link text'}](url)` + text.substring(end); break;
            case 'code': newText = text.substring(0, start) + `\n\`\`\`\n${selectedText || 'code here'}\n\`\`\`\n` + text.substring(end); break;
            default: return;
        }
        setExperience({ ...experience, description: newText });
        setTimeout(() => { textarea.focus(); }, 0);
    };

    return (
        <>
            {!showExperienceForm ? (
                <div className={styles.listSection}>
                    <div className={styles.listSectionHeader}>
                        <h3 className={styles.listTitle}>Existing Experience</h3>
                        <button onClick={() => { setEditingExperience(null); setExperience({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false }); setShowExperienceForm(true); }} className={styles.addBtn}>
                            <Plus size={18} /> Add New
                        </button>
                    </div>
                    <div className={styles.searchBox}>
                        <Search size={16} className={styles.searchIcon} />
                        <input type="text" placeholder="Search by role or company..." value={searchExperience} onChange={(e) => { setSearchExperience(e.target.value); setExpPage(1); }} />
                        {searchExperience && <span className={styles.searchResultCount}>{filteredExperiences.length} of {experiences.length}</span>}
                    </div>
                    {filteredExperiences.length === 0 ? (
                        <div className={styles.emptyState}>{searchExperience ? 'No matching experience found.' : 'No experience entries yet.'}</div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 1.5rem', background: 'var(--editor-toolbar-bg, var(--card-bg))', border: '1px solid var(--editor-border, var(--divider))', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <SortableHeader label="Role" field="role" sortField={expSort.field} sortDirection={expSort.dir} onSort={handleExpSort} />
                                <SortableHeader label="Company" field="company" sortField={expSort.field} sortDirection={expSort.dir} onSort={handleExpSort} />
                                <SortableHeader label="Period" field="period" sortField={expSort.field} sortDirection={expSort.dir} onSort={handleExpSort} />
                            </div>
                            {paginatedExperiences.map((exp, index) => (
                                <div key={exp.id || `exp-${index}`} className={`${styles.listItem} ${exp.visible === false ? styles.hiddenItem : ''} ${styles.clickableRow}`} onClick={() => setViewingExperience(exp)} style={{ cursor: 'pointer' }}>
                                    <div className={styles.listItemInfo}>
                                        <h4>{exp.role} {exp.visible === false && <span className={styles.hiddenBadge}>Hidden</span>}</h4>
                                        <p className={styles.listMeta}>{exp.company} • <em>{exp.period}</em></p>
                                    </div>
                                    <div className={styles.listItemActions}>
                                        <button className={`${styles.visibilityBtn} ${exp.visible === false ? styles.off : ''}`} onClick={(e) => { e.stopPropagation(); toggleVisibility(exp.id, exp.visible !== false); }} title={exp.visible === false ? 'Show on homepage' : 'Hide from homepage'}>
                                            {exp.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); handleEditExperienceClick(exp); }} title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); handleDeleteExperience(exp.id); }} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <Pagination currentPage={expPage} totalPages={expTotalPages} onPageChange={setExpPage} perPage={expPerPage} onPerPageChange={(v) => { setExpPerPage(v); setExpPage(1); }} totalItems={filteredExperiences.length} />
                        </>
                    )}
                </div>
            ) : (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>{editingExperience ? <Edit2 size={24} /> : <Plus size={24} />} {editingExperience ? 'Edit Experience' : 'Add New Experience'}</h3>
                        <button onClick={() => { setEditingExperience(null); setExperience({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false }); setShowExperienceForm(false); }} className={styles.cancelBtn} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowLeft size={18} /> Cancel & Return
                        </button>
                    </div>
                    <form onSubmit={handleSaveExperience} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.inputGroup}>
                                <label>Company Name</label>
                                <input type="text" placeholder="e.g. Google Inc." value={experience.company} onChange={(e) => setExperience({ ...experience, company: e.target.value })} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Role / Job Title</label>
                                <input type="text" placeholder="e.g. Senior Developer" value={experience.role} onChange={(e) => setExperience({ ...experience, role: e.target.value })} required />
                            </div>
                        </div>
                        <div className={styles.formGrid}>
                            <div className={styles.inputGroup}>
                                <label>Start Date</label>
                                <input type="month" value={experience.startDate || ''} onChange={(e) => setExperience({ ...experience, startDate: e.target.value })} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>
                                    End Date
                                    <span style={{ float: 'right', fontSize: '0.85rem' }}>
                                        <input type="checkbox" checked={experience.isPresent} onChange={(e) => setExperience({ ...experience, isPresent: e.target.checked })} style={{ marginRight: '0.3rem', width: 'auto' }} />
                                        Present
                                    </span>
                                </label>
                                <input type="month" value={experience.endDate || ''} onChange={(e) => setExperience({ ...experience, endDate: e.target.value })} disabled={experience.isPresent} required={!experience.isPresent} />
                            </div>
                        </div>
                        <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                            <div className={styles.editorHeader}>
                                <label>Description (Markdown)</label>
                                <div className={styles.toolbar}>
                                    {!isExpPreviewMode && (
                                        <div className={styles.formatGroup}>
                                            <button type="button" onClick={() => insertMarkdownExp('bold')} title="Bold"><Bold size={16} /></button>
                                            <button type="button" onClick={() => insertMarkdownExp('italic')} title="Italic"><Italic size={16} /></button>
                                            <button type="button" onClick={() => insertMarkdownExp('link')} title="Link"><LinkIcon size={16} /></button>
                                            <button type="button" onClick={() => insertMarkdownExp('code')} title="Code Block"><Code size={16} /></button>
                                        </div>
                                    )}
                                    <button type="button" className={styles.previewToggle} onClick={() => setIsExpPreviewMode(!isExpPreviewMode)}>
                                        {isExpPreviewMode ? <><Edit2 size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
                                    </button>
                                </div>
                            </div>
                            {isExpPreviewMode ? (
                                <div className={styles.previewBox}>
                                    <MarkdownRenderer content={experience.description || '*Nothing to preview...*'} />
                                </div>
                            ) : (
                                <textarea
                                    id="exp-markdown-editor"
                                    placeholder="Use markdown to format your description..."
                                    value={experience.description}
                                    onChange={(e) => setExperience({ ...experience, description: e.target.value })}
                                    rows="8"
                                    required
                                    style={{ fontFamily: 'monospace' }}
                                />
                            )}
                        </div>
                        <div className={styles.formFooter}>
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? <><span className={styles.spinner} /> Saving...</> : <><Save size={18} /> Save</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Experience Details Modal */}
            {viewingExperience && (
                <div className={styles.modalOverlay} onClick={() => setViewingExperience(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            <h3>{icons.experience || '👔'} Experience Details</h3>
                            <button onClick={() => setViewingExperience(null)} className={styles.closeBtn}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '75vh' }}>
                            <div className={styles.detailGrid} style={{ marginBottom: '1.5rem' }}>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Company</span><span className={styles.detailValue}>{viewingExperience.company}</span></div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Role</span><span className={styles.detailValue}>{viewingExperience.role}</span></div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Period</span><span className={styles.detailValue}>{viewingExperience.period}</span></div>
                            </div>
                            <div style={{ background: 'var(--input-bg)', padding: '1rem', borderRadius: '8px' }}>
                                <MarkdownRenderer content={viewingExperience.description} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExperienceTab;
