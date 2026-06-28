import BaseService from './BaseService';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AuthService from './AuthService';

class CommunicationService extends BaseService {
    constructor() {
        super('content'); // Using 'content' collection with document 'communication'
        this.documentId = 'communication';
    }

    async get() {
        const docRef = doc(db, this.collectionName, this.documentId);
        const snap = await getDoc(docRef);
        return snap.exists() ? snap.data() : {
            email: '',
            secondaryEmail: '',
            phone: '',
            telegramUsername: '',
            telegramUrl: '',
            telegramQrCodeImage: '',
            telegramEnabled: true,
            whatsapp: '',
            linkedin: '',
            github: '',
            facebook: '',
            twitter: '',
            website: '',
            
            availabilityStatus: '',
            availabilityMessage: { en: '', km: '' },
            preferredContact: [],
            responseTime: { en: '', km: '' },
            officeHours: { en: '', km: '' },
            timeZone: '',
            preferredLanguage: '',
            
            introText: { en: '', km: '' },
            
            contactMethodsOrder: [],
            featuredContactMethod: ''
        };
    }

    async update(data, trackWrite) {
        const docRef = doc(db, this.collectionName, this.documentId);
        const payload = {
            ...data,
            updatedAt: serverTimestamp(),
            updatedBy: AuthService.getCurrentUser()?.email || 'Anonymous'
        };

        await setDoc(docRef, payload, { merge: true });

        if (trackWrite) {
            trackWrite(1, 'Updated communication settings', { size: JSON.stringify(payload).length });
        }

        return payload;
    }
}

export default new CommunicationService();
