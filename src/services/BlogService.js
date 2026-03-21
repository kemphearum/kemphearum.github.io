import BaseService from './BaseService';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { isActionAllowed, ACTIONS, MODULES } from '../utils/permissions';

class BlogService extends BaseService {
    constructor() {
        super('posts');
    }

    // Example of adding specific business logic and role checks
    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.BLOG, userRole)) {
            throw new Error("Unauthorized action");
        }
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    async toggleFeatured(userRole, id, currentFeatured, trackWrite) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.BLOG, userRole)) {
            throw new Error("Unauthorized action");
        }
        return this.update(id, { featured: !currentFeatured }, trackWrite);
    }

    async deletePost(userRole, id, trackDelete) {
        if (!isActionAllowed(ACTIONS.DELETE, MODULES.BLOG, userRole)) {
            throw new Error("Unauthorized action");
        }
        return this.delete(id, (count, label) => {
            if (trackDelete) trackDelete(count, label, { id, action: 'deleted' });
        });
    }

    /**
     * Fetch a specific blog post by its slug
     * @param {string} slug 
     * @param {Function} trackRead 
     * @returns {Promise<Object|null>}
     */
    async fetchPostBySlug(slug, trackRead, includeHidden = false) {
        let q = query(collection(db, this.collectionName), where("slug", "==", slug));
        let querySnapshot = await getDocs(q);

        if (trackRead) {
            trackRead(querySnapshot.size, `Queried blog post by slug: ${slug}`, { slug, count: querySnapshot.size });
        }

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            if (!includeHidden && docData.visible === false) return null;
            return { id: querySnapshot.docs[0].id, ...docData };
        }

        // Fallback: Check if the slug is actually an ID
        const docById = await this.getById(slug);
        if (docById) {
            if (!includeHidden && docById.visible === false) return null;
            return docById;
        }

        return null;
    }

    /**
     * Fetch related blog posts based on tags
     * @param {string} currentPostId 
     * @param {Array<string>} tags 
     * @param {Function} trackRead 
     * @returns {Promise<Array<Object>>}
     */
    async fetchRelatedPosts(currentPostId, tags, trackRead) {
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

        return postsData;
    }

    /**
     * Prepares blog post form data for saving to Firestore by formatting tags and slug.
     */
    async savePost(userRole, formData, trackWrite) {
        const action = formData.id ? ACTIONS.EDIT : ACTIONS.CREATE;
        if (!isActionAllowed(action, MODULES.BLOG, userRole)) {
            throw new Error("Unauthorized action");
        }

        const tagsArray = typeof formData.tags === 'string'
            ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
            : (Array.isArray(formData.tags) ? formData.tags : []);

        const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Check for existing post by slug if no ID is provided
        let targetId = formData.id;
        if (!targetId) {
            const existing = await this.fetchPostBySlug(slug, null, true);
            if (existing) {
                targetId = existing.id;
            }
        }

        const dataToSave = {
            title: formData.title || 'Untitled Post',
            slug,
            excerpt: formData.excerpt || '',
            content: formData.content || '',
            tags: tagsArray,
            visible: formData.visible !== false, // default true
            featured: !!formData.featured // default false
        };

        if (formData.coverImage !== undefined) {
            dataToSave.coverImage = formData.coverImage || '';
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
}

export default new BlogService();
