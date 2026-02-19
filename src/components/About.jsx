import React from 'react';
import { useFirebaseDoc } from '../hooks/useFirebaseData';
import styles from './About.module.scss';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const About = () => {
    const { data: content, loading } = useFirebaseDoc('content', 'about', { bio: '', skills: [] });

    const renderBio = (text) => {
        if (!text) return null;
        return text.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
        ));
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <section id="about" className={styles.section}>
            <div className={styles.container}>
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    About Me
                </motion.h2>
                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.skeletonWrapper}>
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={styles.skeletonLine} style={{ width: `${90 - i * 15}%` }} />
                            ))}
                            <div className={styles.skeletonSkills}>
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className={styles.skeletonPill} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            className={styles.text}
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <div className={styles.bioText}>
                                {renderBio(content.bio)}
                            </div>
                            <p className={styles.subtext}>Technologies & Skills</p>
                            <motion.div
                                className={styles.skillsList}
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                            >
                                {content.skills && content.skills.map((skill, index) => (
                                    <motion.span
                                        key={index}
                                        variants={itemVariants}
                                        className={styles.skillTag}
                                        whileHover={{ scale: 1.05, y: -3 }}
                                    >
                                        {skill}
                                    </motion.span>
                                ))}
                            </motion.div>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default About;
