/**
 * Effective-status model for scheduled publishing.
 *
 * The stored document is never mutated by a background job (zero-cost / Spark
 * compatible). Instead the *effective* status is computed at read time from the
 * stored status + publishAt/expireAt, and used consistently across the public
 * site, admin tables, search, and dashboard. A future scheduler could later flip
 * the stored status without changing this contract.
 */
export const STATUS = {
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
};

export const STATUS_VALUES = Object.values(STATUS);

/** Convert a Firestore Timestamp | Date | ISO string | millis to millis (or null). */
export const toMillis = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'object') {
        if (typeof value.seconds === 'number') return value.seconds * 1000;
        if (typeof value.toDate === 'function') {
            const date = value.toDate();
            return date instanceof Date ? date.getTime() : null;
        }
        if (value instanceof Date) return value.getTime();
    }
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
};

/**
 * The stored status. Falls back to the legacy `visible` boolean for documents
 * created before scheduling existed (visible:false -> draft, else published).
 */
export const getStoredStatus = (doc = {}) => {
    if (doc.status && STATUS_VALUES.includes(doc.status)) return doc.status;
    return doc.visible === false ? STATUS.DRAFT : STATUS.PUBLISHED;
};

/**
 * Effective status at `now`:
 *  - expired (expireAt <= now) -> archived
 *  - scheduled + publishAt <= now -> published
 *  - published + publishAt in the future -> scheduled
 *  - otherwise the stored status
 */
export const computeEffectiveStatus = (doc = {}, now = Date.now()) => {
    const stored = getStoredStatus(doc);
    const publishAt = toMillis(doc.publishAt);
    const expireAt = toMillis(doc.expireAt);

    if (stored === STATUS.ARCHIVED) return STATUS.ARCHIVED;
    if (expireAt !== null && expireAt <= now) return STATUS.ARCHIVED;

    if (stored === STATUS.SCHEDULED) {
        return publishAt !== null && publishAt <= now ? STATUS.PUBLISHED : STATUS.SCHEDULED;
    }

    if (stored === STATUS.DRAFT) return STATUS.DRAFT;

    // stored === published
    if (publishAt !== null && publishAt > now) return STATUS.SCHEDULED;
    return STATUS.PUBLISHED;
};

export const isEffectivelyPublished = (doc, now = Date.now()) =>
    computeEffectiveStatus(doc, now) === STATUS.PUBLISHED;

/** Keep only documents whose effective status is published. */
export const filterPublished = (items = [], now = Date.now()) =>
    (Array.isArray(items) ? items : []).filter((item) => isEffectivelyPublished(item, now));

/**
 * Whether stored and effective differ (admin UI shows both when they do).
 */
export const hasStatusDrift = (doc = {}, now = Date.now()) =>
    getStoredStatus(doc) !== computeEffectiveStatus(doc, now);

/**
 * Build the persisted status fields from form data, shared by status-capable
 * content domains (blog, projects). Keeps the legacy `visible` flag in sync so
 * existing public Firestore queries still return the right candidate set;
 * fine-grained scheduled/expired gating is applied at read time. `publishedAt`
 * / `archivedAt` round-trip from existing data when present.
 */
export const normalizeStatusFields = (data = {}) => {
    const status = STATUS_VALUES.includes(data.status)
        ? data.status
        : (data.visible === false ? STATUS.DRAFT : STATUS.PUBLISHED);

    return {
        status,
        visible: status === STATUS.PUBLISHED || status === STATUS.SCHEDULED,
        publishAt: data.publishAt || '',
        expireAt: data.expireAt || '',
        publishedAt: data.publishedAt || (status === STATUS.PUBLISHED ? new Date().toISOString() : ''),
        archivedAt: data.archivedAt || (status === STATUS.ARCHIVED ? new Date().toISOString() : '')
    };
};
