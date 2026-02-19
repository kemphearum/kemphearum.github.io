// List all projects and experience entries to find duplicates
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function listCollection(name, titleField) {
    const snapshot = await getDocs(collection(db, name));
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 ${name.toUpperCase()} (${items.length} total)`);
    console.log('='.repeat(60));

    // Group by title to find duplicates
    const groups = {};
    items.forEach(item => {
        const key = item[titleField] || '(untitled)';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    let index = 1;
    for (const [title, entries] of Object.entries(groups)) {
        const isDupe = entries.length > 1;
        entries.forEach(item => {
            const marker = isDupe ? '⚠️  DUPLICATE' : '   ';
            const extra = name === 'projects'
                ? `Tech: ${(item.techStack || []).join(', ')}`
                : `${item.company || ''} • ${item.period || ''}`;
            console.log(`${String(index).padStart(3)}. ${marker} | ID: ${item.id}`);
            console.log(`     ${titleField}: ${title}`);
            console.log(`     ${extra}`);
            console.log(`     visible: ${item.visible}`);
            console.log('');
            index++;
        });
    }

    const dupes = Object.entries(groups).filter(([, v]) => v.length > 1);
    if (dupes.length > 0) {
        console.log(`\n🔴 Found ${dupes.length} duplicate group(s):`);
        dupes.forEach(([title, entries]) => {
            console.log(`   "${title}" appears ${entries.length} times — IDs: ${entries.map(e => e.id).join(', ')}`);
        });
    } else {
        console.log('\n✅ No duplicates found.');
    }
}

await listCollection('projects', 'title');
await listCollection('experience', 'role');

process.exit(0);
