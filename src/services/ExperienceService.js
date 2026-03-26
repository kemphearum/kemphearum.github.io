import BaseService from './BaseService';
import { serverTimestamp } from 'firebase/firestore';
import { isActionAllowed, ACTIONS, MODULES } from '../utils/permissions';
import { normalizeExperience, validateExperience } from '../domain/experience/experienceDomain';
import { getLanguageFromStorage, getLocalizedField, localizeEntityFields } from '../utils/localization';

const EXPERIENCE_LOCALIZED_FIELDS = ['company', 'role', 'description'];

class ExperienceService extends BaseService {
    constructor() {
        super('experience');
    }

    localizeExperience(experience, lang = getLanguageFromStorage()) {
        return localizeEntityFields(experience, EXPERIENCE_LOCALIZED_FIELDS, lang);
    }

    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        if (!isActionAllowed(ACTIONS.EDIT, MODULES.EXPERIENCE, userRole)) {
            throw new Error("Unauthorized action");
        }
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    async deleteExperience(userRole, id, trackDelete) {
        if (!isActionAllowed(ACTIONS.DELETE, MODULES.EXPERIENCE, userRole)) {
            throw new Error("Unauthorized action");
        }
        return this.delete(id, (count, label) => {
            if (trackDelete) trackDelete(count, label, { id, action: 'deleted' });
        });
    }

    /**
     * Prepares experience form data for saving to Firestore by formatting dates.
     * Replaces direct object manipulation in the UI component.
     */
    async saveExperience(userRole, formData, trackWrite) {
        const action = formData.id ? ACTIONS.EDIT : ACTIONS.CREATE;
        if (!isActionAllowed(action, MODULES.EXPERIENCE, userRole)) {
            throw new Error("Unauthorized action");
        }

        // 1. Normalize
        const dataToSave = normalizeExperience(formData);

        // 2. Validate
        const errors = validateExperience(dataToSave);
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
        const experiences = await this.getAll();

        const isCurrentRole = (item) => {
            if (item.current === true) return true;
            const rawEnd = `${item.endMonthYear || item.endDate || item.period || ''}`.toLowerCase();
            return rawEnd.includes('present');
        };

        const visible = experiences.filter((item) => item.visible !== false).length;
        const currentRoles = experiences.filter((item) => isCurrentRole(item)).length;
        const companies = new Set(
            experiences
                .map((item) => getLocalizedField(item.company, lang))
                .filter(Boolean)
        ).size;

        return {
            total: experiences.length,
            visible,
            companies,
            currentRoles
        };
    }
}

export default new ExperienceService();
