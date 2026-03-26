import BaseService from './BaseService';
import { db } from '../firebase';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { isActionAllowed, ACTIONS, MODULES } from '../utils/permissions';
import { normalizeProject, validateProject } from '../domain/project/projectDomain';
import { getLanguageFromStorage, localizeEntityFields } from '../utils/localization';

const PROJECT_LOCALIZED_FIELDS = ['title', 'description', 'content'];

class ProjectService extends BaseService {
    constructor() {
        super('projects');
    }

    localizeProject(project, lang = getLanguageFromStorage()) {
        return localizeEntityFields(project, PROJECT_LOCALIZED_FIELDS, lang);
    }

    /**
     * Toggles the visibility of a project
     * @param {string} userRole 
     * @param {string} id 
     * @param {boolean} currentVisible 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<void>}
     */
    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.PROJECTS, userRole)) {
            throw new Error("Unauthorized action");
        }
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    /**
     * Toggles the featured status of a project
     * @param {string} userRole 
     * @param {string} id 
     * @param {boolean} currentFeatured 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<void>}
     */
    async toggleFeatured(userRole, id, currentFeatured, trackWrite) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.PROJECTS, userRole)) {
            throw new Error("Unauthorized action");
        }
        return this.update(id, { featured: !currentFeatured }, trackWrite);
    }

    /**
     * Deletes a project
     * @param {string} userRole 
     * @param {string} id 
     * @param {function(number, string, Object): void} [trackDelete] 
     * @returns {Promise<void>}
     */
    async deleteProject(userRole, id, trackDelete) {
        if (!isActionAllowed(ACTIONS.DELETE, MODULES.PROJECTS, userRole)) {
            throw new Error("Unauthorized action");
        }
        return this.delete(id, (count, label) => {
            if (trackDelete) trackDelete(count, label, { id, action: 'deleted' });
        });
    }

    /**
     * Batch delete multiple projects.
     * @param {string} userRole 
     * @param {Array<string>} ids 
     * @param {function(number, string): void} [trackDelete] 
     * @returns {Promise<boolean>}
     */
    async batchDeleteProjects(userRole, ids, trackDelete) {
        if (!isActionAllowed(ACTIONS.DELETE, MODULES.PROJECTS, userRole)) {
            throw new Error("Unauthorized action");
        }
        return this.batchDelete(ids, trackDelete);
    }

    /**
     * Batch update visibility for projects.
     * @param {string} userRole 
     * @param {Array<string>} ids 
     * @param {boolean} visible 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<boolean>}
     */
    async batchUpdateProjectsVisibility(userRole, ids, visible, trackWrite) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.PROJECTS, userRole)) {
            throw new Error("Unauthorized action");
        }
        return this.batchUpdate(ids, { visible }, trackWrite);
    }

    /**
     * Batch update featured status for projects.
     * @param {string} userRole 
     * @param {Array<string>} ids 
     * @param {boolean} featured 
     * @param {function(number, string): void} [trackWrite] 
     * @returns {Promise<boolean>}
     */
    async batchUpdateProjectsFeatured(userRole, ids, featured, trackWrite) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.PROJECTS, userRole)) {
            throw new Error("Unauthorized action");
        }
        return this.batchUpdate(ids, { featured }, trackWrite);
    }

    /**
     * Prepares project form data for saving to Firestore by formatting techStack and slug.
     * @param {string} userRole 
     * @param {Object} formData 
     * @param {string} imageUrl 
     * @param {function(number, string, Object): void} [trackWrite] 
     * @returns {Promise<{isNew: boolean, id: string}>}
     */
    async saveProject(userRole, formData, imageUrl, trackWrite) {
        const action = formData.id ? ACTIONS.EDIT : ACTIONS.CREATE;
        if (!isActionAllowed(action, MODULES.PROJECTS, userRole)) {
            throw new Error("Unauthorized action");
        }

        // 1. Normalize
        const dataToSave = normalizeProject({ ...formData, imageUrl });

        // 2. Validate
        const errors = validateProject(dataToSave);
        if (errors) {
            throw new Error(`Validation failed: ${Object.values(errors).join(', ')}`);
        }

        // 3. Handle duplicates by slug
        let targetId = formData.id;
        if (!targetId) {
            const existing = await this.fetchProjectBySlug(dataToSave.slug, null, true);
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
     * Fetch a specific project by its slug
     * @param {string} slug 
     * @param {function(number, string, Object): void} [trackRead] 
     * @param {boolean} [includeHidden=false] 
     * @returns {Promise<Object|null>}
     */
    async fetchProjectBySlug(slug, trackRead, includeHidden = false, options = {}) {
        let q = query(collection(db, this.collectionName), where("slug", "==", slug));
        let querySnapshot = await getDocs(q);

        if (trackRead) {
            trackRead(querySnapshot.size, `Queried project by slug: ${slug}`);
        }

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            if (!includeHidden && docData.visible === false) return null;
            const project = { id: querySnapshot.docs[0].id, ...docData };
            return options.localized ? this.localizeProject(project, options.lang) : project;
        }

        // Fallback: Check if the slug is actually an ID
        const docById = await this.getById(slug);
        if (docById) {
            if (!includeHidden && docById.visible === false) return null;
            return options.localized ? this.localizeProject(docById, options.lang) : docById;
        }

        return null;
    }

    /**
     * Fetch related projects based on tech stack
     * @param {string} currentProjectId 
     * @param {Array<string>} techStack 
     * @param {function(number, string, Object): void} [trackRead] 
     * @returns {Promise<Array<Object>>}
     */
    async fetchRelatedProjects(currentProjectId, techStack, trackRead, options = {}) {
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

        return options.localized
            ? projectsData.map((project) => this.localizeProject(project, options.lang))
            : projectsData;
    }

    /**
     * Build unique project taxonomy suggestions from Firestore tech stacks.
     * @returns {Promise<Array<string>>}
     */
    async getCategorySuggestions() {
        const projects = await this.getAll();
        const byKey = new Map();

        projects.forEach((project) => {
            // Prefer published/visible content for end-user filter suggestions.
            if (project?.visible === false) return;

            const rawStack = Array.isArray(project?.techStack)
                ? project.techStack
                : (typeof project?.techStack === 'string' ? project.techStack.split(',') : []);

            rawStack.forEach((item) => {
                const normalized = String(item || '').trim().replace(/\s+/g, ' ');
                if (!normalized) return;
                const key = normalized.toLowerCase();
                if (!byKey.has(key)) byKey.set(key, normalized);
            });
        });

        return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
    }

    /**
     * Fetch aggregate project counts for dashboard stat cards.
     * @returns {Promise<{total:number,published:number,featured:number,linked:number}>}
     */
    async fetchStats() {
        const collectionRef = collection(db, this.collectionName);

        const [totalSnap, publishedSnap, featuredSnap, projects] = await Promise.all([
            getCountFromServer(collectionRef),
            getCountFromServer(query(collectionRef, where('visible', '==', true))),
            getCountFromServer(query(collectionRef, where('featured', '==', true))),
            this.getAll()
        ]);

        const total = Number(totalSnap.data()?.count || 0);
        const published = Number(publishedSnap.data()?.count || 0);
        const featured = Number(featuredSnap.data()?.count || 0);
        const linked = projects.filter((project) => project.liveUrl || project.githubUrl).length;

        return {
            total,
            published,
            featured,
            linked
        };
    }
}

export default new ProjectService();
