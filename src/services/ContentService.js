import BaseService from './BaseService';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

class ContentService extends BaseService {
    constructor() {
        super('content');
    }

    /**
     * Fetch a specific content section document (e.g. 'home', 'settings')
     * @param {string} sectionName 
     * @param {Function} trackRead - Optional activity tracker callback
     * @returns {Promise<Object|null>} The parsed data block, or null.
     */
    async fetchSection(sectionName, trackRead) {
        const docRef = doc(db, this.collectionName, sectionName);
        const docSnap = await getDoc(docRef);

        if (trackRead) {
            trackRead(1, `Fetched ${sectionName} content`);
        }

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null; // or `{}` depending on how the UI wants to handle misses
    }

    /**
     * Saves a data block payload into the content collection.
     * Merges with existing settings.
     * Automatically invalidates caching.
     * @param {string} sectionName 
     * @param {Object} data 
     * @param {Function} trackWrite - Optional activity tracker
     * @param {Object} options - Optional settings (e.g. { skipHistory: true })
     */
    async saveSection(sectionName, data, trackWrite, options = {}) {
        const docRef = doc(db, this.collectionName, sectionName);
        await setDoc(docRef, data, { merge: true });

        // Store in audit history subcollection
        if (this.useHistory && !options.skipHistory) {
            try {
                await this._saveHistory(sectionName, 'updated', data);
            } catch (error) {
                console.error(`Failed to save history for ${sectionName}:`, error);
            }
        }

        if (trackWrite) {
            trackWrite(1, `Saved ${sectionName} content`, data);
        }

        return data;
    }
}

export default new ContentService();
