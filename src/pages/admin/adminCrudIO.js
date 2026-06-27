import { csvToJson } from '../../utils/csvUtils';

export const parseBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
        if (['false', '0', 'no', 'n'].includes(normalized)) return false;
    }
    return fallback;
};

export const readImportFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result || '');
    reader.onerror = () => reject(new Error('Failed to read import file.'));
    reader.readAsText(file);
});

export const parseImportItems = (fileName, content) => {
    let parsed = [];

    if (fileName.toLowerCase().endsWith('.csv')) {
        parsed = csvToJson(content);
    } else {
        parsed = JSON.parse(content);
    }

    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed;
};

export const downloadBlob = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const downloadJson = (data, filename) =>
    downloadBlob(JSON.stringify(data, null, 2), filename, 'application/json');

export const downloadCsv = (csvString, filename) =>
    downloadBlob(csvString, filename, 'text/csv');

/**
 * Generic bulk-import runner shared by content tabs.
 * buildPayload returns the resource payload, or a falsy value to skip the row.
 * fetchExistingBySlug resolves an existing record (to update) or null (to create).
 * save persists the payload (id is injected from the existing record when found).
 */
export const runImport = async ({ items, buildPayload, fetchExistingBySlug, save }) => {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of items) {
        try {
            const payload = buildPayload(item);
            if (!payload) {
                skipped += 1;
                continue;
            }

            const existing = await fetchExistingBySlug(payload.slug);
            await save({ ...payload, id: existing?.id || null }, existing);

            if (existing?.id) updated += 1;
            else created += 1;
        } catch {
            failed += 1;
        }
    }

    return { created, updated, skipped, failed };
};
