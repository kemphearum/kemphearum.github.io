import React from 'react';
import { useFirebaseDoc } from '../hooks/useFirebaseData';
import styles from './Hero.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Hero = () => {
    const { data: content, loading } = useFirebaseDoc('content', 'home', {
        greeting: '',
        name: '',
        subtitle: '',
        description: '',
        ctaText: '',
        ctaLink: '',
        profileImageUrl: ''
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <section id="home" className={styles.hero}>
            {/* Animated background particles */}
            <div className={styles.particles}>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={styles.particle} style={{
                        '--delay': `${i * 2}s`,
                        '--x': `${15 + i * 15}%`,
                        '--y': `${10 + (i % 3) * 30}%`,
                        '--size': `${60 + i * 30}px`
                    }} />
                ))}
            </div>

            <motion.div
                className={styles.container}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className={styles.content}
                    key={loading ? 'loading' : 'content'}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {loading ? (
                        <div className={styles.skeleton}>
                            <div className={styles.skeletonLine} style={{ width: '120px', height: '18px' }} />
                            <div className={styles.skeletonLine} style={{ width: '320px', height: '48px' }} />
                            <div className={styles.skeletonLine} style={{ width: '280px', height: '36px' }} />
                            <div className={styles.skeletonLine} style={{ width: '100%', height: '60px' }} />
                            <div className={styles.skeletonLine} style={{ width: '180px', height: '50px', borderRadius: '12px' }} />
                        </div>
                    ) : (
                        <>
                            <motion.p variants={itemVariants} className={styles.greeting}>
                                <span className={styles.greetingIcon}>👋</span> {content.greeting}
                            </motion.p>
                            <motion.h1 variants={itemVariants} className={styles.title}>
                                {content.name}
                            </motion.h1>
                            <motion.h2 variants={itemVariants} className={styles.subtitle}>
                                {content.subtitle}
                            </motion.h2>
                            <motion.p variants={itemVariants} className={styles.description}>
                                {content.description}
                            </motion.p>
                            <motion.div variants={itemVariants} className={styles.cta}>
                                <a
                                    href={content.ctaLink || "#experience"}
                                    className={styles.ctaButton}
                                    onClick={(e) => {
                                        const link = content.ctaLink || "#experience";
                                        if (link.startsWith('#')) {
                                            e.preventDefault();
                                            const element = document.querySelector(link);
                                            if (element) {
                                                const headerOffset = 70;
                                                const elementPosition = element.getBoundingClientRect().top;
                                                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                                                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                                            }
                                        }
                                    }}
                                >
                                    {content.ctaText}
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </a>
                                <a href="#contact" className={styles.ctaSecondary} onClick={(e) => {
                                    e.preventDefault();
                                    const el = document.querySelector('#contact');
                                    if (el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }}>
                                    Get in Touch
                                </a>
                            </motion.div>
                        </>
                    )}
                </motion.div>
                <motion.div variants={itemVariants} className={styles.imageWrapper}>
                    <div className={styles.imageContainer}>
                        <div className={styles.imageGlow} />
                        <img
                            src={content.profileImageUrl || "https://ui-avatars.com/api/?name=Kem+Phearum&background=6C63FF&color=fff&size=350"}
                            alt="Profile"
                            className={styles.profileImage}
                        />
                        <div className={styles.imageRing} />
                    </div>
                    {/* Status badge */}
                    <motion.div
                        className={styles.statusBadge}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2, type: 'spring', bounce: 0.5 }}
                    >
                        <span className={styles.statusDot} />
                        Available for work
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                className={styles.scrollIndicator}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
            >
                <div className={styles.mouse}>
                    <div className={styles.wheel} />
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;
