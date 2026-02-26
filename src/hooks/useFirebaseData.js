import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

// In-memory cache shared across all hook instances
const cache = {};
const inflight = {}; // Deduplication of concurrent requests

/**
 * Fetch a single document from Firestore with caching
 */
export const useFirebaseDoc = (collectionName, docId, defaultValue = {}) => {
    const [data, setData] = useState(defaultValue);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        const cacheKey = `${collectionName}/${docId}`;

        const fetchData = async () => {
            // Check cache first
            if (cache[cacheKey]) {
                if (mountedRef.current) {
                    setData(prev => ({ ...prev, ...cache[cacheKey] }));
                    setLoading(false);
                }
                return;
            }

            // Deduplicate concurrent requests
            if (inflight[cacheKey]) {
                try {
                    const result = await inflight[cacheKey];
                    if (mountedRef.current) {
                        setData(prev => ({ ...prev, ...result }));
                        setLoading(false);
                    }
                } catch (err) {
                    if (mountedRef.current) {
                        setError(err);
                        setLoading(false);
                    }
                }
                return;
            }

            // Start new fetch
            const fetchPromise = (async () => {
                const docRef = doc(db, collectionName, docId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const result = docSnap.data();
                    cache[cacheKey] = result;
                    return result;
                }
                return null;
            })();

            inflight[cacheKey] = fetchPromise;

            try {
                const result = await fetchPromise;
                if (mountedRef.current && result) {
                    setData(prev => ({ ...prev, ...result }));
                }
            } catch (err) {
                console.error(`Error fetching ${cacheKey}:`, err);
                if (mountedRef.current) {
                    setError(err);
                }
            } finally {
                delete inflight[cacheKey];
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, [collectionName, docId]);

    return { data, loading, error };
};

/**
 * Fetch an ordered collection from Firestore with caching
 */
export const useFirebaseCollection = (collectionName, orderField = 'createdAt', orderDirection = 'desc') => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        const cacheKey = `collection:${collectionName}:${orderField}:${orderDirection}`;

        const fetchData = async () => {
            // Check cache first
            if (cache[cacheKey]) {
                if (mountedRef.current) {
                    setData(cache[cacheKey]);
                    setLoading(false);
                }
                return;
            }

            // Deduplicate concurrent requests
            if (inflight[cacheKey]) {
                try {
                    const result = await inflight[cacheKey];
                    if (mountedRef.current) {
                        setData(result);
                        setLoading(false);
                    }
                } catch (err) {
                    if (mountedRef.current) {
                        setError(err);
                        setLoading(false);
                    }
                }
                return;
            }

            const fetchPromise = (async () => {
                const q = query(
                    collection(db, collectionName),
                    orderBy(orderField, orderDirection)
                );
                const querySnapshot = await getDocs(q);
                const result = querySnapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                }));
                cache[cacheKey] = result;
                return result;
            })();

            inflight[cacheKey] = fetchPromise;

            try {
                const result = await fetchPromise;
                if (mountedRef.current) {
                    setData(result);
                }
            } catch (err) {
                console.error(`Error fetching collection ${collectionName}:`, err);
                if (mountedRef.current) {
                    setError(err);
                }
            } finally {
                delete inflight[cacheKey];
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, [collectionName, orderField, orderDirection]);

    return { data, loading, error };
};

/**
 * Invalidate cached data (useful after admin updates)
 */
export const invalidateCache = (key) => {
    if (key) {
        // Invalidate specific key or all keys matching prefix
        Object.keys(cache).forEach(k => {
            if (k.startsWith(key)) {
                delete cache[k];
            }
        });
    } else {
        // Invalidate all
        Object.keys(cache).forEach(k => delete cache[k]);
    }
};
