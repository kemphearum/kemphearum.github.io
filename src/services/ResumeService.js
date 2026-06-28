import BaseService from './BaseService';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AuthService from './AuthService';

class ResumeService extends BaseService {
    constructor() {
        super('content');
        this.documentId = 'resume';
    }

    async get() {
        const docRef = doc(db, this.collectionName, this.documentId);
        const snap = await getDoc(docRef);
        return snap.exists() ? snap.data() : {
            pdfBase64: '',
            version: '',
            title: { en: '', km: '' },
            description: { en: '', km: '' },
            publicDownloadEnabled: true,
            printRouteEnabled: true
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
            trackWrite(1, 'Updated resume file and metadata', { title: payload.title?.en });
        }

        return payload;
    }
}

export default new ResumeService();
