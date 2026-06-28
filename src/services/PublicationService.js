import BaseService from './BaseService';
import { serverTimestamp } from 'firebase/firestore';
import { normalizePublication, validatePublication } from '../domain/publication/publicationDomain';
import { getLanguageFromStorage, localizeEntityFields } from '../utils/localization';

const PUBLICATION_LOCALIZED_FIELDS = ['title', 'publisher', 'description'];

class PublicationService extends BaseService {
    constructor() {
        super('publications');
    }

    localizePublication(publication, lang = getLanguageFromStorage()) {
        return localizeEntityFields(publication, PUBLICATION_LOCALIZED_FIELDS, lang);
    }

    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    async toggleFeatured(userRole, id, currentFeatured, trackWrite) {
        return this.update(id, { featured: !currentFeatured }, trackWrite);
    }

    async deletePublication(userRole, id, trackDelete) {
        return this.delete(id, trackDelete);
    }

    async batchDeletePublications(userRole, ids, trackDelete) {
        return this.batchDelete(ids, trackDelete);
    }

    async batchUpdatePublicationsVisibility(userRole, ids, visible, trackWrite) {
        return this.batchUpdate(ids, { visible }, trackWrite);
    }

    async batchUpdatePublicationsFeatured(userRole, ids, featured, trackWrite) {
        return this.batchUpdate(ids, { featured }, trackWrite);
    }

    async savePublication(userRole, formData, trackWrite) {
        const dataToSave = normalizePublication(formData);
        const errors = validatePublication(dataToSave);
        if (errors) {
            throw new Error(`Validation failed: ${Object.values(errors).join(', ')}`);
        }

        if (formData.id) {
            await this.update(formData.id, dataToSave, trackWrite);
            return { isNew: false, id: formData.id };
        }

        dataToSave.createdAt = serverTimestamp();
        const newId = await this.create(dataToSave, trackWrite);
        return { isNew: true, id: newId };
    }

    async fetchStats() {
        const items = await this.getAll();
        return {
            total: items.length,
            visible: items.filter((item) => item.visible !== false).length,
            featured: items.filter((item) => item.featured).length
        };
    }
}

export default new PublicationService();
