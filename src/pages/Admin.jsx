
import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, orderBy, query, setDoc, getDoc, updateDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from './Admin.module.scss';
import { useNavigate } from 'react-router-dom';
import { invalidateCache } from '../hooks/useFirebaseData';
import { FileText, Database, Upload, ExternalLink, EyeOff, Eye, Edit2, Trash2, LogOut, Bold, Italic, Link as LinkIcon, Code, Sun, Moon } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useTheme } from '../context/ThemeContext';

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
    settings: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    messages: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    blog: (
        <FileText size={18} />
    )
};

const tabLabels = {
    home: 'Home Content',
    about: 'About Content',
    experience: 'Experience',
    projects: 'Projects',
    blog: 'Blog',
    messages: 'Messages',
    contact: 'Contact Info',
    settings: 'Settings',
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
    const { theme, toggleTheme } = useTheme();

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
    const [settingsData, setSettingsData] = useState({
        logoText: '', logoHighlight: '', footerText: '', tagline: '', projectFilters: '', pageTitle: '', pageFaviconUrl: ''
    });
    const [settingsFavicon, setSettingsFavicon] = useState(null);
    const [posts, setPosts] = useState([]);
    const [postForm, setPostForm] = useState({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true });
    const [postImage, setPostImage] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
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
            else if (activeTab === 'blog') fetchPosts();
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
                if (section === 'settings') setSettingsData(data);
            }
            if (section === 'projects') {
                const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProjects(list);
            }
            if (section === 'blog') {
                const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const list = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    delete data.id;
                    return { id: doc.id, ...data };
                });
                setPosts(list);
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
            invalidateCache(`content/${section}`);
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
            console.error("Error fetching projects:", error);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteDoc(doc(db, "projects", id));
            invalidateCache('collection:projects');
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
                visible: true,
                createdAt: serverTimestamp()
            });
            invalidateCache('collection:projects');
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
            console.error("Error fetching experience:", error);
        }
    };

    const handleDeleteExperience = async (id) => {
        if (!window.confirm("Are you sure you want to delete this experience?")) return;
        try {
            await deleteDoc(doc(db, "experience", id));
            invalidateCache('collection:experience');
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
                visible: true,
                createdAt: serverTimestamp()
            });
            invalidateCache('collection:experience');
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

    // Toggle visibility for projects or experience
    const toggleVisibility = async (collectionName, id, currentVisible) => {
        try {
            await updateDoc(doc(db, collectionName, id), { visible: !currentVisible });
            invalidateCache(`collection:${collectionName}`);
            if (collectionName === 'projects') {
                setProjects(prev => prev.map(p => p.id === id ? { ...p, visible: !currentVisible } : p));
            } else if (collectionName === 'posts') {
                setPosts(prev => prev.map(p => p.id === id ? { ...p, visible: !currentVisible } : p));
            } else {
                setExperiences(prev => prev.map(e => e.id === id ? { ...e, visible: !currentVisible } : e));
            }
            showToast(`Item ${!currentVisible ? 'visible' : 'hidden'} on homepage.`);
        } catch (error) {
            showToast('Failed to toggle visibility.', 'error');
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

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let faviconUrl = settingsData.pageFaviconUrl || '';
            if (settingsFavicon) {
                const imageRef = ref(storage, `settings/favicon_${Date.now()}`);
                await uploadBytes(imageRef, settingsFavicon);
                faviconUrl = await getDownloadURL(imageRef);
            }
            await saveSectionData('settings', {
                ...settingsData,
                pageTitle: settingsData.pageTitle || '',
                pageFaviconUrl: faviconUrl
            });
            setSettingsFavicon(null);
        } catch (error) {
            console.error(error);
            showToast('Error saving settings.', 'error');
            setLoading(false);
        }
    };

    // Blog Handlers
    const fetchPosts = async () => {
        try {
            const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            setPosts(querySnapshot.docs.map(d => {
                const data = d.data();
                delete data.id; // ensure id from form state doesn't overwrite doc.id
                return { id: d.id, ...data };
            }));
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
    };

    const handleSavePost = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = postForm.coverImage;
            if (postImage) {
                const imageRef = ref(storage, `blog/covers/${Date.now()}`);
                await uploadBytes(imageRef, postImage);
                imageUrl = await getDownloadURL(imageRef);
            }

            // Auto-generate slug if empty
            let baseSlug = postForm.slug ? postForm.slug.trim() : '';
            if (!baseSlug) {
                baseSlug = postForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }

            // Ensure slug uniqueness
            let finalSlug = baseSlug;
            let counter = 1;
            let isDuplicate = true;

            while (isDuplicate) {
                const slugQuery = query(collection(db, "posts"), where("slug", "==", finalSlug));
                const slugSnap = await getDocs(slugQuery);
                // True if any returned explicitly matches a document other than the current one
                isDuplicate = slugSnap.docs.some(doc => doc.id !== postForm.id);

                if (isDuplicate) {
                    finalSlug = `${baseSlug}-${counter}`;
                    counter++;
                }
            }

            const postData = {
                ...postForm,
                slug: finalSlug,
                coverImage: imageUrl,
                tags: Array.isArray(postForm.tags) ? postForm.tags : (postForm.tags || '').toString().split(',').map(tag => tag.trim()).filter(tag => tag),
                createdAt: postForm.createdAt || serverTimestamp()
            };
            delete postData.id; // Prevent writing the form state's id into the document

            if (postForm.id) {
                await updateDoc(doc(db, "posts", postForm.id), postData);
                showToast('Post updated successfully!');
            } else {
                await addDoc(collection(db, "posts"), { ...postData, createdAt: serverTimestamp() });
                showToast('Post created successfully!');
            }
            invalidateCache('collection:posts');
            setPostForm({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true });
            setPostImage(null);
            fetchPosts();
        } catch (error) {
            console.error(error);
            showToast('Error saving post.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        setLoading(true);
        try {
            await deleteDoc(doc(db, "posts", id));
            invalidateCache('collection:posts');
            showToast('Post deleted.');
            fetchPosts();
        } catch (error) {
            console.error(error);
            showToast('Error deleting post.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const insertMarkdown = (syntax) => {
        const textarea = document.getElementById('markdown-editor');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = postForm.content;
        const selectedText = text.substring(start, end);

        let newText;

        switch (syntax) {
            case 'bold':
                newText = text.substring(0, start) + `**${selectedText || 'bold text'}**` + text.substring(end);
                break;
            case 'italic':
                newText = text.substring(0, start) + `*${selectedText || 'italic text'}*` + text.substring(end);
                break;
            case 'link':
                newText = text.substring(0, start) + `[${selectedText || 'Link text'}](url)` + text.substring(end);
                break;
            case 'code':
                newText = text.substring(0, start) + `\n\`\`\`\n${selectedText || 'code here'}\n\`\`\`\n` + text.substring(end);
                break;
            default:
                return;
        }

        setPostForm({ ...postForm, content: newText });

        setTimeout(() => {
            textarea.focus();
        }, 0);
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
                    <div className={styles.footerActions}>
                        <button onClick={toggleTheme} className={styles.themeToggleBtn} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <button onClick={() => signOut(auth)} className={styles.logoutBtn}>
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
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
                                    <div key={exp.id} className={`${styles.listItem} ${exp.visible === false ? styles.hiddenItem : ''}`}>
                                        <div className={styles.listItemInfo}>
                                            <h4>{exp.role} {exp.visible === false && <span className={styles.hiddenBadge}>Hidden</span>}</h4>
                                            <p className={styles.listMeta}>{exp.company} • <em>{exp.period}</em></p>
                                        </div>
                                        <div className={styles.listItemActions}>
                                            <button className={`${styles.visibilityBtn} ${exp.visible === false ? styles.off : ''}`} onClick={() => toggleVisibility('experience', exp.id, exp.visible !== false)} title={exp.visible === false ? 'Show on homepage' : 'Hide from homepage'}>
                                                {exp.visible === false ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                )}
                                            </button>
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
                                    <div key={p.id} className={`${styles.listItem} ${p.visible === false ? styles.hiddenItem : ''}`}>
                                        <div className={styles.listItemInfo}>
                                            <h4>{p.title} {p.visible === false && <span className={styles.hiddenBadge}>Hidden</span>}</h4>
                                            <div className={styles.techTags}>
                                                {(Array.isArray(p.techStack) ? p.techStack : []).map((t, i) => (
                                                    <span key={i} className={styles.techTag}>{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.listItemActions}>
                                            <button className={`${styles.visibilityBtn} ${p.visible === false ? styles.off : ''}`} onClick={() => toggleVisibility('projects', p.id, p.visible !== false)} title={p.visible === false ? 'Show on homepage' : 'Hide from homepage'}>
                                                {p.visible === false ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                )}
                                            </button>
                                            <button className={styles.editBtn} onClick={() => handleEditClick(p)}>Edit</button>
                                            <button className={styles.deleteBtn} onClick={() => handleDeleteProject(p.id)}>Delete</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* ========== BLOG TAB ========== */}
                {activeTab === 'blog' && (
                    <div className={styles.section} style={{ paddingBottom: '4rem' }}>
                        <div className={styles.cardHeader} style={{ marginBottom: '1.5rem' }}>
                            <h3>{postForm.id ? '✏️ Edit Post' : '📝 New Blog Post'}</h3>
                        </div>

                        <form onSubmit={handleSavePost} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Title</label>
                                    <input type="text" placeholder="Post Title" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Slug (URL) <span className={styles.hint}>(leave empty to auto-generate)</span></label>
                                    <input type="text" placeholder="my-post-url" value={postForm.slug} onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })} />
                                </div>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <label>Excerpt</label>
                                    <textarea placeholder="Short summary..." value={postForm.excerpt} onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })} rows="2" />
                                </div>
                                <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                    <div className={styles.editorHeader}>
                                        <label>Content (Markdown)</label>
                                        <div className={styles.toolbar}>
                                            {!isPreviewMode && (
                                                <div className={styles.formatGroup}>
                                                    <button type="button" onClick={() => insertMarkdown('bold')} title="Bold"><Bold size={16} /></button>
                                                    <button type="button" onClick={() => insertMarkdown('italic')} title="Italic"><Italic size={16} /></button>
                                                    <button type="button" onClick={() => insertMarkdown('link')} title="Link"><LinkIcon size={16} /></button>
                                                    <button type="button" onClick={() => insertMarkdown('code')} title="Code Block"><Code size={16} /></button>
                                                </div>
                                            )}
                                            <button type="button" className={styles.previewToggle} onClick={() => setIsPreviewMode(!isPreviewMode)}>
                                                {isPreviewMode ? <><Edit2 size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
                                            </button>
                                        </div>
                                    </div>
                                    {isPreviewMode ? (
                                        <div className={styles.previewBox}>
                                            <MarkdownRenderer content={postForm.content || '*Nothing to preview...*'} />
                                        </div>
                                    ) : (
                                        <textarea
                                            id="markdown-editor"
                                            placeholder="# Hello World\nWrite in Markdown..."
                                            value={postForm.content}
                                            onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                                            rows="15"
                                            required
                                            style={{ fontFamily: 'monospace' }}
                                        />
                                    )}
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Tags (comma separated)</label>
                                    <input type="text" placeholder="React, Tutorial..." value={Array.isArray(postForm.tags) ? postForm.tags.join(', ') : postForm.tags} onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })} />
                                </div>
                                <div className={styles.fileInputGroup}>
                                    <label>Cover Image</label>
                                    <div className={styles.fileDropzone}>
                                        <input type="file" accept="image/*" onChange={(e) => setPostImage(e.target.files[0])} />
                                        <div className={styles.fileDropzoneContent}>
                                            <Upload size={24} />
                                            <span>{postImage ? postImage.name : 'Upload Image'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.formActions} style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                <button type="submit" disabled={loading} className={styles.submitBtn}>
                                    {loading ? <><span className={styles.spinner} /> Saving...</> : (postForm.id ? 'Update Post' : 'Add Post')}
                                </button>
                                {postForm.id && (
                                    <button type="button" className={styles.cancelBtn} onClick={() => { setPostForm({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true }); setPostImage(null); setIsPreviewMode(false); }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className={styles.listSection} style={{ marginTop: '3rem' }}>
                            <h3 className={styles.listTitle}>Published Posts <span className={styles.count}>{posts.length}</span></h3>
                            {posts.length === 0 ? (
                                <div className={styles.emptyState}>No posts yet.</div>
                            ) : (
                                posts.map(post => (
                                    <div key={post.id} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee' }}>
                                        <div className={styles.itemInfo}>
                                            <h4 style={{ margin: '0 0 0.5rem 0' }}>{post.title}</h4>
                                            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{post.excerpt}</p>
                                            <div className={styles.meta} style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>
                                                <span className={styles.date}>{post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                                <span style={{ marginLeft: '1rem', color: post.visible ? 'green' : 'orange' }}>
                                                    {post.visible ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.itemActions} style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => window.open(`#/blog/${post.slug}`, '_blank')} title="View" className={styles.editBtn}>
                                                <ExternalLink size={16} />
                                            </button>
                                            <button onClick={() => toggleVisibility('posts', post.id, post.visible)} title={post.visible ? "Hide" : "Show"}>
                                                {post.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button onClick={() => { setPostForm(post); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Edit" className={styles.editBtn}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeletePost(post.id)} className={styles.deleteBtn} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
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
                                        <Upload size={24} />
                                        <span>{homeImage ? homeImage.name : 'Upload Image'}</span>
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

                {/* ========== SETTINGS TAB ========== */}
                {activeTab === 'settings' && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3>⚙️ Settings</h3></div>
                        <form onSubmit={handleSaveSettings} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Page Title (Browser Tab)</label>
                                    <input type="text" placeholder="Kem Phearum | Portfolio" value={settingsData.pageTitle || ''} onChange={(e) => setSettingsData({ ...settingsData, pageTitle: e.target.value })} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Logo Highlight</label>
                                    <input type="text" placeholder="Kem" value={settingsData.logoHighlight} onChange={(e) => setSettingsData({ ...settingsData, logoHighlight: e.target.value })} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Logo Text</label>
                                    <input type="text" placeholder="Phearum" value={settingsData.logoText} onChange={(e) => setSettingsData({ ...settingsData, logoText: e.target.value })} />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Tagline</label>
                                <input type="text" placeholder="ICT Security & IT Audit Professional" value={settingsData.tagline} onChange={(e) => setSettingsData({ ...settingsData, tagline: e.target.value })} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Footer Text</label>
                                <input type="text" placeholder="© 2026 Your Name. All Rights Reserved." value={settingsData.footerText} onChange={(e) => setSettingsData({ ...settingsData, footerText: e.target.value })} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Project Filters <span className={styles.hint}>(comma separated, overrides auto-detection)</span></label>
                                <input type="text" placeholder="React, Python, Firebase..." value={settingsData.projectFilters || ''} onChange={(e) => setSettingsData({ ...settingsData, projectFilters: e.target.value })} />
                            </div>
                            <div className={styles.fileInputGroup}>
                                <label>Browser Favicon <span className={styles.hint}>(leave empty to keep current)</span></label>
                                <div className={styles.fileDropzone}>
                                    <input type="file" accept="image/x-icon,image/png" onChange={(e) => setSettingsFavicon(e.target.files[0])} />
                                    <div className={styles.fileDropzoneContent}>
                                        <Upload size={24} />
                                        <span>{settingsFavicon ? settingsFavicon.name : 'Upload Favicon'}</span>
                                    </div>
                                </div>
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
