import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import styles from './About.module.scss';

const About = () => {
    const [content, setContent] = useState({
        bio: "Hello! I'm a passionate developer who loves creating interactive and user-friendly web applications. With a strong foundation in modern web technologies, I strive to build performant and scalable solutions.\n\nI enjoy turning complex problems into simple, beautiful, and intuitive designs. When I'm not coding, you can find me exploring new technologies, contributing to open source, or enjoying a good cup of coffee.",
        skills: ['JavaScript (ES6+)', 'React', 'Firebase', 'Node.js', 'HTML5 & SCSS', 'Git & GitHub']
    });

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const docRef = doc(db, "content", "about");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setContent(prev => ({ ...prev, ...docSnap.data() }));
                }
            } catch (error) {
                console.error("Error fetching about content:", error);
            }
        };
        fetchContent();
    }, []);

    // Helper to render bio paragraphs
    const renderBio = (text) => {
        if (!text) return null;
        return text.split('\n\n').map((paragraph, index) => (
            <p key={index} style={{ marginBottom: '1.5rem' }}>{paragraph}</p>
        ));
    };

    return (
        <section id="about" className={styles.section}>
            <div className={styles.container}>
                <h2 className="section-title">About Me</h2>
                <div className={styles.content}>
                    <div className={styles.text}>
                        {renderBio(content.bio)}
                        <p className={styles.subtext}>Here are a few technologies I've been working with recently:</p>

                        <ul className={styles.skillsList}>
                            {content.skills && content.skills.map((skill, index) => (
                                <li key={index}>{skill}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
