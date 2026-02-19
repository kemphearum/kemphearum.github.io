import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, orderBy, query, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from './Admin.module.scss';
import { useNavigate } from 'react-router-dom';

// Icons as small components
const icons = {
    experience: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    projects: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    home: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    about: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    contact: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
        </svg>
    ),
    general: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    messages: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
};

const tabLabels = {
    home: 'Home Content',
    experience: 'Experience',
    projects: 'Projects',
    messages: 'Messages',
    contact: 'Contact Info',
    about: 'About Content',
    general: 'Settings',
};

// Toast notification component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`${styles.toast} ${styles[type]}`}>
            <span>{type === 'success' ? '✓' : '✕'}</span>
            <p>{message}</p>
            <button onClick={onClose} className={styles.toastClose}>×</button>
        </div>
    );
};

const Admin = () => {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    // Projects State
    const [projects, setProjects] = useState([]);
    const [project, setProject] = useState({
        title: '', description: '', techStack: '', githubUrl: '', liveUrl: ''
    });
    const [editingProject, setEditingProject] = useState(null);
    const [projectImage, setProjectImage] = useState(null);

    // Experience State
    const [experiences, setExperiences] = useState([]);
    const [experience, setExperience] = useState({
        company: '', role: '', period: '', description: ''
    });
    const [editingExperience, setEditingExperience] = useState(null);

    // Content States
    const [homeData, setHomeData] = useState({
        greeting: '', name: '', subtitle: '', description: '',
        ctaText: '', ctaLink: '', profileImageUrl: ''
    });
    const [homeImage, setHomeImage] = useState(null);
    const [aboutData, setAboutData] = useState({ bio: '', skills: '' });
    const [contactData, setContactData] = useState({ introText: "" });
    const [generalData, setGeneralData] = useState({
        logoText: '', logoHighlight: '', footerText: ''
    });
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            if (activeTab === 'projects') fetchProjects();
            else if (activeTab === 'experience') fetchExperiences();
            else if (activeTab === 'messages') fetchMessages();
            else fetchSectionData(activeTab);
        }
    }, [user, activeTab]);

    // Close sidebar on tab change (mobile)
    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setSidebarOpen(false);
    };

    // General Helpers
    const fetchSectionData = async (section) => {
        try {
            const docRef = doc(db, "content", section);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (section === 'home') setHomeData(data);
                if (section === 'about') setAboutData({ ...data, skills: data.skills?.join(', ') || '' });
                if (section === 'contact') setContactData(data);
                if (section === 'general') setGeneralData(data);
            }
        } catch (error) {
            console.error(`Error fetching ${section} data:`, error);
            showToast(`Failed to load ${section} data.`, 'error');
        }
    };

    const saveSectionData = async (section, data) => {
        setLoading(true);
        try {
            await setDoc(doc(db, "content", section), data);
            showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!`);
        } catch (error) {
            console.error(`Error saving ${section}:`, error);
            showToast(`Failed to save ${section}.`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Project Functions
    const fetchProjects = async () => {
        try {
            const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            setProjects(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching projects: ", error);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteDoc(doc(db, "projects", id));
            setProjects(projects.filter(p => p.id !== id));
            showToast('Project deleted.');
        } catch (error) {
            showToast('Failed to delete project.', 'error');
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
            showToast('Project added successfully!');
            setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '' });
            setProjectImage(null);
            fetchProjects();
        } catch (error) {
            showToast('Error adding project.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (p) => {
        setEditingProject(p.id);
        const stack = Array.isArray(p.techStack) ? p.techStack.join(', ') : p.techStack;
        setProject({ ...p, techStack: stack });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = project.imageUrl;
            if (projectImage) {
                const imageRef = ref(storage, `projects/${projectImage.name + Date.now()}`);
                await uploadBytes(imageRef, projectImage);
                imageUrl = await getDownloadURL(imageRef);
            }
            await updateDoc(doc(db, "projects", editingProject), {
                ...project,
                techStack: project.techStack.split(',').map(item => item.trim()),
                imageUrl
            });
            showToast('Project updated successfully!');
            setEditingProject(null);
            setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '' });
            setProjectImage(null);
            fetchProjects();
        } catch (error) {
            showToast('Error updating project.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Experience Functions
    const fetchExperiences = async () => {
        try {
            const q = query(collection(db, "experience"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            setExperiences(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching experience: ", error);
        }
    };

    const handleDeleteExperience = async (id) => {
        if (!window.confirm("Are you sure you want to delete this experience?")) return;
        try {
            await deleteDoc(doc(db, "experience", id));
            setExperiences(experiences.filter(e => e.id !== id));
            showToast('Experience deleted.');
        } catch (error) {
            showToast('Failed to delete experience.', 'error');
        }
    };

    const handleAddExperience = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "experience"), {
                ...experience,
                createdAt: serverTimestamp()
            });
            showToast('Experience added successfully!');
            setExperience({ company: '', role: '', period: '', description: '' });
            fetchExperiences();
        } catch (error) {
            showToast('Error adding experience.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditExperienceClick = (exp) => {
        setEditingExperience(exp.id);
        setExperience(exp);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateExperience = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateDoc(doc(db, "experience", editingExperience), { ...experience });
            showToast('Experience updated successfully!');
            setEditingExperience(null);
            setExperience({ company: '', role: '', period: '', description: '' });
            fetchExperiences();
        } catch (error) {
            showToast('Error updating experience.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Messages
    const fetchMessages = async () => {
        try {
            const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            setMessages(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleDeleteMessage = async (id) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            await deleteDoc(doc(db, "messages", id));
            setMessages(messages.filter(m => m.id !== id));
            showToast('Message deleted.');
        } catch (error) {
            showToast('Failed to delete message.', 'error');
        }
    };

    // Section Save Handlers
    const handleSaveHome = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = homeData.profileImageUrl;
            if (homeImage) {
                const imageRef = ref(storage, `home/${homeImage.name + Date.now()}`);
                await uploadBytes(imageRef, homeImage);
                imageUrl = await getDownloadURL(imageRef);
            }
            await saveSectionData('home', { ...homeData, profileImageUrl: imageUrl });
            setHomeImage(null);
        } catch (error) {
            showToast('Error saving home data.', 'error');
            setLoading(false);
        }
    };

    const handleSaveAbout = (e) => {
        e.preventDefault();
        const skillsArray = aboutData.skills.split(',').map(s => s.trim()).filter(s => s);
        saveSectionData('about', { bio: aboutData.bio, skills: skillsArray });
    };

    const handleSaveContact = (e) => {
        e.preventDefault();
        saveSectionData('contact', contactData);
    };

    const handleSaveGeneral = (e) => {
        e.preventDefault();
        saveSectionData('general', generalData);
    };

    // Auth
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
                showToast('Account created! You are now logged in.');
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            showToast((isRegistering ? "Registration Failed: " : "Login Failed: ") + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // =====================
    // LOGIN SCREEN
    // =====================
    if (!user) {
        return (
            <div className={styles.loginWrapper}>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <div className={styles.loginCard}>
                    <div className={styles.loginIcon}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <h2 className={styles.loginTitle}>{isRegistering ? 'Create Account' : 'Admin Login'}</h2>
                    <p className={styles.loginSubtitle}>{isRegistering ? 'Register a new admin account' : 'Sign in to manage your portfolio'}</p>

                    <form onSubmit={handleLogin} className={styles.loginForm}>
                        <div className={styles.inputGroup}>
                            <label>Email</label>
                            <input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Password</label>
                            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className={styles.loginBtn} disabled={loading}>
                            {loading ? (
                                <span className={styles.btnLoading}><span className={styles.spinner} /> {isRegistering ? 'Creating...' : 'Signing in...'}</span>
                            ) : (
                                isRegistering ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>

                    <div className={styles.loginFooter}>
                        <button onClick={() => setIsRegistering(!isRegistering)} className={styles.linkBtn}>
                            {isRegistering ? '← Back to Login' : 'Need an account? Register'}
                        </button>
                        <button onClick={() => navigate('/')} className={styles.linkBtn}>
                            ← Back to Site
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =====================
    // ADMIN DASHBOARD
    // =====================
    return (
        <div className={styles.adminLayout}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Mobile header */}
            <div className={styles.mobileHeader}>
                <button className={styles.menuToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <span /><span /><span />
                </button>
                <span className={styles.mobileBrand}>Admin<span>.</span></span>
                <button onClick={() => navigate('/')} className={styles.mobileViewBtn}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </button>
            </div>

            {/* Backdrop */}
            {sidebarOpen && <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.brand}>Admin<span>.</span></div>
                </div>
                <nav className={styles.sidebarNav}>
                    {Object.keys(tabLabels).map(tab => (
                        <button key={tab} className={activeTab === tab ? styles.active : ''} onClick={() => handleTabClick(tab)}>
                            {icons[tab]}
                            <span>{tabLabels[tab]}</span>
                            {tab === 'messages' && messages.length > 0 && (
                                <span className={styles.badge}>{messages.length}</span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>{user.email?.charAt(0).toUpperCase()}</div>
                        <span className={styles.userEmail}>{user.email}</span>
                    </div>
                    <button onClick={() => signOut(auth)} className={styles.logoutBtn}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <div className={styles.contentHeader}>
                    <div>
                        <h1>{tabLabels[activeTab]}</h1>
                        <p className={styles.headerSubtitle}>Manage your portfolio {activeTab}</p>
                    </div>
                    <button onClick={() => navigate('/')} className={styles.viewSiteBtn}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        View Live Site
                    </button>
                </div>

                {/* ========== EXPERIENCE TAB ========== */}
                {activeTab === 'experience' && (
                    <>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>{editingExperience ? '✏️ Edit Experience' : '➕ Add New Experience'}</h3>
                                {editingExperience && (
                                    <button onClick={() => { setEditingExperience(null); setExperience({ company: '', role: '', period: '', description: '' }); }} className={styles.cancelBtn}>Cancel</button>
                                )}
                            </div>
                            <form onSubmit={editingExperience ? handleUpdateExperience : handleAddExperience} className={styles.form}>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label>Company Name</label>
                                        <input type="text" placeholder="e.g. Google Inc." value={experience.company} onChange={(e) => setExperience({ ...experience, company: e.target.value })} required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Role / Job Title</label>
                                        <input type="text" placeholder="e.g. Senior Developer" value={experience.role} onChange={(e) => setExperience({ ...experience, role: e.target.value })} required />
                                    </div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Period</label>
                                    <input type="text" placeholder="e.g. Apr 2022 - Present" value={experience.period} onChange={(e) => setExperience({ ...experience, period: e.target.value })} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Description</label>
                                    <textarea placeholder="Use new lines for bullet points..." value={experience.description} onChange={(e) => setExperience({ ...experience, description: e.target.value })} rows="5" required />
                                </div>
                                <button type="submit" disabled={loading} className={styles.submitBtn}>
                                    {loading ? <><span className={styles.spinner} /> Saving...</> : (editingExperience ? 'Update Experience' : 'Add Experience')}
                                </button>
                            </form>
                        </div>

                        <div className={styles.listSection}>
                            <h3 className={styles.listTitle}>Existing Experience <span className={styles.count}>{experiences.length}</span></h3>
                            {experiences.length === 0 ? (
                                <div className={styles.emptyState}>No experience entries yet.</div>
                            ) : (
                                experiences.map(exp => (
                                    <div key={exp.id} className={styles.listItem}>
                                        <div className={styles.listItemInfo}>
                                            <h4>{exp.role}</h4>
                                            <p className={styles.listMeta}>{exp.company} • <em>{exp.period}</em></p>
                                        </div>
                                        <div className={styles.listItemActions}>
                                            <button className={styles.editBtn} onClick={() => handleEditExperienceClick(exp)}>Edit</button>
                                            <button className={styles.deleteBtn} onClick={() => handleDeleteExperience(exp.id)}>Delete</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* ========== PROJECTS TAB ========== */}
                {activeTab === 'projects' && (
                    <>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>{editingProject ? '✏️ Edit Project' : '➕ Add New Project'}</h3>
                                {editingProject && (
                                    <button onClick={() => { setEditingProject(null); setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '' }); setProjectImage(null); }} className={styles.cancelBtn}>Cancel</button>
                                )}
                            </div>
                            <form onSubmit={editingProject ? handleUpdateProject : handleAddProject} className={styles.form}>
                                <div className={styles.inputGroup}>
                                    <label>Project Title</label>
                                    <input type="text" placeholder="e.g. Portfolio Website" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Description</label>
                                    <textarea placeholder="Describe what this project does..." value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} rows="4" required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Tech Stack <span className={styles.hint}>(comma separated)</span></label>
                                    <input type="text" placeholder="React, Firebase, SCSS" value={project.techStack} onChange={(e) => setProject({ ...project, techStack: e.target.value })} required />
                                </div>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label>GitHub URL <span className={styles.hint}>(optional)</span></label>
                                        <input type="url" placeholder="https://github.com/..." value={project.githubUrl} onChange={(e) => setProject({ ...project, githubUrl: e.target.value })} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Live Demo URL <span className={styles.hint}>(optional)</span></label>
                                        <input type="url" placeholder="https://..." value={project.liveUrl} onChange={(e) => setProject({ ...project, liveUrl: e.target.value })} />
                                    </div>
                                </div>
                                <div className={styles.fileInputGroup}>
                                    <label>Project Image {editingProject && <span className={styles.hint}>(leave empty to keep current)</span>}</label>
                                    <div className={styles.fileDropzone}>
                                        <input type="file" accept="image/*" onChange={(e) => setProjectImage(e.target.files[0])} />
                                        <div className={styles.fileDropzoneContent}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                            <span>{projectImage ? projectImage.name : 'Click or drag to upload'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className={styles.submitBtn}>
                                    {loading ? <><span className={styles.spinner} /> Saving...</> : (editingProject ? 'Update Project' : 'Add Project')}
                                </button>
                            </form>
                        </div>

                        <div className={styles.listSection}>
                            <h3 className={styles.listTitle}>Existing Projects <span className={styles.count}>{projects.length}</span></h3>
                            {projects.length === 0 ? (
                                <div className={styles.emptyState}>No projects yet.</div>
                            ) : (
                                projects.map(p => (
                                    <div key={p.id} className={styles.listItem}>
                                        <div className={styles.listItemInfo}>
                                            <h4>{p.title}</h4>
                                            <div className={styles.techTags}>
                                                {(Array.isArray(p.techStack) ? p.techStack : []).map((t, i) => (
                                                    <span key={i} className={styles.techTag}>{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.listItemActions}>
                                            <button className={styles.editBtn} onClick={() => handleEditClick(p)}>Edit</button>
                                            <button className={styles.deleteBtn} onClick={() => handleDeleteProject(p.id)}>Delete</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* ========== HOME CONTENT TAB ========== */}
                {activeTab === 'home' && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3>🏠 Edit Home Section</h3></div>
                        <form onSubmit={handleSaveHome} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Greeting</label>
                                    <input type="text" placeholder="Hello, I am" value={homeData.greeting} onChange={(e) => setHomeData({ ...homeData, greeting: e.target.value })} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Name</label>
                                    <input type="text" placeholder="Your Name" value={homeData.name} onChange={(e) => setHomeData({ ...homeData, name: e.target.value })} />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Subtitle</label>
                                <input type="text" placeholder="Your Profession" value={homeData.subtitle} onChange={(e) => setHomeData({ ...homeData, subtitle: e.target.value })} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Description</label>
                                <textarea placeholder="Tell people about yourself..." value={homeData.description} onChange={(e) => setHomeData({ ...homeData, description: e.target.value })} rows="4" />
                            </div>
                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup}>
                                    <label>CTA Text</label>
                                    <input type="text" placeholder="View My Work" value={homeData.ctaText} onChange={(e) => setHomeData({ ...homeData, ctaText: e.target.value })} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>CTA Link</label>
                                    <input type="text" placeholder="#experience" value={homeData.ctaLink} onChange={(e) => setHomeData({ ...homeData, ctaLink: e.target.value })} />
                                </div>
                            </div>
                            <div className={styles.fileInputGroup}>
                                <label>Profile Image <span className={styles.hint}>(leave empty to keep current)</span></label>
                                <div className={styles.fileDropzone}>
                                    <input type="file" accept="image/*" onChange={(e) => setHomeImage(e.target.files[0])} />
                                    <div className={styles.fileDropzoneContent}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        <span>{homeImage ? homeImage.name : 'Click or drag to upload'}</span>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? <><span className={styles.spinner} /> Saving...</> : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ========== ABOUT TAB ========== */}
                {activeTab === 'about' && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3>👤 Edit About Section</h3></div>
                        <form onSubmit={handleSaveAbout} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label>Bio</label>
                                <textarea placeholder="Write your bio..." value={aboutData.bio} onChange={(e) => setAboutData({ ...aboutData, bio: e.target.value })} rows="8" />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Skills <span className={styles.hint}>(comma separated)</span></label>
                                <input type="text" placeholder="React, Python, Firebase, ..." value={aboutData.skills} onChange={(e) => setAboutData({ ...aboutData, skills: e.target.value })} />
                                {aboutData.skills && (
                                    <div className={styles.skillPreview}>
                                        {aboutData.skills.split(',').map((s, i) => s.trim() && (
                                            <span key={i} className={styles.techTag}>{s.trim()}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? <><span className={styles.spinner} /> Saving...</> : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ========== CONTACT TAB ========== */}
                {activeTab === 'contact' && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3>✉️ Edit Contact Section</h3></div>
                        <form onSubmit={handleSaveContact} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label>Intro Text</label>
                                <textarea placeholder="The text shown above the contact form..." value={contactData.introText} onChange={(e) => setContactData({ ...contactData, introText: e.target.value })} rows="4" />
                            </div>
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? <><span className={styles.spinner} /> Saving...</> : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ========== GENERAL SETTINGS TAB ========== */}
                {activeTab === 'general' && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3>⚙️ General Settings</h3></div>
                        <form onSubmit={handleSaveGeneral} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Logo Highlight</label>
                                    <input type="text" placeholder="Kem" value={generalData.logoHighlight} onChange={(e) => setGeneralData({ ...generalData, logoHighlight: e.target.value })} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Logo Text</label>
                                    <input type="text" placeholder="Phearum" value={generalData.logoText} onChange={(e) => setGeneralData({ ...generalData, logoText: e.target.value })} />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Footer Text</label>
                                <input type="text" placeholder="© 2026 Your Name. All Rights Reserved." value={generalData.footerText} onChange={(e) => setGeneralData({ ...generalData, footerText: e.target.value })} />
                            </div>
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? <><span className={styles.spinner} /> Saving...</> : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ========== MESSAGES TAB ========== */}
                {activeTab === 'messages' && (
                    <div className={styles.listSection}>
                        <h3 className={styles.listTitle}>Inbox <span className={styles.count}>{messages.length}</span></h3>
                        {messages.length === 0 ? (
                            <div className={styles.emptyState}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                <p>No messages yet.</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className={styles.messageCard}>
                                    <div className={styles.messageHeader}>
                                        <div className={styles.messageSender}>
                                            <div className={styles.senderAvatar}>{msg.name?.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <strong>{msg.name}</strong>
                                                <span className={styles.senderEmail}>{msg.email}</span>
                                            </div>
                                        </div>
                                        <div className={styles.messageActions}>
                                            <span className={styles.messageTime}>
                                                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString() : 'Just now'}
                                            </span>
                                            <button className={styles.deleteBtn} onClick={() => handleDeleteMessage(msg.id)}>Delete</button>
                                        </div>
                                    </div>
                                    <p className={styles.messageBody}>{msg.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Admin;
