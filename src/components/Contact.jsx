import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './Contact.module.scss';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState(null); // 'sending', 'success', 'error'
    const [introText, setIntroText] = useState("I'm currently looking for new opportunities, my inbox is always open. Whether you have a question or just want to say hi, I'll try my best to get back to you!");

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const docRef = doc(db, "content", "contact");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().introText) {
                    setIntroText(docSnap.data().introText);
                }
            } catch (error) {
                console.error("Error fetching contact content:", error);
            }
        };
        fetchContent();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        try {
            await addDoc(collection(db, "messages"), {
                ...formData,
                createdAt: serverTimestamp()
            });
            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
            setTimeout(() => setStatus(null), 5000);
        } catch (error) {
            console.error("Error adding document: ", error);
            setStatus('error');
        }
    };

    return (
        <section id="contact" className={styles.section}>
            <div className={styles.container}>
                <h2 className="section-title">Get In Touch</h2>
                <div className={styles.content}>
                    <p className={styles.text}>
                        {introText}
                    </p>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="5"
                                value={formData.message}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={status === 'sending'}>
                            {status === 'sending' ? 'Sending...' : 'Send Message'}
                        </button>

                        {status === 'success' && <p className={styles.success}>Message sent successfully!</p>}
                        {status === 'error' && <p className={styles.error}>Something went wrong. Please try again.</p>}
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
