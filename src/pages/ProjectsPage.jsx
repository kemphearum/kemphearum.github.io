import React, { useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function loader() {
    const docRef = doc(db, 'settings', 'global');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
}

export function meta({ data }) {
    const site = data?.site || data || {};
    const title = `Projects | ${site.title || "Kem Phearum"}`;
    return [
        { title },
        { name: "description", content: "Explore my latest projects and technical work." },
        { property: "og:title", content: title },
    ];
}
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import Projects from '@/sections/Projects';
import styles from './Blog.module.scss'; // Reuse background and layouts

const ProjectsPage = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className={styles.blogPage}>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 80px)', paddingBottom: '4rem' }}>
                <div style={{ paddingTop: '2rem' }}>
                    <Projects />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ProjectsPage;
