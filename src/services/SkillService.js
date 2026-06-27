import BaseService from './BaseService';
import { serverTimestamp } from 'firebase/firestore';
import { normalizeSkill, validateSkill } from '../domain/skill/skillDomain';
import { getLanguageFromStorage, localizeEntityFields } from '../utils/localization';

const SKILL_LOCALIZED_FIELDS = ['name', 'description'];

class SkillService extends BaseService {
    constructor() {
        super('skills');
    }

    localizeSkill(skill, lang = getLanguageFromStorage()) {
        return localizeEntityFields(skill, SKILL_LOCALIZED_FIELDS, lang);
    }

    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    async toggleFeatured(userRole, id, currentFeatured, trackWrite) {
        return this.update(id, { featured: !currentFeatured }, trackWrite);
    }

    async deleteSkill(userRole, id, trackDelete) {
        return this.delete(id, trackDelete);
    }

    async batchDeleteSkills(userRole, ids, trackDelete) {
        return this.batchDelete(ids, trackDelete);
    }

    async batchUpdateSkillsVisibility(userRole, ids, visible, trackWrite) {
        return this.batchUpdate(ids, { visible }, trackWrite);
    }

    async batchUpdateSkillsFeatured(userRole, ids, featured, trackWrite) {
        return this.batchUpdate(ids, { featured }, trackWrite);
    }

    async saveSkill(userRole, formData, trackWrite) {
        const dataToSave = normalizeSkill(formData);
        const errors = validateSkill(dataToSave);
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
        const skills = await this.getAll();
        const categories = new Set(
            skills.map((item) => (item.category || '').trim()).filter(Boolean)
        ).size;

        return {
            total: skills.length,
            visible: skills.filter((item) => item.visible !== false).length,
            featured: skills.filter((item) => item.featured).length,
            categories
        };
    }
}

export default new SkillService();
