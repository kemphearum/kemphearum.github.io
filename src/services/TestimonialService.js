import BaseService from './BaseService';
import { serverTimestamp } from 'firebase/firestore';
import { normalizeTestimonial, validateTestimonial } from '../domain/testimonial/testimonialDomain';
import { getLanguageFromStorage, localizeEntityFields } from '../utils/localization';

const TESTIMONIAL_LOCALIZED_FIELDS = ['content', 'authorRole'];

class TestimonialService extends BaseService {
    constructor() {
        super('testimonials');
    }

    localizeTestimonial(testimonial, lang = getLanguageFromStorage()) {
        return localizeEntityFields(testimonial, TESTIMONIAL_LOCALIZED_FIELDS, lang);
    }

    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    async toggleFeatured(userRole, id, currentFeatured, trackWrite) {
        return this.update(id, { featured: !currentFeatured }, trackWrite);
    }

    async deleteTestimonial(userRole, id, trackDelete) {
        return this.delete(id, trackDelete);
    }

    async batchDeleteTestimonials(userRole, ids, trackDelete) {
        return this.batchDelete(ids, trackDelete);
    }

    async batchUpdateTestimonialsVisibility(userRole, ids, visible, trackWrite) {
        return this.batchUpdate(ids, { visible }, trackWrite);
    }

    async batchUpdateTestimonialsFeatured(userRole, ids, featured, trackWrite) {
        return this.batchUpdate(ids, { featured }, trackWrite);
    }

    async saveTestimonial(userRole, formData, trackWrite) {
        const dataToSave = normalizeTestimonial(formData);
        const errors = validateTestimonial(dataToSave);
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

export default new TestimonialService();
