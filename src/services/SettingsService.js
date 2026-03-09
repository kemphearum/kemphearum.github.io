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
}

export default new SettingsService();
