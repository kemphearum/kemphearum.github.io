import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { Search, Eye, EyeOff, Edit2, Trash2, X, Bold, Italic, Link as LinkIcon, Code, Save, Plus, ArrowLeft } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { invalidateCache } from '../../../hooks/useFirebaseData';
import { sortData } from '../../../utils/sortData';
import { icons } from '../components/constants';
import MarkdownRenderer from '../../../components/MarkdownRenderer';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import styles from '../../Admin.module.scss';

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
            const q = query(collection(db, "experience"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            trackRead(querySnapshot.size, 'Fetched experience');
            setExperiences(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
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
        if (userRole === 'pending') { showToast("Pending accounts are not authorized.", "error"); return; }
        try {
            await updateDoc(doc(db, 'experience', id), { visible: !currentVisible });
            trackWrite(1, 'Toggled visibility for experience');
            invalidateCache('collection:experience');
            setExperiences(prev => prev.map(e => e.id === id ? { ...e, visible: !currentVisible } : e));
            showToast(`Item ${!currentVisible ? 'visible' : 'hidden'} on homepage.`);
        } catch { showToast('Failed to toggle visibility.', 'error'); }
    };

    const handleDeleteExperience = async (id) => {
        if (userRole === 'pending') { showToast("Pending accounts are not authorized.", "error"); return; }
        if (!window.confirm("Are you sure you want to delete this experience?")) return;
        try {
            await deleteDoc(doc(db, "experience", id));
            trackDelete(1, 'Deleted experience');
            invalidateCache('collection:experience');
            setExperiences(experiences.filter(e => e.id !== id));
            showToast('Experience deleted.');
        } catch { showToast('Failed to delete experience.', 'error'); }
    };

    const prepareExperienceForSave = () => {
        const formatMonthYear = (yyyyMm) => {
            if (!yyyyMm) return '';
            const [y, m] = yyyyMm.split('-');
            const d = new Date(y, m - 1);
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        };
        let start = formatMonthYear(experience.startDate);
        let end = experience.isPresent ? 'Present' : formatMonthYear(experience.endDate);
        let finalPeriod = experience.period;
        if (start || end) {
            if (start && end) finalPeriod = `${start} - ${end}`;
            else if (start) finalPeriod = start;
            else if (end) finalPeriod = end;
        }
        // eslint-disable-next-line no-unused-vars
        const { startDate, endDate, isPresent, ...dataToSave } = experience;
        dataToSave.period = finalPeriod;
        return dataToSave;
    };

    const handleAddExperience = async (e) => {
        e.preventDefault();
        if (userRole === 'pending') { showToast("Pending accounts are not authorized to make changes.", "error"); return; }
        setLoading(true);
        try {
            const dataToSave = prepareExperienceForSave();
            await addDoc(collection(db, "experience"), { ...dataToSave, visible: true, createdAt: serverTimestamp() });
            trackWrite(1, 'Added new experience');
            invalidateCache('collection:experience');
            showToast('Experience added successfully!');
            setExperience({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false });
            setShowExperienceForm(false);
            fetchExperiences();
        } catch { showToast('Error adding experience.', 'error'); }
        finally { setLoading(false); }
    };

    const handleEditExperienceClick = (exp) => {
        setEditingExperience(exp.id);
        let sDate = '', eDate = '', isPres = false;
        if (exp.period) {
            const parts = exp.period.split('-');
            if (parts.length > 0) { const s = new Date(parts[0].trim()); if (!isNaN(s.getTime())) sDate = s.toISOString().substring(0, 7); }
            if (parts.length > 1) {
                if (parts[1].toLowerCase().includes('present')) isPres = true;
                else { const end = new Date(parts[1].trim()); if (!isNaN(end.getTime())) eDate = end.toISOString().substring(0, 7); }
            }
        }
        setExperience({ ...exp, startDate: sDate, endDate: eDate, isPresent: isPres });
        setShowExperienceForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateExperience = async (e) => {
        e.preventDefault();
        if (userRole === 'pending') { showToast("Pending accounts are not authorized to make changes.", "error"); return; }
        setLoading(true);
        try {
            const dataToSave = prepareExperienceForSave();
            await updateDoc(doc(db, "experience", editingExperience), { ...dataToSave });
            trackWrite(1, 'Updated experience');
            showToast('Experience updated successfully!');
            setEditingExperience(null);
            setExperience({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false });
            setShowExperienceForm(false);
            fetchExperiences();
        } catch { showToast('Error updating experience.', 'error'); }
        finally { setLoading(false); }
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
                    <form onSubmit={editingExperience ? handleUpdateExperience : handleAddExperience} className={styles.form}>
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
