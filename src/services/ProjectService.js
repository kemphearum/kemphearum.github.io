import BaseService from './BaseService';
import { db } from '../firebase';
import { serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

class ProjectService extends BaseService {
    constructor() {
        super('projects');
    }

    generateSlug(title) {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        if (userRole === 'pending') {
            throw new Error("Not authorized to toggle visibility.");
        }
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    async toggleFeatured(userRole, id, currentFeatured, trackWrite) {
        if (userRole === 'pending' || userRole === 'editor') {
            throw new Error("Not authorized to toggle featured status.");
        }
        return this.update(id, { featured: !currentFeatured }, trackWrite);
    }

    async deleteProject(userRole, id, trackDelete) {
        if (userRole === 'pending' || userRole === 'editor') {
            throw new Error("Not authorized to delete projects.");
        }
        return this.delete(id, trackDelete);
    }

    /**
     * Prepares project form data for saving to Firestore by formatting techStack and slug.
     */
    async saveProject(userRole, formData, imageUrl, trackWrite) {
        if (userRole === 'pending') {
            throw new Error("Not authorized to save projects.");
        }

        const techArray = formData.techStack
            ? formData.techStack.split(',').map(t => t.trim()).filter(t => t)
            : [];

        const slug = formData.slug || this.generateSlug(formData.title);

        const dataToSave = {
            title: formData.title,
            description: formData.description,
            techStack: techArray,
            githubUrl: formData.githubUrl,
            liveUrl: formData.liveUrl,
            slug,
            content: formData.content,
            visible: formData.visible !== false, // default true
            featured: !!formData.featured // default false
        };

        if (imageUrl !== undefined) {
            dataToSave.imageUrl = imageUrl;
        }

        if (formData.id) {
            await this.update(formData.id, dataToSave, trackWrite);
            return { isNew: false, id: formData.id };
        } else {
            dataToSave.createdAt = serverTimestamp();
            const newId = await this.create(dataToSave, trackWrite);
            return { isNew: true, id: newId };
        }
    }

    /**
     * Fetch a specific project by its slug
     * @param {string} slug 
     * @param {Function} trackRead 
     * @returns {Promise<Object|null>}
     */
    async fetchProjectBySlug(slug, trackRead) {
        const q = query(collection(db, this.collectionName), where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (trackRead) {
            trackRead(querySnapshot.size, `Queried project by slug: ${slug}`);
        }

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            if (docData.visible === false) return null;
            return { id: querySnapshot.docs[0].id, ...docData };
        }
        return null;
    }

    /**
     * Fetch related projects based on tech stack
     * @param {string} currentProjectId 
     * @param {Array<string>} techStack 
     * @param {Function} trackRead 
     * @returns {Promise<Array<Object>>}
     */
    async fetchRelatedProjects(currentProjectId, techStack, trackRead) {
        const q = query(
            collection(db, this.collectionName),
            where("visible", "==", true)
        );

        const querySnapshot = await getDocs(q);

        if (trackRead) {
            trackRead(querySnapshot.size, 'Queried related projects');
        }

        let allVisibleProjects = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(project => project.id !== currentProjectId);

        // Sort by createdAt descending
        allVisibleProjects.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });

        let projectsData = [];

        if (techStack && techStack.length > 0) {
            // Find projects with matching tech stack
            projectsData = allVisibleProjects.filter(project =>
                project.techStack && project.techStack.some(t => techStack.includes(t))
            );
        }

        // Use matches if found, otherwise fall back to newest
        if (projectsData.length > 0) {
            projectsData = projectsData.slice(0, 3);
        } else {
            projectsData = allVisibleProjects.slice(0, 3);
        }

        return projectsData;
    }
}

export default new ProjectService();
