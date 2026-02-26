import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Projects from '../components/Projects';
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
