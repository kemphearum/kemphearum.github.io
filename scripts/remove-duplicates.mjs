// Remove duplicate projects and experience entries (keeps first, deletes second)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
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

async function removeDuplicates(collectionName, titleField) {
    const snapshot = await getDocs(collection(db, collectionName));
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Group by title
    const groups = {};
    items.forEach(item => {
        const key = item[titleField] || '(untitled)';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    let deleted = 0;
    for (const [title, entries] of Object.entries(groups)) {
        if (entries.length > 1) {
            // Keep first, delete the rest
            for (let i = 1; i < entries.length; i++) {
                console.log(`  🗑️  Deleting duplicate "${title}" (ID: ${entries[i].id})`);
                await deleteDoc(doc(db, collectionName, entries[i].id));
                deleted++;
            }
        }
    }

    console.log(`\n  ${collectionName}: ${deleted} duplicates removed, ${Object.keys(groups).length} unique items remain\n`);
}

console.log('🔄 Removing duplicate projects...');
await removeDuplicates('projects', 'title');

console.log('🔄 Removing duplicate experience...');
await removeDuplicates('experience', 'role');

console.log('✅ Cleanup complete!\n');
process.exit(0);
