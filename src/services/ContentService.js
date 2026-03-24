import BaseService from './BaseService';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

class ContentService extends BaseService {
    constructor() {
        super('content');
    }

    normalizeSectionData(sectionName, data) {
        if (!data || typeof data !== 'object') return data;

        if (sectionName === 'home') {
            return {
                ...data,
                greeting: data.greeting || '',
                name: data.name || '',
                subtitle: data.subtitle || '',
                description: data.description || data.heroDescription || data.introText || '',
                ctaText: data.ctaText || data.buttonText || '',
                ctaLink: data.ctaLink || data.buttonLink || '',
                profileImageUrl: data.profileImageUrl || data.imageUrl || ''
            };
        }

        if (sectionName === 'about') {
            return {
                ...data,
                bio: data.bio || data.about || data.aboutText || data.description || '',
                skills: Array.isArray(data.skills)
                    ? data.skills
                    : (typeof data.skills === 'string' ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [])
            };
        }

        if (sectionName === 'contact') {
            return {
                ...data,
                introText: data.introText || data.introduction || data.description || data.text || ''
            };
        }

        return data;
    }

    /**
     * Fetch a specific content section document (e.g. 'home', 'settings')
     * @param {string} sectionName 
     * @param {function(number, string): void} [trackRead] - Optional activity tracker callback
     * @returns {Promise<Object|null>} Database document data or null
     */
    async fetchSection(sectionName, trackRead) {
        const docRef = doc(db, this.collectionName, sectionName);
        const docSnap = await getDoc(docRef);

        if (trackRead) {
            trackRead(1, `Fetched ${sectionName} content`);
        }

        if (!docSnap.exists()) return null;
        return this.normalizeSectionData(sectionName, docSnap.data());
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
    }
}

export default new ContentService();
