/**
 * Parses YAML-like frontmatter from a markdown string.
 * @param {string} fileContent 
 * @returns {Object} { data: Object, content: string }
 */
export const parseFrontmatter = (fileContent) => {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = fileContent.match(frontmatterRegex);

    if (!match) {
        return {
            data: {},
            content: fileContent.trim()
        };
    }

    const frontmatterText = match[1];
    const content = match[2];
    const data = {};

    const lines = frontmatterText.split('\n');
    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }

            // Handle booleans
            if (value.toLowerCase() === 'true') { value = true; }
            else if (value.toLowerCase() === 'false') { value = false; }

            // Handle brackets for arrays or comma-separated strings for specific keys
            else if (value.startsWith('[') && value.endsWith(']')) {
                value = value.substring(1, value.length - 1).split(',').map(item => {
                    let innerVal = item.trim();
                    if ((innerVal.startsWith('"') && innerVal.endsWith('"')) || (innerVal.startsWith("'") && innerVal.endsWith("'"))) {
                        innerVal = innerVal.substring(1, innerVal.length - 1);
                    }
                    return innerVal;
                }).filter(Boolean);
            }
            else if (key === 'tags' && value.includes(',')) {
                value = value.split(',').map(t => t.trim()).filter(Boolean);
            }

            data[key] = value;
        }
    });

    return { data, content: content.trim() };
};

/**
 * Generates a URL-friendly slug from a title.
 * @param {string} title 
 * @returns {string}
 */
export const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
