import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

export default class BaseService {
    constructor(collectionName) {
        if (!collectionName) {
            throw new Error("BaseService requires a collectionName");
        }
        this.collectionName = collectionName;
        this.collectionRef = collection(db, collectionName);
    }

    async getAll(sortBy = null, sortDirection = 'desc') {
        let q = this.collectionRef;
        if (sortBy) {
            q = query(this.collectionRef, orderBy(sortBy, sortDirection));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getById(id) {
        const docRef = doc(db, this.collectionName, id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    }

    async create(data, trackWrite = null) {
        const docRef = await addDoc(this.collectionRef, data);
        if (trackWrite) trackWrite(1, `Created document in ${this.collectionName}`);
        return docRef.id;
    }

    async update(id, data, trackWrite = null) {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, data);
        if (trackWrite) trackWrite(1, `Updated document in ${this.collectionName}`);
        return true;
    }

    async delete(id, trackDelete = null) {
        const docRef = doc(db, this.collectionName, id);
        await deleteDoc(docRef);
        if (trackDelete) trackDelete(1, `Deleted document from ${this.collectionName}`);
        return true;
    }
}
