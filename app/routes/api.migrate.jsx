
import { db } from '../../src/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function action({ request }) {
    if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        // 1. Fetch old data
        const settingsRef = doc(db, 'settings', 'global');
        const profileRef = doc(db, 'content', 'profileInfo');
        const contactRef = doc(db, 'content', 'contact');
        
        const [settingsSnap, profileSnap, contactSnap] = await Promise.all([
            getDoc(settingsRef),
            getDoc(profileRef),
            getDoc(contactRef)
        ]);

        const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
        const profileData = profileSnap.exists() ? profileSnap.data() : {};
        const contactData = contactSnap.exists() ? contactSnap.data() : {};

        // 2. Extract specific fields for communication
        const commData = {
            ...((settingsData.site && settingsData.site.social) || {}),
            ...((settingsData.communication) || {}),
            availabilityStatus: profileData.availabilityStatus || '',
            availabilityMessage: profileData.availabilityMessage || { en: '', km: '' },
            preferredContact: profileData.preferredContact || [],
            responseTime: profileData.responseTime || { en: '', km: '' },
            timeZone: profileData.timezone || '',
            introText: contactData.introText || { en: '', km: '' },
            updatedAt: serverTimestamp()
        };

        // 3. Extract specific fields for resume
        const resumeData = {
            pdfBase64: '',
            version: '1.0',
            title: { en: 'Resume', km: 'ប្រវត្តិរូប' },
            description: { en: '', km: '' },
            publicDownloadEnabled: true,
            printRouteEnabled: true,
            updatedAt: serverTimestamp()
        };

        // 4. Save to new documents
        const commRef = doc(db, 'content', 'communication');
        const resumeRef = doc(db, 'content', 'resume');
        
        await Promise.all([
            setDoc(commRef, commData, { merge: true }),
            setDoc(resumeRef, resumeData, { merge: true })
        ]);

        return Response.json({ success: true, message: 'Migration completed successfully' });
    } catch (error) {
        console.error('Migration error:', error);
        return Response.json({ error: 'Migration failed', details: error.message }, { status: 500 });
    }
}
