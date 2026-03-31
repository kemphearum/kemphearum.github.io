import BaseService from './BaseService';
import { db } from '../firebase';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { isActionAllowed, ACTIONS, MODULES } from '../utils/permissions';
import { normalizePost, validatePost } from '../domain/blog/blogDomain';
import { getLanguageFromStorage, localizeEntityFields } from '../utils/localization';

const BLOG_LOCALIZED_FIELDS = ['title', 'excerpt', 'content'];

class BlogService extends BaseService {
    constructor() {
        super('posts');
    }

    localizePost(post, lang = getLanguageFromStorage()) {
        return localizeEntityFields(post, BLOG_LOCALIZED_FIELDS, lang);
    }

    /**
     * Toggles the visibility of a blog post
     * @param {string} userRole 
     * @param {string} id 
     * @param {boolean} currentVisible 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<void>}
     */
    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        // Validation handled in UI and Firestore rules
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    /**
     * Toggles the featured status of a blog post
     * @param {string} userRole 
     * @param {string} id 
     * @param {boolean} currentFeatured 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<void>}
     */
    async toggleFeatured(userRole, id, currentFeatured, trackWrite) {
        // Validation handled in UI and Firestore rules
        return this.update(id, { featured: !currentFeatured }, trackWrite);
    }

    /**
     * Deletes a blog post
     * @param {string} userRole 
     * @param {string} id 
     * @param {function(number, string, Object): void} [trackDelete] 
     * @returns {Promise<void>}
     */
    async deletePost(userRole, id, trackDelete) {
        // Validation handled in UI and Firestore rules
        return this.delete(id, (count, label) => {
            if (trackDelete) trackDelete(count, label, { id, action: 'deleted' });
        });
    }

    /**
     * Batch delete multiple blog posts.
     * @param {string} userRole 
     * @param {Array<string>} ids 
     * @param {function(number, string): void} [trackDelete] 
     * @returns {Promise<boolean>}
     */
    async batchDeletePosts(userRole, ids, trackDelete) {
        // Validation handled in UI and Firestore rules
        return this.batchDelete(ids, trackDelete);
    }

    /**
     * Batch update visibility for blog posts.
     * @param {string} userRole 
     * @param {Array<string>} ids 
     * @param {boolean} visible 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<boolean>}
     */
    async batchUpdatePostsVisibility(userRole, ids, visible, trackWrite) {
        // Validation handled in UI and Firestore rules
        return this.batchUpdate(ids, { visible }, trackWrite);
    }

    /**
     * Batch update featured status for blog posts.
     * @param {string} userRole 
     * @param {Array<string>} ids 
     * @param {boolean} featured 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<boolean>}
     */
    async batchUpdatePostsFeatured(userRole, ids, featured, trackWrite) {
        // Validation handled in UI and Firestore rules
        return this.batchUpdate(ids, { featured }, trackWrite);
    }

    /**
     * Fetch a specific blog post by its slug
     * @param {string} slug 
     * @param {function(number, string, Object): void} [trackRead] 
     * @param {boolean} [includeHidden=false] 
     * @returns {Promise<Object|null>}
     */
    async fetchPostBySlug(slug, trackRead, includeHidden = false, options = {}) {
        let q = query(collection(db, this.collectionName), where("slug", "==", slug));
        let querySnapshot = await getDocs(q);

        if (trackRead) {
            trackRead(querySnapshot.size, `Queried blog post by slug: ${slug}`, { slug, count: querySnapshot.size });
        }

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            if (!includeHidden && docData.visible === false) return null;
            const post = { id: querySnapshot.docs[0].id, ...docData };
            return options.localized ? this.localizePost(post, options.lang) : post;
        }

        // Fallback: Check if the slug is actually an ID
        const docById = await this.getById(slug);
        if (docById) {
            if (!includeHidden && docById.visible === false) return null;
            return options.localized ? this.localizePost(docById, options.lang) : docById;
        }

