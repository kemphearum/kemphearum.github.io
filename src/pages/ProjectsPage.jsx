import React, { useEffect } from 'react';
import { getLocalizedField } from '../utils/localization';
import SettingsService from '../services/SettingsService';

const getMetaLanguage = () => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('portfolio.language') === 'km' ? 'km' : 'en';
};

export async function loader() {
    try {
        return await SettingsService.fetchGlobalSettings();
    } catch (error) {
        console.error("Projects Loader Error:", error);
        return null;
    }
}

export function meta({ data }) {
    const language = getMetaLanguage();
    const tr = (enText, kmText) => (language === 'km' ? kmText : enText);
    const site = data?.site || data || {};
    const title = `Projects | ${getLocalizedField(site.title, language) || "Kem Phearum"}`;
    const description = getLocalizedField(site.projectsDescription || site.description, language)
        || tr("Explore my latest projects and technical work.", "ស្វែងយល់ពីគម្រោងចុងក្រោយ និងការងារបច្ចេកទេសរបស់ខ្ញុំ។");
    return [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
    ];
}
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import Projects from '@/sections/Projects';
import styles from './ProjectsPage.module.scss';

const ProjectsPage = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className={styles.projectsPage}>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.content}>
                    <Projects isStandalone />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ProjectsPage;
