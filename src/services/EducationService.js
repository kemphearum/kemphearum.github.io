import BaseService from './BaseService';
import { serverTimestamp } from 'firebase/firestore';
import { normalizeEducation, validateEducation } from '../domain/education/educationDomain';
import { getLanguageFromStorage, getLocalizedField, localizeEntityFields } from '../utils/localization';

const EDUCATION_LOCALIZED_FIELDS = ['school', 'degree', 'fieldOfStudy', 'description'];

class EducationService extends BaseService {
    constructor() {
        super('education');
    }

    localizeEducation(education, lang = getLanguageFromStorage()) {
        return localizeEntityFields(education, EDUCATION_LOCALIZED_FIELDS, lang);
    }

    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    async deleteEducation(userRole, id, trackDelete) {
        return this.delete(id, (count, label) => {
            if (trackDelete) trackDelete(count, label, { id, action: 'deleted' });
        });
    }

    async saveEducation(userRole, formData, trackWrite) {
        // 1. Normalize
        const dataToSave = normalizeEducation(formData);

        // 2. Validate
        const errors = validateEducation(dataToSave);
        if (errors) {
            throw new Error(`Validation failed: ${Object.values(errors).join(', ')}`);
        }

        if (formData.id) {
            await this.update(formData.id, dataToSave, (count, label) => {
                if (trackWrite) trackWrite(count, label, dataToSave);
            });
            return { isNew: false, id: formData.id };
        } else {
            dataToSave.createdAt = serverTimestamp();
            const newId = await this.create(dataToSave, (count, label) => {
                if (trackWrite) trackWrite(count, label, dataToSave);
            });
            return { isNew: true, id: newId };
        }
    }

    async fetchStats(lang = getLanguageFromStorage()) {
        const educationList = await this.getAll();

        const visible = educationList.filter((item) => item.visible !== false).length;
        const schools = new Set(
            educationList
                .map((item) => getLocalizedField(item.school, lang))
                .filter(Boolean)
        ).size;

        return {
            total: educationList.length,
            visible,
            schools
        };
    }
}

export default new EducationService();
