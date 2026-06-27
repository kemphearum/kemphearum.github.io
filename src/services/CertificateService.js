import BaseService from './BaseService';
import { serverTimestamp } from 'firebase/firestore';
import { normalizeCertificate, validateCertificate } from '../domain/certificate/certificateDomain';
import { getLanguageFromStorage, localizeEntityFields } from '../utils/localization';

const CERTIFICATE_LOCALIZED_FIELDS = ['name', 'description'];

class CertificateService extends BaseService {
    constructor() {
        super('certificates');
    }

    localizeCertificate(certificate, lang = getLanguageFromStorage()) {
        return localizeEntityFields(certificate, CERTIFICATE_LOCALIZED_FIELDS, lang);
    }

    async toggleVisibility(userRole, id, currentVisible, trackWrite) {
        return this.update(id, { visible: !currentVisible }, trackWrite);
    }

    async toggleFeatured(userRole, id, currentFeatured, trackWrite) {
        return this.update(id, { featured: !currentFeatured }, trackWrite);
    }

    async deleteCertificate(userRole, id, trackDelete) {
        return this.delete(id, trackDelete);
    }

    async batchDeleteCertificates(userRole, ids, trackDelete) {
        return this.batchDelete(ids, trackDelete);
    }

    async batchUpdateCertificatesVisibility(userRole, ids, visible, trackWrite) {
        return this.batchUpdate(ids, { visible }, trackWrite);
    }

    async batchUpdateCertificatesFeatured(userRole, ids, featured, trackWrite) {
        return this.batchUpdate(ids, { featured }, trackWrite);
    }

    async saveCertificate(userRole, formData, trackWrite) {
        const dataToSave = normalizeCertificate(formData);
        const errors = validateCertificate(dataToSave);
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
        const certificates = await this.getAll();
        const organizations = new Set(
            certificates.map((item) => (item.organization || '').trim()).filter(Boolean)
        ).size;

        return {
            total: certificates.length,
            visible: certificates.filter((item) => item.visible !== false).length,
            featured: certificates.filter((item) => item.featured).length,
            organizations
        };
    }
}

export default new CertificateService();
