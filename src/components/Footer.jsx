import React from 'react';
import { useQuery } from '@tanstack/react-query';
import SettingsService from '../services/SettingsService';
import { Github, Globe, Cloud, Activity, Terminal, Triangle, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Footer.module.scss';

const Footer = () => {
    const { data: globalConfig } = useQuery({
        queryKey: ['settings', 'global'],
        queryFn: () => SettingsService.fetchGlobalSettings()
    });

    const DEFAULT_MIRRORS = [
        { name: 'GitHub Pages', url: 'https://kemphearum.github.io/' },
        { name: 'Vercel Mirror', url: 'https://phearum-info.vercel.app/' },
        { name: 'Firebase Primary', url: 'https://phearum-info.web.app/' },
        { name: 'Firebase Mirror', url: 'https://kem-phearum.web.app/' }
    ];

    const settings = globalConfig?.site || globalConfig || {
        footerText: '',
        logoHighlight: '',
        logoText: '',
        tagline: ''
    };

    const mirrors = settings.mirrors || DEFAULT_MIRRORS;

    const getMirrorIcon = (name, url) => {
        const lowerName = name.toLowerCase();
        const lowerUrl = url.toLowerCase();
        
        if (lowerName.includes('github') || lowerUrl.includes('github.io')) return <Github size={16} />;
        if (lowerName.includes('vercel') || lowerUrl.includes('vercel.app')) return <Triangle size={14} style={{ transform: 'rotate(0deg)' }} />;
        if (lowerName.includes('firebase') || lowerUrl.includes('web.app')) return <Flame size={16} />;
        if (lowerName.includes('mirror')) return <Terminal size={16} />;
        return <Globe size={16} />;
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.topSection}>
                    <div className={styles.brand}>
                        <span className={styles.logo}>{settings.logoHighlight}<span className={styles.highlight}>{settings.logoText}</span></span>
                        <p className={styles.tagline}>{settings.tagline || 'ICT Security & IT Audit Professional'}</p>
                    </div>

                    <div className={styles.mirrorsSection}>
                        <h5 className={styles.sectionTitle}>Site Mirrors</h5>
                        <div className={styles.mirrorsList}>
                            {mirrors.map((mirror, index) => (
                                <motion.a 
                                    key={index} 
                                    href={mirror.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={styles.mirrorLink}
                                    whileHover={{ y: -3, scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    <span className={styles.mirrorIcon}>
                                        {getMirrorIcon(mirror.name, mirror.url)}
                                    </span>
                                    <span className={styles.mirrorName}>{mirror.name}</span>
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    <div className={styles.socialLinks}>
                        <a href="https://github.com/kemphearum" target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="GitHub">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        </a>
                        <a href="mailto:kem.phearum@gmail.com" className={styles.socialLink} title="Email">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                            </svg>
                        </a>
                    </div>
                </div>
                <div className={styles.divider} />
                <p className={styles.copyright}>{settings.footerText}</p>
            </div>
        </footer>
    );
};

export default Footer;
