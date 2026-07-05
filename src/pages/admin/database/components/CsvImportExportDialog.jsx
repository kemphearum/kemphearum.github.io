import React, { useState } from 'react';
import { Upload, Download, AlertTriangle, FileText, X } from 'lucide-react';
import { Button, Dialog } from '@/shared/components/ui';
import { db } from '../../../../firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const parseCSV = (str) => {
    const lines = str.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
    });
};

const CsvImportExportDialog = ({ open, onOpenChange, collectionName, showToast }) => {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('export'); // 'export' or 'import'

    const handleExport = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, collectionName));
            if (snap.empty) {
                showToast('Collection is empty', 'warning');
                setLoading(false);
                return;
            }
            
            const docs = [];
            let allKeys = new Set(['id']);
            snap.forEach(d => {
                const data = d.data();
                docs.push({ id: d.id, ...data });
                Object.keys(data).forEach(k => {
                    if (typeof data[k] !== 'object') allKeys.add(k);
                });
            });
            
            const headers = Array.from(allKeys);
            const csvContent = [
                headers.join(','),
                ...docs.map(d => headers.map(h => `"${(d[h] || '').toString().replace(/"/g, '""')}"`).join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${collectionName}_export.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('CSV Exported successfully', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to export CSV', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = parseCSV(evt.target.result);
                // Validate schema (check if it has 'id')
                const hasId = parsed.length > 0 && 'id' in parsed[0];
                setPreview({ data: parsed, hasId });
            } catch {
                showToast('Failed to parse CSV', 'error');
                setPreview(null);
            }
        };
        reader.readAsText(selected);
    };

    const handleImport = async () => {
        if (!preview?.data) return;
        setLoading(true);
        try {
            let currentBatch = writeBatch(db);
            let currentBatchSize = 0;
            let count = 0;
            
            for (const row of preview.data) {
                const id = row.id;
                if (!id) continue;
                
                const docRef = doc(db, collectionName, id);
                const data = { ...row };
                delete data.id;
                
                currentBatch.set(docRef, data, { merge: true });
                currentBatchSize++;
                count++;
                
                if (currentBatchSize >= 450) {
                    await currentBatch.commit();
                    currentBatch = writeBatch(db);
                    currentBatchSize = 0;
                }
            }
            
            if (currentBatchSize > 0) {
                await currentBatch.commit();
            }
            
            showToast(`Successfully imported ${count} documents`, 'success');
            onOpenChange(false);
            setPreview(null);
        } catch (err) {
            console.error(err);
            showToast('Failed to import CSV', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content maxWidth="600px">
                <Dialog.Header title={`CSV Import / Export: ${collectionName}`} icon={FileText}>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="ui-btn-icon-only">
                        <X size={18} />
                    </Button>
                </Dialog.Header>
                
                <Dialog.Body>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                            <button 
                                onClick={() => setMode('export')}
                                style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: mode === 'export' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', color: mode === 'export' ? 'var(--primary)' : 'inherit' }}
                            >
                                Export CSV
                            </button>
                            <button 
                                onClick={() => setMode('import')}
                                style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: mode === 'import' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', color: mode === 'import' ? 'var(--primary)' : 'inherit' }}
                            >
                                Import CSV
                            </button>
                        </div>

                        {mode === 'export' && (
                            <div className="ui-flex-column" style={{ gap: '1rem' }}>
                                <div className="ui-quota-banner ui-bg-subtle-light">
                                    <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                                    <span>{tm('ui.exportingFlatCollections')}</span>
                                </div>
                                <Button variant="primary" onClick={handleExport} disabled={loading} icon={Download}>
                                    {loading ? 'Exporting...' : 'Export Collection to CSV'}
                                </Button>
                            </div>
                        )}

                        {mode === 'import' && (
                            <div className="ui-flex-column" style={{ gap: '1rem' }}>
                                <div className="ui-quota-banner ui-bg-subtle-light">
                                    <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                                    <span>Import expects a CSV with an <strong>id</strong> column. Existing documents with matching IDs will be merged/overwritten. Use JSON for complex nested data.</span>
                                </div>
                                <input type="file" accept=".csv" onChange={handleFileChange} />
                                
                                {preview && (
                                    <div className="ui-card ui-p-small" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        <div className="ui-font-bold ui-mb-small">Preview ({preview.data.length} rows)</div>
                                        {!preview.hasId && (
                                            <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{tm('ui.warningNoIdColumn')}</div>
                                        )}
                                        <pre style={{ fontSize: '0.75rem', overflowX: 'auto' }}>
                                            {JSON.stringify(preview.data.slice(0, 3), null, 2)}
                                        </pre>
                                    </div>
                                )}

                                <Button variant="primary" onClick={handleImport} disabled={!preview || loading} icon={Upload}>
                                    {loading ? 'Importing...' : 'Run Import'}
                                </Button>
                            </div>
                        )}
                    </div>
                </Dialog.Body>
            </Dialog.Content>
        </Dialog>
    );
};

export default CsvImportExportDialog;
