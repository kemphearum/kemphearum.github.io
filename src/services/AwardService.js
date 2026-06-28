import BaseService from './BaseService';
import { serverTimestamp } from 'firebase/firestore';
import { normalizeAward, validateAward } from '../domain/award/awardDomain';
import { getLanguageFromStorage, localizeEntityFields } from '../utils/localization';

const AWARD_LOCALIZED_FIELDS = ['title', 'organization', 'description'];

class AwardService extends BaseService {
    constructor() {
        super('awards');
    }

    localizeAward(award, lang = getLanguageFromStorage()) {
        return localizeEntityFields(award, AWARD_LOCALIZED_FIELDS, lang);
    }

    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    async toggleFeatured(userRole, id, currentFeatured, trackWrite) {
        return this.update(id, { featured: !currentFeatured }, trackWrite);
    }

    async deleteAward(userRole, id, trackDelete) {
        return this.delete(id, trackDelete);
    }

    async batchDeleteAwards(userRole, ids, trackDelete) {
        return this.batchDelete(ids, trackDelete);
    }

    async batchUpdateAwardsVisibility(userRole, ids, visible, trackWrite) {
        return this.batchUpdate(ids, { visible }, trackWrite);
    }

    async batchUpdateAwardsFeatured(userRole, ids, featured, trackWrite) {
        return this.batchUpdate(ids, { featured }, trackWrite);
    }

    async saveAward(userRole, formData, trackWrite) {
        const dataToSave = normalizeAward(formData);
        const errors = validateAward(dataToSave);
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

export default new AwardService();
