import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AuthService from './AuthService';

class SettingsService {
    constructor() {
        this.collectionName = 'settings';
        this.documentId = 'global';
    }

    /**
     * Fetch the unified global settings document
     * @returns {Promise<Object|null>}
     */
    async fetchGlobalSettings() {
        const docRef = doc(db, this.collectionName, this.documentId);
        const snap = await getDoc(docRef);
        return snap.exists() ? snap.data() : null;
    }

    /**
     * Fetch typography metadata (options, defaults, CSS maps)
     * @returns {Promise<Object|null>}
     */
    async fetchTypographyMetadata() {
        const docRef = doc(db, this.collectionName, 'metadata');
        const snap = await getDoc(docRef);
        return snap.exists() ? snap.data().typography : null;
    }

    /**
     * Update multiple sections of the global settings in one atomic operation
     * @param {Object} updates - Object containing 'site', 'typography', and/or 'system' updates
     * @param {Function} trackWrite - Optional analytics tracker
     */
    async updateGlobalSettings(updates, trackWrite) {
        const docRef = doc(db, this.collectionName, this.documentId);
        const payload = {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: AuthService.getCurrentUser()?.email || 'Anonymous'
        };

        await setDoc(docRef, payload, { merge: true });

        if (trackWrite) {
            Object.keys(updates).forEach(key => {
                trackWrite(1, `Updated ${key} settings`, updates[key]);
            });
        }

        return payload;
    }

    /**
     * Save/Merge individual setting key (legacy support)
     */
    async saveSettings(key, data, trackWrite) {
        return this.updateGlobalSettings({ [key]: data }, trackWrite);
    }

    /**
     * Full document set (used for migration)
     */
    async setFullSettings(payload) {
        const docRef = doc(db, this.collectionName, this.documentId);
        await setDoc(docRef, {
            ...payload,
            updatedAt: serverTimestamp()
        }, { merge: true });
    /**
     * Update typography metadata
     */
    async updateTypographyMetadata(metadata) {
        const docRef = doc(db, this.collectionName, 'metadata');
        await setDoc(docRef, { typography: metadata }, { merge: true });
    }

    // Default metadata used for initialization or fallback
    static DEFAULT_TYPOGRAPHY_METADATA = {
        fontOptions: [
            { value: 'inter', label: 'Inter' },
            { value: 'kantumruy-pro', label: 'Kantumruy Pro' },
            { value: 'kantumruy-pro-medium', label: 'Kantumruy Pro Medium' },
            { value: 'battambang', label: 'Battambang' },
            { value: 'fira-code', label: 'Fira Code' },
            { value: 'jetbrains-mono', label: 'JetBrains Mono' },
        ],
        sizeOptions: [
            { value: 'small', label: 'Small (14px)' },
            { value: 'default', label: 'Default (16px)' },
            { value: 'large', label: 'Large (18px)' },
            { value: 'extra-large', label: 'Extra Large (20px)' },
        ],
        weightOptions: [
            { value: '300', label: '300 (Light)' },
            { value: '400', label: '400 (Regular)' },
            { value: '500', label: '500 (Medium)' },
            { value: '600', label: '600 (Semi-Bold)' },
            { value: '700', label: '700 (Bold)' },
            { value: '800', label: '800 (Extra-Bold)' },
            { value: '900', label: '900 (Black)' },
        ],
        fontCSS: {
            'inter': "'Inter', system-ui, -apple-system, sans-serif",
            'kantumruy-pro': "'Kantumruy Pro', system-ui, sans-serif",
            'kantumruy-pro-medium': "'Kantumruy Pro', system-ui, sans-serif",
            'battambang': "'Battambang', system-ui, sans-serif",
            'fira-code': "'Fira Code', monospace",
            'jetbrains-mono': "'JetBrains Mono', monospace",
        },
        fontCategories: [
            { field: 'fontDisplay', sizeField: 'fontDisplaySize', weightField: 'fontDisplayWeight', italicField: 'fontDisplayItalic', label: 'Display / Hero', hint: 'Hero name, banner titles', icon: '🎯', defaultSize: '2rem', defaultWeight: '800' },
            { field: 'fontHeading', sizeField: 'fontHeadingSize', weightField: 'fontHeadingWeight', italicField: 'fontHeadingItalic', label: 'Headings', hint: 'Section titles (H1, H2)', icon: '📌', defaultSize: '1.25rem', defaultWeight: '700' },
            { field: 'fontSubheading', sizeField: 'fontSubheadingSize', weightField: 'fontSubheadingWeight', italicField: 'fontSubheadingItalic', label: 'Sub Headings', hint: 'Card & modal titles (H3–H6)', icon: '📎', defaultSize: '1rem', defaultWeight: '600' },
            { field: 'fontLogo', sizeField: 'fontLogoSize', weightField: 'fontLogoWeight', italicField: 'fontLogoItalic', label: 'Brand Logo', hint: 'Navbar logo text', icon: '🎨', defaultSize: '1.25rem', defaultWeight: '700' },
            { field: 'fontNav', sizeField: 'fontNavSize', weightField: 'fontNavWeight', italicField: 'fontNavItalic', label: 'Navigation', hint: 'Navbar, sidebar, footer links', icon: '🧭', defaultSize: '0.85rem', defaultWeight: '500' },
            { field: 'fontBody', sizeField: 'fontBodySize', weightField: 'fontBodyWeight', italicField: 'fontBodyItalic', label: 'Body / Content', hint: 'Paragraphs, descriptions', icon: '📝', defaultSize: '0.9rem', defaultWeight: '400' },
            { field: 'fontUI', sizeField: 'fontUISize', weightField: 'fontUIWeight', italicField: 'fontUIItalic', label: 'UI / Labels', hint: 'Buttons, form labels, badges', icon: '🏷️', defaultSize: '0.8rem', defaultWeight: '600' },
            { field: 'fontMono', sizeField: 'fontMonoSize', weightField: 'fontMonoWeight', italicField: 'fontMonoItalic', label: 'Monospace / Code', hint: 'Code snippets, tech specs', icon: '💻', defaultSize: '0.85rem', defaultWeight: '400' },
        ]
    };
}

export default new SettingsService();
