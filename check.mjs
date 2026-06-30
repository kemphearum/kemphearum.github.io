import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'demo-portfolio',
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function checkData() {
  const collections = ['awards', 'publications', 'speaking', 'testimonials'];
  for (const coll of collections) {
    const snap = await getDocs(collection(db, coll));
    console.log(coll + ': ' + snap.size + ' documents');
    if (snap.size > 0) {
       console.log('Sample doc:', snap.docs[0].data());
    }
  }
}
checkData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
