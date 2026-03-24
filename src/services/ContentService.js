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
     * @param {function(number, string): void} [trackRead] - Optional activity tracker callback
     * @returns {Promise<Object|null>} Database document data or null
     */
    async fetchSection(sectionName, trackRead) {
        return BaseService.safe(async () => {
            const docRef = doc(db, this.collectionName, sectionName);
            const docSnap = await getDoc(docRef);

            if (trackRead) {
                trackRead(1, `Fetched ${sectionName} content`);
            }

            return docSnap.exists() ? docSnap.data() : null;
        });
    }

    /**
     * Saves a data block payload into the content collection.
     * Merges with existing settings.
     * Automatically invalidates caching.
     * @param {string} sectionName 
     * @param {Object} data 
     * @param {function(number, string, Object): void} [trackWrite] - Optional activity tracker
     * @param {Object} [options] - Optional settings
     * @param {boolean} [options.skipHistory] - If true, don't store in audit history
     * @returns {Promise<Object>} The saved data
     */
    async saveSection(sectionName, data, trackWrite, options = {}) {
        return BaseService.safe(async () => {
            const docRef = doc(db, this.collectionName, sectionName);
            await setDoc(docRef, data, { merge: true });

            // Store in audit history subcollection
            if (this.useHistory && !options.skipHistory) {
                await this._saveHistory(sectionName, 'updated', data);
            }

            if (trackWrite) {
                trackWrite(1, `Saved ${sectionName} content`, data);
            }

            return data;
        });
    }
}

export default new ContentService();