        return null;
    }

    /**
     * Fetch related blog posts based on tags
     * @param {string} currentPostId 
     * @param {Array<string>} tags 
     * @param {function(number, string, Object): void} [trackRead] 
     * @returns {Promise<Array<Object>>}
     */
    async fetchRelatedPosts(currentPostId, tags, trackRead, options = {}) {
        const q = query(
            collection(db, this.collectionName),
            where("visible", "==", true)
        );

        const querySnapshot = await getDocs(q);

        if (trackRead) {
            trackRead(querySnapshot.size, 'Queried related blog posts', { tags, count: querySnapshot.size });
        }

        let allVisiblePosts = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(post => post.id !== currentPostId);

        // Sort by createdAt descending
        allVisiblePosts.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });

        let postsData = [];

        if (tags && tags.length > 0) {
            // Find posts with matching tags
            postsData = allVisiblePosts.filter(post =>
                post.tags && post.tags.some(t => tags.includes(t))
            );
        }

        if (postsData.length > 0) {
            postsData = postsData.slice(0, 3);
        } else {
            postsData = allVisiblePosts.slice(0, 3);
        }

        return options.localized
            ? postsData.map((post) => this.localizePost(post, options.lang))
            : postsData;
    }

    /**
     * Prepares blog post form data for saving to Firestore by formatting tags and slug.
     * @param {string} userRole 
     * @param {Object} formData 
     * @param {function(number, string, Object): void} [trackWrite] 
     * @returns {Promise<{isNew: boolean, id: string}>}
     */
    async savePost(userRole, formData, trackWrite) {
        const action = formData.id ? ACTIONS.EDIT : ACTIONS.CREATE;
        // Validation handled in UI and Firestore rules

        // 1. Normalize
        const dataToSave = normalizePost(formData);

        // 2. Validate
        const errors = validatePost(dataToSave);
        if (errors) {
            throw new Error(`Validation failed: ${Object.values(errors).join(', ')}`);
        }

        // 3. Handle duplicates by slug
        let targetId = formData.id;
        if (!targetId) {
            const existing = await this.fetchPostBySlug(dataToSave.slug, null, true);
            if (existing) {
                targetId = existing.id;
            }
        }

        const { serverTimestamp } = await import('firebase/firestore');

        if (targetId) {
            await this.update(targetId, dataToSave, (count, label) => {
                if (trackWrite) trackWrite(count, label, dataToSave);
            });
            return { isNew: false, id: targetId };
        } else {
            dataToSave.createdAt = serverTimestamp();
            const newId = await this.create(dataToSave, (count, label) => {
                if (trackWrite) trackWrite(count, label, dataToSave);
            });
            return { isNew: true, id: newId };
        }
    }

    /**
     * Build unique blog taxonomy suggestions from Firestore tags.
     * @returns {Promise<Array<string>>}
     */
    async getTagSuggestions() {
        const posts = await this.getAll();
        const byKey = new Map();

        posts.forEach((post) => {
            // Prefer published/visible content for end-user filter suggestions.
            if (post?.visible === false) return;

            const rawTags = Array.isArray(post?.tags)
                ? post.tags
                : (typeof post?.tags === 'string' ? post.tags.split(',') : []);

            rawTags.forEach((item) => {
                const normalized = String(item || '').trim().replace(/\s+/g, ' ');
                if (!normalized) return;
                const key = normalized.toLowerCase();
                if (!byKey.has(key)) byKey.set(key, normalized);
            });
        });

        return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
    }

    /**
     * Fetch aggregate blog counts for dashboard stat cards.
     * @returns {Promise<{total:number,published:number,featured:number,drafts:number}>}
     */
    async fetchStats() {
        const collectionRef = collection(db, this.collectionName);

        const [totalSnap, publishedSnap, featuredSnap] = await Promise.all([
            getCountFromServer(collectionRef),
            getCountFromServer(query(collectionRef, where('visible', '==', true))),
            getCountFromServer(query(collectionRef, where('featured', '==', true)))
        ]);

        const total = Number(totalSnap.data()?.count || 0);
        const published = Number(publishedSnap.data()?.count || 0);
        const featured = Number(featuredSnap.data()?.count || 0);
        const drafts = Math.max(0, total - published);

        return {
            total,
            published,
            featured,
            drafts
        };
    }
}

export default new BlogService();
