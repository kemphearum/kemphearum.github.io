import React, { useState, useCallback, useMemo } from 'react';
import { Search, Eye, EyeOff, Edit2, Trash2, X, Bold, Italic, Link as LinkIcon, Code, Save, Plus, ArrowLeft, History } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sortData } from '../../../utils/sortData';
import { icons } from '../components/constants';
import MarkdownRenderer from '../../../components/MarkdownRenderer';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import styles from '../../Admin.module.scss';
import ExperienceService from '../../../services/ExperienceService';
import ConfirmDialog from '../components/ConfirmDialog';
import HistoryModal from '../components/HistoryModal';

const ExperienceTab = ({ userRole, showToast }) => {
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
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    const [historyModal, setHistoryModal] = useState({ isOpen: false, recordId: null, title: '' });
    const { trackRead, trackWrite, trackDelete } = useActivity();
    const queryClient = useQueryClient();

    const { data: experiences = [], isLoading: expLoading } = useQuery({
        queryKey: ['experience'],
        queryFn: async () => {
            const allExperience = await ExperienceService.getAll("createdAt", "desc");
            trackRead(allExperience.length, 'Fetched experience');
            return allExperience;
        }
    });

    const handleExpSort = useCallback((field) => {
        setExpSort(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
        setExpPage(1);
    }, []);

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
            queryClient.invalidateQueries({ queryKey: ['experience'] });
            showToast(`Item ${!currentVisible ? 'visible' : 'hidden'} on homepage.`);
        } catch (error) { showToast(error.message || 'Failed to toggle visibility.', 'error'); }
    };

    const handleDeleteExperience = (id) => {
        if (userRole === 'pending' || userRole === 'editor') {
            showToast("Not authorized to delete experience records.", "error");
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Delete Experience',
            message: 'Are you sure you want to delete this experience? This action cannot be undone.',
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                setLoading(true);
                try {
                    await ExperienceService.deleteExperience(userRole, id, trackDelete);
                    queryClient.invalidateQueries({ queryKey: ['experience'] });
                    queryClient.invalidateQueries({ queryKey: ['history'] });
                    showToast('Experience deleted.');
                } catch (error) {
                    showToast(error.message || 'Failed to delete experience.', 'error');
                } finally {
                    setLoading(false);
                    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
                }
            }
        });
    };

    const handleSaveExperience = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = {
                ...experience,
                company: experience.company,
                role: experience.role,
                startMonthYear: experience.startDate, // In UI this was called startDate, but the DatePicker is month format (yyyy-mm)
                endMonthYear: experience.endDate,
                current: experience.isPresent,
                description: experience.description,
                id: editingExperience
            };
            const result = await ExperienceService.saveExperience(userRole, formData, trackWrite);
            queryClient.invalidateQueries({ queryKey: ['experience'] });
            queryClient.invalidateQueries({ queryKey: ['history'] });
            setEditingExperience(null);
            setExperience({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false });
            setShowExperienceForm(false);
            showToast(`Experience ${result.isNew ? 'added' : 'updated'} successfully!`);
        } catch (error) { showToast(error.message || 'Error saving experience.', 'error'); }
        finally { setLoading(false); }
    };

    const handleEditExperienceClick = (exp) => {
        // Extremely robust date parser to handle all legacy formats for the DatePicker (yyyy-mm)
        const parseLegacyDate = (dateVal, isEnd = false) => {
            if (!dateVal) return '';

            // 1. Handle Native Object Types (Firestore Timestamp, Date, etc.)
            let d = null;
            if (typeof dateVal === 'object') {
                if (dateVal.seconds) d = new Date(dateVal.seconds * 1000);
                else if (dateVal instanceof Date) d = dateVal;
                else if (typeof dateVal.toDate === 'function') d = dateVal.toDate();
            }
            if (d && !isNaN(d.getTime())) {
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            }

            if (typeof dateVal !== 'string') return '';

            // Handle ranges by taking either the first or last part
            if (dateVal.includes(' — ') || dateVal.includes(' - ')) {
                const rangeParts = dateVal.split(/[—\-]/).map(p => p.trim());
                if (isEnd) {
                    dateVal = rangeParts[rangeParts.length - 1];
                    if (dateVal.toLowerCase() === 'present') return '';
                } else {
                    dateVal = rangeParts[0];
                }
            }

            // 2. Handle YYYY-MM explicitly
            const yyyyMm = dateVal.match(/^(\d{4})-(\d{2})/);
            if (yyyyMm) return yyyyMm[0];

            // 3. Extract Year (4-digit starting with 19 or 20)
            const years = dateVal.match(/\b(19|20)\d{2}\b/g) || [];
            const foundYear = isEnd ? years[years.length - 1] : years[0];

            // 4. Extract Month from Name
            const monthsMap = {
                'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
                'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
            };
            const lower = dateVal.toLowerCase();
            let foundMonth = null;

            // Search for month names
            for (const [name, code] of Object.entries(monthsMap)) {
                if (lower.includes(name)) {
                    foundMonth = code;
                    // If multiple months present (unlikely after range split), return the first/last as requested
                    if (!isEnd) break;
                }
            }

            // 5. Extract Month from Number (if not found by name)
            if (!foundMonth) {
                const numbers = dateVal.match(/\b\d{1,2}\b/g) || [];
                // Look for a number 1-12 that is NOT the year part
                for (const n of numbers) {
                    const num = parseInt(n, 10);
                    if (num >= 1 && num <= 12 && n !== foundYear) {
                        foundMonth = n.padStart(2, '0');
                        if (!isEnd) break;
                    }
                }
            }

            if (foundYear && foundMonth) return `${foundYear}-${foundMonth}`;

            // 6. Last resort: Native parsing
            const nativeDate = new Date(dateVal);
            if (!isNaN(nativeDate.getTime())) {
                return `${nativeDate.getFullYear()}-${String(nativeDate.getMonth() + 1).padStart(2, '0')}`;
            }

            return '';
        };

        setEditingExperience(exp.id);
        const startVal = exp.startMonthYear || exp.startDate || exp.period;
        const endVal = exp.endMonthYear || exp.endDate || exp.period;
        const isCurrentlyPresent = exp.current || (typeof endVal === 'string' && endVal.toLowerCase().includes('present'));

        setExperience({
            ...exp,
            company: exp.company || '',
            role: exp.role || '',
            startDate: parseLegacyDate(startVal, false),
            endDate: isCurrentlyPresent ? '' : parseLegacyDate(endVal, true),
            isPresent: !!isCurrentlyPresent,
            description: exp.description || ''
        });
        setShowExperienceForm(true);
        setIsExpPreviewMode(false);
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
                        <button onClick={() => {
                            setEditingExperience(null);
                            setExperience({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false });
                            setIsExpPreviewMode(false);
                            setShowExperienceForm(true);
                        }} className={styles.addBtn}>
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
                                        <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); setHistoryModal({ isOpen: true, recordId: exp.id, title: `${exp.role} at ${exp.company}` }); }} title="View Edit History">
                                            <History size={16} />
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
                                <input type="month" value={experience.startDate || ''} onChange={(e) => setExperience({ ...experience, startDate: e.target.value })} onClick={(e) => e.target.showPicker?.()} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    End Date
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                                        <input type="checkbox" checked={experience.isPresent} onChange={(e) => setExperience({ ...experience, isPresent: e.target.checked })} style={{ width: 'auto', margin: 0 }} />
                                        Present
                                    </label>
                                </label>
                                <input type="month" value={experience.endDate || ''} onChange={(e) => setExperience({ ...experience, endDate: e.target.value })} disabled={experience.isPresent} required={!experience.isPresent} onClick={(e) => e.target.showPicker?.()} />
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
                <div className={styles.modalOverlay} onClick={() => setViewingExperience(null)} style={{ zIndex: 1200 }}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', borderRadius: '20px' }}>
                        <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem 2rem' }}>
                            <h3 style={{ fontSize: '1.4rem' }}>{icons.experience || '👔'} Experience Details</h3>
                            <button onClick={() => setViewingExperience(null)} className={styles.closeBtn}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '2rem', overflowY: 'auto', maxHeight: '75vh' }}>
                            <div className={styles.detailGrid} style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                <div className={styles.detailItem}><span className={styles.detailLabel}>Company</span><span className={styles.detailValue} style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-color)' }}>{viewingExperience.company}</span></div>
                                <div className={styles.detailItem}><span className={styles.detailLabel}>Role</span><span className={styles.detailValue} style={{ fontSize: '1.1rem', fontWeight: '700' }}>{viewingExperience.role}</span></div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Period</span><span className={styles.detailValue} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'inline-block', marginTop: '0.4rem' }}>{viewingExperience.period}</span></div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.015)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)' }}>
                                <MarkdownRenderer content={viewingExperience.description} />
                            </div>
                        </div>
                        <div className={styles.modalFooter} style={{ padding: '1.25rem 2rem' }}>
                            <button onClick={() => setViewingExperience(null)} className={styles.primaryBtn}>Close</button>
                        </div>
                    </div>
                </div>
            )}

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
                service={ExperienceService}
                title={historyModal.title}
            />
        </>
    );
};

export default ExperienceTab;
