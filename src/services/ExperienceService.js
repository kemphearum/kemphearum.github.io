import BaseService from './BaseService';
import { serverTimestamp } from 'firebase/firestore';
import { isActionAllowed, ACTIONS, MODULES } from '../utils/permissions';

class ExperienceService extends BaseService {
    constructor() {
        super('experience');
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

        const formatMonthYear = (yyyyMm) => {
            if (!yyyyMm || typeof yyyMm !== 'string' || !yyyyMm.includes('-')) return yyyyMm || '';
            const [year, month] = yyyMm.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleString('default', { month: 'short', year: 'numeric' });
        };

        const startLabel = formatMonthYear(formData.startMonthYear);
        const endLabel = formData.current ? 'Present' : formatMonthYear(formData.endMonthYear);

        const dataToSave = {
            company: formData.company,
            role: formData.role,
            startDate: startLabel,
            startMonthYear: formData.startMonthYear,
            endDate: endLabel,
            endMonthYear: formData.current ? '' : formData.endMonthYear,
            period: `${startLabel} - ${endLabel}`,
            current: formData.current,
            description: formData.description,
            visible: formData.visible !== false, // Default to true if undefined
            order: formData.order || 0
        };

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
