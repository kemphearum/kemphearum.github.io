import React, { useState, useEffect } from 'react';
import { Search, Copy, Check, ChevronLeft, ChevronRight, X, FileText } from 'lucide-react';
import { db } from '../../../../firebase';
import { collection, getDocs, query, limit as firestoreLimit, startAfter, orderBy } from 'firebase/firestore';
import { Dialog, Button, Input } from '@/shared/components/ui';
import CsvImportExportDialog from './CsvImportExportDialog';

const JsonViewer = ({ data, name = 'root', isLast = true }) => {
    if (data === undefined) return <span>undefined{isLast ? '' : ','}</span>;
    if (data === null) return <span style={{ color: 'var(--color-danger)' }}>null{isLast ? '' : ','}</span>;
    if (typeof data === 'boolean') return <span style={{ color: 'var(--color-primary)' }}>{data ? 'true' : 'false'}{isLast ? '' : ','}</span>;
    if (typeof data === 'number') return <span style={{ color: 'var(--color-warning)' }}>{data}{isLast ? '' : ','}</span>;
    if (typeof data === 'string') return <span style={{ color: 'var(--color-success)' }}>"{data}"{isLast ? '' : ','}</span>;

    const isArray = Array.isArray(data);
    const keys = Object.keys(data);
    
    if (keys.length === 0) {
        return <span>{isArray ? '[]' : '{}'}{isLast ? '' : ','}</span>;
    }

    if (data && typeof data.toDate === 'function') {
        return <span style={{ color: 'var(--color-info)' }}>Timestamp({data.toDate().toISOString()}){isLast ? '' : ','}</span>;
    }

    return (
        <details open style={{ paddingLeft: '1rem', marginTop: '2px' }}>
            <summary style={{ cursor: 'pointer', outline: 'none', marginLeft: '-1rem' }}>
                <strong>{name}</strong>: {isArray ? '[' : '{'}
            </summary>
            <div style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
                {keys.map((key, index) => (
                    <div key={key}>
                        {typeof data[key] === 'object' && data[key] !== null && typeof data[key].toDate !== 'function' ? (
                            <JsonViewer data={data[key]} name={isArray ? index : key} isLast={index === keys.length - 1} />
                        ) : (
                            <div>
                                <strong>{isArray ? index : key}:</strong> <JsonViewer data={data[key]} isLast={index === keys.length - 1} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div style={{ marginLeft: '-1rem' }}>{isArray ? ']' : '}'}{isLast ? '' : ','}</div>
        </details>
    );
};

const CollectionExplorerDialog = ({ open, onOpenChange, collectionName }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastDoc, setLastDoc] = useState(null);
    const [pageStack, setPageStack] = useState([]); 
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [showCsvDialog, setShowCsvDialog] = useState(false);

    const PAGE_SIZE = 10;

    const fetchDocuments = async (cursor = null, isBack = false) => {
        if (!collectionName) return;
        setLoading(true);
        setError('');
        try {
            const colRef = collection(db, collectionName);
            let q = query(colRef, orderBy('__name__'), firestoreLimit(PAGE_SIZE));

            if (cursor) {
                q = query(colRef, orderBy('__name__'), startAfter(cursor), firestoreLimit(PAGE_SIZE));
            }

            const snapshot = await getDocs(q);
            const docs = [];
            snapshot.forEach(doc => {
                docs.push({ id: doc.id, ...doc.data() });
            });

            setDocuments(docs);
            
            if (!isBack && documents.length > 0) {
                const currentLast = documents[documents.length - 1];
                setPageStack(prev => [...prev, currentLast]);
            }

            if (snapshot.docs.length > 0) {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            } else {
                setLastDoc(null);
            }
        } catch (err) {
            console.error('Error fetching collection docs:', err);
            setError(err.message || 'Failed to load documents.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && collectionName) {
            setPageStack([]);
            setLastDoc(null);
            fetchDocuments();
        } else {
            setDocuments([]);
            setSearchTerm('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, collectionName]);

    const handleNext = () => {
        if (lastDoc) {
            fetchDocuments(lastDoc);
        }
    };

    const handlePrev = () => {
        const stack = [...pageStack];
        stack.pop(); 
        const prevCursor = stack.length > 0 ? stack[stack.length - 1] : null;
        setPageStack(stack);
        fetchDocuments(prevCursor, true);
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredDocs = documents.filter(doc => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return doc.id.toLowerCase().includes(term) || JSON.stringify(doc).toLowerCase().includes(term);
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="800px">
                <Dialog.Header title={`Explore: ${collectionName}`} icon={Search}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline" size="sm" onClick={() => setShowCsvDialog(true)} title="CSV Import/Export">
                            <FileText size={16} /> CSV
                        </Button>
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="ui-btn-icon-only">
                            <X size={18} />
                        </Button>
                    </div>
                </Dialog.Header>
            
                <Dialog.Body>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                                <Input
                                    placeholder="Search current page..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ paddingLeft: '32px', width: '100%' }}
                                />
                            </div>
                            <Button variant="secondary" onClick={() => { setPageStack([]); fetchDocuments(); }}>
                                Refresh
                            </Button>
                        </div>

                        {error && <div className="ui-quota-banner" style={{ background: 'var(--color-danger-subtle)' }}>{error}</div>}
                        
                        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-subtle-light)' }}>
                            {loading ? (
                                <div className="ui-p-large ui-text-center ui-text-muted">Loading documents...</div>
                            ) : filteredDocs.length === 0 ? (
                                <div className="ui-p-large ui-text-center ui-text-muted">No documents found.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {filteredDocs.map((doc, idx) => (
                                        <div key={doc.id} style={{ borderBottom: idx < filteredDocs.length - 1 ? '1px solid var(--border)' : 'none', padding: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{doc.id}</div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <Button variant="ghost" onClick={() => handleCopy(doc.id, `id-${doc.id}`)}>
                                                        {copiedId === `id-${doc.id}` ? <Check size={14} /> : <Copy size={14} />} ID
                                                    </Button>
                                                    <Button variant="ghost" onClick={() => handleCopy(JSON.stringify(doc, null, 2), `json-${doc.id}`)}>
                                                        {copiedId === `json-${doc.id}` ? <Check size={14} /> : <Copy size={14} />} JSON
                                                    </Button>
                                                </div>
                                            </div>
                                            <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius)', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                <JsonViewer data={doc} name="document" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <div className="ui-text-muted ui-text-small">
                                Showing {filteredDocs.length} {filteredDocs.length === 1 ? 'document' : 'documents'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button variant="outline" onClick={handlePrev} disabled={pageStack.length === 0 || loading}>
                                    <ChevronLeft size={16} /> Previous
                                </Button>
                                <Button variant="outline" onClick={handleNext} disabled={!lastDoc || documents.length < PAGE_SIZE || loading}>
                                    Next <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Dialog.Body>
            </Dialog.Content>
            
            <CsvImportExportDialog 
                open={showCsvDialog}
                onOpenChange={setShowCsvDialog}
                collectionName={collectionName}
                showToast={(msg, type) => {
                    alert(`${type.toUpperCase()}: ${msg}`);
                }}
            />
        </Dialog>
    );
};

export default CollectionExplorerDialog;
