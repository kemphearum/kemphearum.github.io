import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBXFaKMjp7XMbupIjOlmNOQjBi3LwIpLEo",
    authDomain: "portfolio-b4521.firebaseapp.com",
    projectId: "portfolio-b4521",
    storageBucket: "portfolio-b4521.firebasestorage.app",
    messagingSenderId: "422522074498",
    appId: "1:422522074498:web:05f53dbb759294e26aa675"
};

const app = initializeApp(firebaseConfig);
// Force long polling to avoid gRPC issues in Node
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
});

async function checkData() {
    console.log('=== PROJECTS ===');
    const projSnap = await getDocs(collection(db, 'projects'));
    projSnap.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`  title: ${d.title}`);
        console.log(`  visible: ${d.visible} (type: ${typeof d.visible})`);
        console.log(`  techStack: ${JSON.stringify(d.techStack)} (isArray: ${Array.isArray(d.techStack)})`);
        console.log('---');
    });
}

checkData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
