// One-time migration: add visible:true to all existing projects and experience docs
// Requires authentication since Firestore rules require auth for writes
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { createInterface } from 'readline';

const firebaseConfig = {
    apiKey: "AIzaSyAucicBCUmdaJSYsAvx_kwNQs9sVSoDrgA",
    authDomain: "portfolio-77db2.firebaseapp.com",
    projectId: "portfolio-77db2",
    storageBucket: "portfolio-77db2.firebasestorage.app",
    messagingSenderId: "871859633193",
    appId: "1:871859633193:web:cb71a71835bcd3b5fa7038",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function ask(question) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

// Sign in
const email = await ask('Admin email: ');
const password = await ask('Admin password: ');

try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Signed in successfully!\n');
} catch (err) {
    console.error('❌ Authentication failed:', err.message);
    process.exit(1);
}

async function migrate(collectionName) {
    const snapshot = await getDocs(collection(db, collectionName));
    let updated = 0;
    let skipped = 0;

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.visible === undefined || data.visible === null) {
            await updateDoc(doc(db, collectionName, docSnap.id), { visible: true });
            console.log(`  ✓ ${collectionName}/${docSnap.id} → visible: true`);
            updated++;
        } else {
            console.log(`  – ${collectionName}/${docSnap.id} already has visible: ${data.visible}`);
            skipped++;
        }
    }

    console.log(`\n  ${collectionName}: ${updated} updated, ${skipped} skipped\n`);
}

console.log('\n🔄 Migrating projects...');
await migrate('projects');

console.log('🔄 Migrating experience...');
await migrate('experience');

console.log('✅ Migration complete!\n');
process.exit(0);
