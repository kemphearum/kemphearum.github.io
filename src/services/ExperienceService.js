import BaseService from './BaseService';
import { serverTimestamp } from 'firebase/firestore';

class ExperienceService extends BaseService {
    constructor() {
        super('experience');
    }

    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        if (userRole === 'pending') {
            throw new Error("Not authorized to toggle visibility.");
        }
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    async deleteExperience(userRole, id, trackDelete) {
        if (userRole === 'pending' || userRole === 'editor') {
            throw new Error("Not authorized to delete experience records.");
        }
        return this.delete(id, trackDelete);
    }

    /**
     * Prepares experience form data for saving to Firestore by formatting dates.
     * Replaces direct object manipulation in the UI component.
     */
    async saveExperience(userRole, formData, trackWrite) {
        if (userRole === 'pending') {
            throw new Error("Not authorized to save experience records.");
        }

        const formatMonthYear = (yyyyMm) => {
            if (!yyyyMm) return '';
            const [year, month] = yyyMm.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleString('default', { month: 'short', year: 'numeric' });
        };

        const dataToSave = {
            company: formData.company,
            role: formData.role,
            startDate: formatMonthYear(formData.startMonthYear),
            startMonthYear: formData.startMonthYear,
            endDate: formData.current ? 'Present' : formatMonthYear(formData.endMonthYear),
            endMonthYear: formData.current ? '' : formData.endMonthYear,
            current: formData.current,
            description: formData.description,
            visible: formData.visible !== false, // Default to true if undefined
            order: formData.order || 0
        };

        if (formData.id) {
            await this.update(formData.id, dataToSave, trackWrite);
            return { isNew: false, id: formData.id };
        } else {
            dataToSave.createdAt = serverTimestamp();
            const newId = await this.create(dataToSave, trackWrite);
            return { isNew: true, id: newId };
        }
    }
}

export default new ExperienceService();
