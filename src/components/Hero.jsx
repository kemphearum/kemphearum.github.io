import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import styles from './Hero.module.scss';

const Hero = () => {
    const [content, setContent] = useState({
        greeting: 'Hi, my name is',
        name: 'John Doe.',
        subtitle: 'I build things for the web.',
        description: "I'm a software engineer specializing in building exceptional digital experiences. Currently, I'm focused on creating accessible, human-centered products.",
        ctaText: 'Check out my work',
        ctaLink: '#projects',
        profileImageUrl: 'https://via.placeholder.com/350'
    });

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const docRef = doc(db, "content", "home");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setContent(prev => ({ ...prev, ...docSnap.data() }));
                }
            } catch (error) {
                console.error("Error fetching home content:", error);
            }
        };
        fetchContent();
    }, []);

    return (
        <section id="home" className={styles.hero}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <p className={styles.greeting}>{content.greeting}</p>
                    <h1 className={styles.title}>{content.name}</h1>
                    <h2 className={styles.subtitle}>{content.subtitle}</h2>
                    <p className={styles.description}>{content.description}</p>
                    <div className={styles.cta}>
                        <a href={content.ctaLink || "#projects"} className="btn btn-primary">{content.ctaText}</a>
                    </div>
                </div>
                <div className={styles.imageWrapper}>
                    <div className={styles.imageContainer}>
                        <img
                            src={content.profileImageUrl || "https://via.placeholder.com/350"}
                            alt="Profile"
                            className={styles.profileImage}
                        />
                        <div className={styles.imageOverlay}></div>
                    </div>
                </div>
            </div>
        </section>
    );
};
export default Hero;
