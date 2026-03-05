import BaseService from './BaseService';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

class BlogService extends BaseService {
    constructor() {
        super('posts');
    }

    // Example of adding specific business logic and role checks
    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        if (userRole !== 'superadmin' && userRole !== 'admin') {
            throw new Error("Unauthorized to change visibility.");
        }
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    async toggleFeatured(userRole, id, currentFeatured, trackWrite) {
        if (userRole !== 'superadmin' && userRole !== 'admin') {
            throw new Error("Unauthorized to change featured status.");
        }
        return this.update(id, { featured: !currentFeatured }, trackWrite);
    }

    async deletePost(userRole, id, trackDelete) {
        if (userRole !== 'superadmin') {
            throw new Error("Only Superadmins can delete posts.");
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
    async fetchPostBySlug(slug, trackRead) {
        const q = query(collection(db, this.collectionName), where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (trackRead) {
            trackRead(querySnapshot.size, `Queried blog post by slug: ${slug}`);
        }

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            if (docData.visible === false) return null;
            return { id: querySnapshot.docs[0].id, ...docData };
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
            trackRead(querySnapshot.size, 'Queried related blog posts');
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
}

export default new BlogService();
