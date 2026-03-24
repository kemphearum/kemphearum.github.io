import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { buildMultilingualMigrationPatch } from '../utils/localization';

const COLLECTION_CONFIG = {
    posts: {
        fields: ['title', 'excerpt', 'content'],
        defaults: { title: 'Untitled Post' }
    },
    projects: {
        fields: ['title', 'description', 'content'],
        defaults: { title: 'Untitled Project' }
    },
    experience: {
        fields: ['company', 'role', 'description'],
        defaults: {}
    }
};

const CONTENT_CONFIG = {
    home: {
        fields: ['greeting', 'name', 'subtitle', 'description', 'ctaText'],
        defaults: {}
    },
    about: {
        fields: ['bio'],
        defaults: {}
    },
    contact: {
        fields: ['introText'],
        defaults: {}
    }
};

class MultilingualMigrationService {
    async migrateContentDocument(documentId, trackWrite = null) {
        const config = CONTENT_CONFIG[documentId];
        if (!config) return { updated: false, id: documentId };

        const ref = doc(db, 'content', documentId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { updated: false, id: documentId };

        const patch = buildMultilingualMigrationPatch(snap.data(), config.fields, config.defaults);
        if (!Object.keys(patch).length) return { updated: false, id: documentId };

        await updateDoc(ref, patch);
        if (trackWrite) {
            trackWrite(1, `Migrated multilingual fields for content/${documentId}`, patch);
        }

        return { updated: true, id: documentId };
    }

    async migrateCollection(collectionName, trackWrite = null) {
        const config = COLLECTION_CONFIG[collectionName];
        if (!config) return { scanned: 0, updated: 0 };

        const snapshot = await getDocs(collection(db, collectionName));
        let updated = 0;

        for (const document of snapshot.docs) {
            const data = document.data();
            const patch = buildMultilingualMigrationPatch(data, config.fields, config.defaults);

            if (!Object.keys(patch).length) continue;
            await updateDoc(doc(db, collectionName, document.id), patch);
            updated += 1;

            if (trackWrite) {
                trackWrite(1, `Migrated multilingual fields for ${collectionName}/${document.id}`, patch);
            }
        }

        return {
            scanned: snapshot.size,
            updated
        };
    }

    async migrateAll(trackWrite = null) {
        const results = {};

        for (const collectionName of Object.keys(COLLECTION_CONFIG)) {
            results[collectionName] = await this.migrateCollection(collectionName, trackWrite);
        }

        const contentResults = [];
        for (const documentId of Object.keys(CONTENT_CONFIG)) {
            contentResults.push(await this.migrateContentDocument(documentId, trackWrite));
        }
        results.content = contentResults;

        return results;
    }
}

export default new MultilingualMigrationService();
