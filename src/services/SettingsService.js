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
    }

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
            { field: 'fontDisplay', sizeField: 'fontDisplaySize', weightField: 'fontDisplayWeight', italicField: 'fontDisplayItalic', label: 'Display / Hero', hint: 'Hero name, banner titles', icon: '🎯', defaultSize: '2.5rem', defaultWeight: '800' },
            { field: 'fontHeading', sizeField: 'fontHeadingSize', weightField: 'fontHeadingWeight', italicField: 'fontHeadingItalic', label: 'Headings', hint: 'Section titles (H1, H2)', icon: '📌', defaultSize: '1.25rem', defaultWeight: '700' },
            { field: 'fontSubheading', sizeField: 'fontSubheadingSize', weightField: 'fontSubheadingWeight', italicField: 'fontSubheadingItalic', label: 'Sub Headings', hint: 'Card & modal titles (H3–H6)', icon: '📎', defaultSize: '1rem', defaultWeight: '600' },
            { field: 'fontLogo', sizeField: 'fontLogoSize', weightField: 'fontLogoWeight', italicField: 'fontLogoItalic', label: 'Header Logo', hint: 'Main site logo text', icon: '🎨', defaultSize: '1.25rem', defaultWeight: '800' },
            { field: 'fontNav', sizeField: 'fontNavSize', weightField: 'fontNavWeight', italicField: 'fontNavItalic', label: 'Header Menu Bar', hint: 'Main navigation links', icon: '🧭', defaultSize: '0.75rem', defaultWeight: '600' },
            { field: 'fontBody', sizeField: 'fontBodySize', weightField: 'fontBodyWeight', italicField: 'fontBodyItalic', label: 'Body / Content', hint: 'Paragraphs, descriptions', icon: '📝', defaultSize: '0.95rem', defaultWeight: '400' },
            { field: 'fontUI', sizeField: 'fontUISize', weightField: 'fontUIWeight', italicField: 'fontUIItalic', label: 'UI / Labels', hint: 'Buttons, form labels, badges', icon: '🏷️', defaultSize: '0.8rem', defaultWeight: '600' },
            { field: 'fontMono', sizeField: 'fontMonoSize', weightField: 'fontMonoWeight', italicField: 'fontMonoItalic', label: 'Monospace / Code', hint: 'Code snippets, tech specs', icon: '💻', defaultSize: '0.85rem', defaultWeight: '400' },
            { field: 'fontFooterTitle', sizeField: 'fontFooterTitleSize', weightField: 'fontFooterTitleWeight', italicField: 'fontFooterTitleItalic', label: 'Footer Titles', hint: 'Site Mirrors header', icon: '📁', defaultSize: '0.6rem', defaultWeight: '600' },
            { field: 'fontFooterLink', sizeField: 'fontFooterLinkSize', weightField: 'fontFooterLinkWeight', italicField: 'fontFooterLinkItalic', label: 'Footer Links', hint: 'Mirror & social links', icon: '🔗', defaultSize: '0.62rem', defaultWeight: '400' },
            { field: 'fontFooterText', sizeField: 'fontFooterTextSize', weightField: 'fontFooterTextWeight', italicField: 'fontFooterTextItalic', label: 'Footer Text', hint: 'Copyright notice', icon: '⚖️', defaultSize: '0.68rem', defaultWeight: '400' },
            { field: 'fontFooterBrand', sizeField: 'fontFooterBrandSize', weightField: 'fontFooterBrandWeight', italicField: 'fontFooterBrandItalic', label: 'Footer Brand', hint: 'Footer logo/name text', icon: '📛', defaultSize: '1.2rem', defaultWeight: '800' },
            { field: 'fontFooterTagline', sizeField: 'fontFooterTaglineSize', weightField: 'fontFooterTaglineWeight', italicField: 'fontFooterTaglineItalic', label: 'Footer Tagline', hint: 'Footer subtitle text', icon: '📝', defaultSize: '0.75rem', defaultWeight: '400' },
            { field: 'fontAdminBrand', sizeField: 'fontAdminBrandSize', weightField: 'fontAdminBrandWeight', italicField: 'fontAdminBrandItalic', label: 'Admin Brand', hint: 'Admin logo text', icon: '👑', defaultSize: '1.2rem', defaultWeight: '800' },
            { field: 'fontAdminMenu', sizeField: 'fontAdminMenuSize', weightField: 'fontAdminMenuWeight', italicField: 'fontAdminMenuItalic', label: 'Admin Panel Menu', hint: 'Sidebar navigation links', icon: '📂', defaultSize: '0.85rem', defaultWeight: '500' },
            { field: 'fontAdminTab', sizeField: 'fontAdminTabSize', weightField: 'fontAdminTabWeight', italicField: 'fontAdminTabItalic', label: 'Admin Tab Menu', hint: 'Page titles and top bar buttons', icon: '📑', defaultSize: '1rem', defaultWeight: '600' },
        ],
        presets: [
            {
                id: 'modern-minimal',
                label: 'Modern Minimal',
                description: 'Inter for everything, clean and professional.',
                icon: '✨',
                config: {
                    fontDisplay: 'inter', fontHeading: 'inter', fontSubheading: 'inter', 
                    fontLogo: 'inter', fontNav: 'inter', fontBody: 'inter', 
                    fontUI: 'inter', fontMono: 'inter',
                    fontFooterTitle: 'inter', fontFooterLink: 'inter', fontFooterText: 'inter',
                    fontFooterBrand: 'inter', fontFooterTagline: 'inter',
                    fontAdminBrand: 'inter', fontAdminMenu: 'inter', fontAdminTab: 'inter'
                }
            },
            {
                id: 'khmer-premium',
                label: 'Khmer Premium',
                description: 'Kantumruy Pro for titles, Battambang for body.',
                icon: '🐘',
                config: {
                    fontDisplay: 'kantumruy-pro-medium', fontHeading: 'kantumruy-pro-medium', 
                    fontSubheading: 'kantumruy-pro', fontLogo: 'kantumruy-pro-medium', 
                    fontNav: 'kantumruy-pro', fontBody: 'battambang', 
                    fontUI: 'kantumruy-pro', fontMono: 'jetbrains-mono',
                    fontFooterTitle: 'kantumruy-pro', fontFooterLink: 'kantumruy-pro', fontFooterText: 'battambang',
                    fontFooterBrand: 'kantumruy-pro-medium', fontFooterTagline: 'battambang',
                    fontAdminBrand: 'kantumruy-pro-medium', fontAdminMenu: 'kantumruy-pro', fontAdminTab: 'kantumruy-pro'
                }
            },
            {
                id: 'tech-developer',
                label: 'Tech Developer',
                description: 'High readability with JetBrains Mono and Fira Code.',
                icon: '💻',
                config: {
                    fontDisplay: 'jetbrains-mono', fontHeading: 'fira-code', 
                    fontSubheading: 'fira-code', fontLogo: 'jetbrains-mono', 
                    fontNav: 'jetbrains-mono', fontBody: 'inter', 
                    fontUI: 'inter', fontMono: 'jetbrains-mono',
                    fontFooterTitle: 'jetbrains-mono', fontFooterLink: 'inter', fontFooterText: 'inter',
                    fontFooterBrand: 'jetbrains-mono', fontFooterTagline: 'inter',
                    fontAdminBrand: 'jetbrains-mono', fontAdminMenu: 'jetbrains-mono', fontAdminTab: 'jetbrains-mono'
                }
            },
            {
                id: 'signature-pro',
                label: 'Signature Pro',
                description: 'World-class premium aesthetic with high-impact Inter weights.',
                icon: '🚀',
                config: {
                    fontDisplay: 'inter', fontDisplayWeight: '900', fontDisplaySize: '2rem', fontDisplayItalic: false,
                    fontHeading: 'inter', fontHeadingWeight: '700', fontHeadingSize: '1.25rem', fontHeadingItalic: false,
                    fontSubheading: 'inter', fontSubheadingWeight: '600', fontSubheadingSize: '1.1rem', fontSubheadingItalic: false,
                    fontLogo: 'inter', fontLogoWeight: '900', fontLogoSize: '1.3rem', fontLogoItalic: false,
                    fontNav: 'inter', fontNavWeight: '600', fontNavSize: '0.85rem', fontNavItalic: false,
                    fontBody: 'inter', fontBodyWeight: '400', fontBodySize: '0.9rem', fontBodyItalic: false,
                    fontUI: 'inter', fontUIWeight: '600', fontUISize: '0.8rem', fontUIItalic: false,
                    fontMono: 'jetbrains-mono', fontMonoWeight: '400', fontMonoSize: '0.85rem', fontMonoItalic: false,
                    fontFooterTitle: 'inter', fontFooterTitleWeight: '700', fontFooterTitleSize: '0.75rem', fontFooterTitleItalic: false,
                    fontFooterLink: 'inter', fontFooterLinkWeight: '500', fontFooterLinkSize: '0.75rem', fontFooterLinkItalic: false,
                    fontFooterText: 'inter', fontFooterTextWeight: '400', fontFooterTextSize: '0.75rem', fontFooterTextItalic: false,
                    fontFooterBrand: 'inter', fontFooterBrandWeight: '900', fontFooterBrandSize: '1.3rem', fontFooterBrandItalic: false,
                    fontFooterTagline: 'inter', fontFooterTaglineWeight: '500', fontFooterTaglineSize: '0.85rem', fontFooterTaglineItalic: false,
                    fontAdminBrand: 'inter', fontAdminBrandWeight: '900', fontAdminBrandSize: '1.3rem', fontAdminBrandItalic: false,
                    fontAdminMenu: 'inter', fontAdminMenuWeight: '600', fontAdminMenuSize: '0.85rem', fontAdminMenuItalic: false,
                    fontAdminTab: 'inter', fontAdminTabWeight: '700', fontAdminTabSize: '1.1rem', fontAdminTabItalic: false
                }
            }
        ]
    };
}

export default new SettingsService();
