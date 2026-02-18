import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, orderBy, query, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from './Admin.module.scss';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('projects');
    const navigate = useNavigate();

    // Projects State
    const [projects, setProjects] = useState([]);
    const [project, setProject] = useState({
        title: '',
        description: '',
        techStack: '',
        githubUrl: '',
        liveUrl: ''
    });
    const [projectImage, setProjectImage] = useState(null);

    // Home Section State
    const [homeData, setHomeData] = useState({
        greeting: 'Hi, my name is',
        name: 'John Doe.',
        subtitle: 'I build things for the web.',
        description: "I'm a software engineer specializing in building exceptional digital experiences.",
        ctaText: 'Check out my work',
        ctaLink: '#projects',
        profileImageUrl: ''
    });
    const [homeImage, setHomeImage] = useState(null);

    // About Section State
    const [aboutData, setAboutData] = useState({
        bio: "Hello! I'm a passionate developer...",
        skills: 'JavaScript, React, Firebase, Node.js'
    });

    // Contact Section State
    const [contactData, setContactData] = useState({
        introText: "I'm currently looking for new opportunities, my inbox is always open."
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            if (activeTab === 'projects') fetchProjects();
            else fetchSectionData(activeTab);
        }
    }, [user, activeTab]);

    // General Helpers
    const fetchSectionData = async (section) => {
        try {
            const docRef = doc(db, "content", section);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (section === 'home') setHomeData(data);
                if (section === 'about') setAboutData({ ...data, skills: data.skills.join(', ') });
                if (section === 'contact') setContactData(data);
            }
        } catch (error) {
            console.error(`Error fetching ${section} data:`, error);
        }
    };

    const saveSectionData = async (section, data) => {
        setLoading(true);
        try {
            await setDoc(doc(db, "content", section), data);
            alert(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!`);
        } catch (error) {
            console.error(`Error saving ${section}:`, error);
            alert(`Failed to save ${section}.`);
        } finally {
            setLoading(false);
        }
    };

    // Project Functions
    const fetchProjects = async () => {
        try {
            const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const projectsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProjects(projectsData);
        } catch (error) {
            console.error("Error fetching projects: ", error);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteDoc(doc(db, "projects", id));
            setProjects(projects.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting project:", error);
            alert("Failed to delete project.");
        }
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = '';
            if (projectImage) {
                const imageRef = ref(storage, `projects/${projectImage.name + Date.now()}`);
                await uploadBytes(imageRef, projectImage);
                imageUrl = await getDownloadURL(imageRef);
            }

            await addDoc(collection(db, "projects"), {
                ...project,
                techStack: project.techStack.split(',').map(item => item.trim()),
                imageUrl,
                createdAt: serverTimestamp()
            });
            alert("Project Added Successfully!");
            setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '' });
            setProjectImage(null);
            fetchProjects();
        } catch (error) {
            console.error("Error adding project: ", error);
            alert("Error adding project");
        } finally {
            setLoading(false);
        }
    };

    const handleSeedData = async () => {
        if (!window.confirm("Add sample projects?")) return;
        setLoading(true);
        const samples = [
            {
                title: "E-Commerce Dashboard",
                description: "A comprehensive dashboard for managing online store inventory and orders.",
                techStack: ["React", "Redux", "Material UI", "Firebase"],
                githubUrl: "https://github.com",
                liveUrl: "https://google.com",
                imageUrl: "https://placehold.co/600x400/6c63ff/ffffff?text=E-Commerce"
            },
            {
                title: "Weather App",
                description: "Real-time weather application with location tracking.",
                techStack: ["JS", "API"],
                githubUrl: "https://github.com",
                liveUrl: "https://google.com",
                imageUrl: "https://placehold.co/600x400/ff6584/ffffff?text=Weather"
            }
        ];
        try {
            for (const p of samples) {
                await addDoc(collection(db, "projects"), { ...p, createdAt: serverTimestamp() });
            }
            alert("Sample projects added!");
            fetchProjects();
        } catch (error) {
            console.error("Error adding samples:", error);
            alert("Failed to add samples.");
        } finally {
            setLoading(false);
        }
    };

    // Specific Section Handlers
    const handleSaveHome = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = homeData.profileImageUrl;
            if (homeImage) {
                const imageRef = ref(storage, `content/profile_${Date.now()}`);
                await uploadBytes(imageRef, homeImage);
                imageUrl = await getDownloadURL(imageRef);
            }
            await saveSectionData('home', { ...homeData, profileImageUrl: imageUrl });
        } catch (err) {
            alert("Error saving home: " + err.message);
            setLoading(false);
        }
    };

    const handleSaveAbout = (e) => {
        e.preventDefault();
        const skillsArray = aboutData.skills.split(',').map(s => s.trim());
        saveSectionData('about', { ...aboutData, skills: skillsArray });
    };

    const handleSaveContact = (e) => {
        e.preventDefault();
        saveSectionData('contact', contactData);
    };

    // Auth
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert("Login Failed: " + error.message);
        }
    };

    if (!user) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <h2 className={styles.title}>Admin Login</h2>
                    <form onSubmit={handleLogin} className={styles.form}>
                        <input className={styles.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <input className={styles.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <button type="submit" className="btn btn-primary">Login</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.dashboard}>
                <div className={styles.header}>
                    <h1>Admin Dashboard</h1>
                    <div className={styles.actions}>
                        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginRight: '1rem' }}>View Site</button>
                        <button onClick={() => signOut(auth)} className="btn btn-secondary">Logout</button>
                    </div>
                </div>

                <div className={styles.tabs}>
                    <button className={activeTab === 'projects' ? styles.active : ''} onClick={() => setActiveTab('projects')}>Projects</button>
                    <button className={activeTab === 'home' ? styles.active : ''} onClick={() => setActiveTab('home')}>Home</button>
                    <button className={activeTab === 'about' ? styles.active : ''} onClick={() => setActiveTab('about')}>About</button>
                    <button className={activeTab === 'contact' ? styles.active : ''} onClick={() => setActiveTab('contact')}>Contact</button>
                </div>

                {activeTab === 'projects' && (
                    <>
                        <div className={styles.card}>
                            <h3>Add New Project</h3>
                            <button onClick={handleSeedData} className="btn btn-secondary" style={{ marginBottom: '1rem', width: '100%', borderColor: '#2ecc71', color: '#2ecc71' }}>+ Load Samples</button>
                            <form onSubmit={handleAddProject} className={styles.form}>
                                <input className={styles.input} type="text" placeholder="Title" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} required />
                                <textarea className={styles.textarea} placeholder="Description" value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} required />
                                <input className={styles.input} type="text" placeholder="Tech Stack (comma sep)" value={project.techStack} onChange={(e) => setProject({ ...project, techStack: e.target.value })} required />
                                <input className={styles.input} type="url" placeholder="GitHub URL" value={project.githubUrl} onChange={(e) => setProject({ ...project, githubUrl: e.target.value })} />
                                <input className={styles.input} type="url" placeholder="Live Demo URL" value={project.liveUrl} onChange={(e) => setProject({ ...project, liveUrl: e.target.value })} />
                                <div className={styles.fileInput}>
                                    <label>Project Image</label>
                                    <input type="file" onChange={(e) => setProjectImage(e.target.files[0])} />
                                </div>
                                <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Adding...' : 'Add Project'}</button>
                            </form>
                        </div>
                        <div className={styles.projectList}>
                            <h3>Existing Projects</h3>
                            {projects.map(p => (
                                <div key={p.id} className={styles.projectItem}>
                                    <div className={styles.info}>
                                        <h4>{p.title}</h4>
                                        <p>{p.techStack.join(', ')}</p>
                                    </div>
                                    <button className={styles.deleteBtn} onClick={() => handleDeleteProject(p.id)}>Delete</button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'home' && (
                    <div className={styles.card}>
                        <h3>Edit Home Section</h3>
                        <form onSubmit={handleSaveHome} className={styles.form}>
                            <input className={styles.input} type="text" placeholder="Greeting" value={homeData.greeting} onChange={(e) => setHomeData({ ...homeData, greeting: e.target.value })} />
                            <input className={styles.input} type="text" placeholder="Name" value={homeData.name} onChange={(e) => setHomeData({ ...homeData, name: e.target.value })} />
                            <input className={styles.input} type="text" placeholder="Subtitle" value={homeData.subtitle} onChange={(e) => setHomeData({ ...homeData, subtitle: e.target.value })} />
                            <textarea className={styles.textarea} placeholder="Description" value={homeData.description} onChange={(e) => setHomeData({ ...homeData, description: e.target.value })} />
                            <input className={styles.input} type="text" placeholder="CTA Text" value={homeData.ctaText} onChange={(e) => setHomeData({ ...homeData, ctaText: e.target.value })} />
                            <input className={styles.input} type="text" placeholder="CTA Link" value={homeData.ctaLink} onChange={(e) => setHomeData({ ...homeData, ctaLink: e.target.value })} />
                            <div className={styles.fileInput}>
                                <label>Profile Image (Leave empty to keep current)</label>
                                <input type="file" onChange={(e) => setHomeImage(e.target.files[0])} />
                            </div>
                            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
                        </form>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className={styles.card}>
                        <h3>Edit About Section</h3>
                        <form onSubmit={handleSaveAbout} className={styles.form}>
                            <textarea className={styles.textarea} style={{ minHeight: '200px' }} placeholder="Bio" value={aboutData.bio} onChange={(e) => setAboutData({ ...aboutData, bio: e.target.value })} />
                            <input className={styles.input} type="text" placeholder="Skills (comma separated)" value={aboutData.skills} onChange={(e) => setAboutData({ ...aboutData, skills: e.target.value })} />
                            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
                        </form>
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className={styles.card}>
                        <h3>Edit Contact Section</h3>
                        <form onSubmit={handleSaveContact} className={styles.form}>
                            <textarea className={styles.textarea} placeholder="Intro Text" value={contactData.introText} onChange={(e) => setContactData({ ...contactData, introText: e.target.value })} />
                            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
