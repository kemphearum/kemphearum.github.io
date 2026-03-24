import BaseService from './BaseService';
import { serverTimestamp } from 'firebase/firestore';
import { isActionAllowed, ACTIONS, MODULES } from '../utils/permissions';
import { normalizeExperience, validateExperience } from '../domain/experience/experienceDomain';
import { getLanguageFromStorage, localizeEntityFields } from '../utils/localization';

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
}

export default new ExperienceService();
