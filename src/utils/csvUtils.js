/**
 * Utility for converting between JSON and CSV formats.
 * Designed to handle multi-line Markdown content and quoted fields.
 */

export const jsonToCsv = (data, preferredHeaders = null) => {
    if (!data || !data.length) return "";

    // Determine headers
    const headers = preferredHeaders || Object.keys(data[0]);

    // Create header row
    const headerRow = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",");

    // Create data rows
    const rows = data.map(item => {
        return headers.map(header => {
            let value = item[header];

            // Handle null/undefined
            if (value === null || value === undefined) value = "";

            // Convert arrays to comma-separated strings
            if (Array.isArray(value)) {
                value = value.join(", ");
            }

            // Convert numbers/booleans to string
            value = String(value);

            // Escape quotes and wrap in quotes
            return `"${value.replace(/"/g, '""')}"`;
        }).join(",");
    });

    return [headerRow, ...rows].join("\n");
};

export const csvToJson = (csvString) => {
    if (!csvString || !csvString.trim()) return [];

    const rows = [];
    let currentRow = [];
    let currentField = "";
    let inQuotes = false;

    // Standard CSV parsing logic to handle quoted newlines
    for (let i = 0; i < csvString.length; i++) {
        const char = csvString[i];
        const nextChar = csvString[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
            } else if (char === '"') {
                // End of quoted field
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentField.trim());
                currentField = "";
            } else if (char === '\n' || char === '\r') {
                if (char === '\r' && nextChar === '\n') i++; // Handle CRLF
                currentRow.push(currentField.trim());
                if (currentRow.length > 1 || currentRow[0] !== "") {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = "";
            } else {
                currentField += char;
            }
        }
    }

    // Push last field/row if exists
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    if (rows.length < 2) return [];

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || "";
        });
        return obj;
    });

    return data;
};

export const downloadCSV = (data, fileName = "export.csv") => {
    if (!data || !data.length) return;
    const csvContent = jsonToCsv(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
