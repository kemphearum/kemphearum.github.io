import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, orderBy, query, setDoc, getDoc, updateDoc, where, Timestamp, writeBatch } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
import styles from './Admin.module.scss';
import { useNavigate } from 'react-router-dom';
import { invalidateCache } from '../hooks/useFirebaseData';
import { FileText, Database, Upload, ExternalLink, EyeOff, Eye, Edit2, Trash2, LogOut, Bold, Italic, Link as LinkIcon, Code, Sun, Moon, Star, Search, ChevronLeft, ChevronRight, ChevronDown, User, Mail, MailOpen, X } from 'lucide-react';
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
    ),
    database: (
        <Database size={18} />
    ),
    profile: (
        <User size={18} />
    ),
    audit: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
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
    database: 'Database',
    users: 'Users',
    audit: 'Audit Logs',
    profile: 'My Profile'
};

// Toast notification component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`${styles.toast} ${styles[type]} `}>
            <span>{type === 'success' ? '✓' : '✕'}</span>
            <p>{message}</p>
            <button onClick={onClose} className={styles.toastClose}>×</button>
        </div>
    );
};

// Reusable Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange, perPage, onPerPageChange, totalItems }) => {
    if (totalItems === 0) return null;
    const perPageOptions = [5, 10, 25];
    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, totalItems);

    return (
        <div className={styles.paginationWrapper}>
            <div className={styles.paginationLeft}>
                <span className={styles.pageInfo}>
                    {start}–{end} of {totalItems}
                </span>
                <div className={styles.perPageControl}>
                    <span className={styles.perPageLabel}>Show</span>
                    <select
                        className={styles.perPageSelect}
                        value={perPage}
                        onChange={(e) => onPerPageChange(Number(e.target.value))}
                    >
                        {perPageOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            </div>
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button className={styles.pageBtn} onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
                    <button className={styles.pageBtn} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

const Admin = () => {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userDisplayName, setUserDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('adminActiveTab') || 'home';
    });

    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab);
    }, [activeTab]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
    }, []);

    // Projects State
    const [projects, setProjects] = useState([]);
    const [project, setProject] = useState({
        title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: ''
    });
    const [editingProject, setEditingProject] = useState(null);
    const [projectImage, setProjectImage] = useState(null);
    const [isProjectPreviewMode, setIsProjectPreviewMode] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);

    // Experience State
    const [experiences, setExperiences] = useState([]);
    const [experience, setExperience] = useState({
        company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false
    });
    const [editingExperience, setEditingExperience] = useState(null);
    const [showExperienceForm, setShowExperienceForm] = useState(false);
    const [isExpPreviewMode, setIsExpPreviewMode] = useState(false);

    // Content States
    const [homeData, setHomeData] = useState({
        greeting: '', name: '', subtitle: '', description: '',
        ctaText: '', ctaLink: '', profileImageUrl: ''
    });
    const [homeImage, setHomeImage] = useState(null);
    const [aboutData, setAboutData] = useState({ bio: '', skills: '' });
    const [contactData, setContactData] = useState({ introText: "" });
    const [settingsData, setSettingsData] = useState({
        logoText: '', logoHighlight: '', footerText: '', tagline: '', projectFilters: '', blogFilters: '', pageTitle: '', pageFaviconUrl: ''
    });
    const [settingsFavicon, setSettingsFavicon] = useState(null);
    const [posts, setPosts] = useState([]);
    const [postForm, setPostForm] = useState({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false });
    const [postImage, setPostImage] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [showPostForm, setShowPostForm] = useState(false);
    const [searchMessages, setSearchMessages] = useState('');
    const [messagesPage, setMessagesPage] = useState(1);
    const [messagesPerPage, setMessagesPerPage] = useState(10);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [viewingMessage, setViewingMessage] = useState(null);
    const [messages, setMessages] = useState([]);

    // Users & Audit State
    const [usersList, setUsersList] = useState([]);
    const [auditLogsList, setAuditLogsList] = useState([]);

    // Search & Pagination State
    const [searchExperience, setSearchExperience] = useState('');
    const [searchProjects, setSearchProjects] = useState('');
    const [searchPosts, setSearchPosts] = useState('');
    const [searchUsers, setSearchUsers] = useState('');
    const [expPage, setExpPage] = useState(1);
    const [projPage, setProjPage] = useState(1);
    const [postPage, setPostPage] = useState(1);
    const [usersPage, setUsersPage] = useState(1);
    const [auditPage, setAuditPage] = useState(1);
    const [expPerPage, setExpPerPage] = useState(5);
    const [projPerPage, setProjPerPage] = useState(5);
    const [postPerPage, setPostPerPage] = useState(5);
    const [usersPerPage, setUsersPerPage] = useState(5);
    const [auditPerPage, setAuditPerPage] = useState(5);

    // Add User State
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('pending');

    const filteredMessages = useMemo(() => {
        let result = messages;
        if (searchMessages) {
            const lowerSearch = searchMessages.toLowerCase();
            result = result.filter(msg =>
                (msg.name && msg.name.toLowerCase().includes(lowerSearch)) ||
                (msg.email && msg.email.toLowerCase().includes(lowerSearch)) ||
                (msg.message && msg.message.toLowerCase().includes(lowerSearch))
            );
        }
        return result;
    }, [messages, searchMessages]);

    const messagesTotalPages = Math.ceil(filteredMessages.length / messagesPerPage) || 1;
    const paginatedMessages = useMemo(() => {
        const start = (messagesPage - 1) * messagesPerPage;
        return filteredMessages.slice(start, start + messagesPerPage);
    }, [filteredMessages, messagesPage, messagesPerPage]);

    const unreadMessagesCount = useMemo(() => {
        return messages.filter(m => !m.isRead).length;
    }, [messages]);

    // Role Permissions State
    const [rolePermissions, setRolePermissions] = useState({}); // { editor: ['blog','projects'], admin: [...] }
    const [showRolePerms, setShowRolePerms] = useState(false);
    const [editingRolePerms, setEditingRolePerms] = useState({}); // temp state while editing

    // Filtered & Paginated Data
    const filteredExperiences = useMemo(() => {
        const q = searchExperience.toLowerCase();
        if (!q) return experiences;
        return experiences.filter(e => (e.role || '').toLowerCase().includes(q) || (e.company || '').toLowerCase().includes(q));
    }, [experiences, searchExperience]);
    const expTotalPages = Math.ceil(filteredExperiences.length / expPerPage);
    const paginatedExperiences = useMemo(() => filteredExperiences.slice((expPage - 1) * expPerPage, expPage * expPerPage), [filteredExperiences, expPage, expPerPage]);

    const filteredProjects = useMemo(() => {
        const q = searchProjects.toLowerCase();
        if (!q) return projects;
        return projects.filter(p => (p.title || '').toLowerCase().includes(q) || (Array.isArray(p.techStack) ? p.techStack.join(' ') : '').toLowerCase().includes(q));
    }, [projects, searchProjects]);
    const projTotalPages = Math.ceil(filteredProjects.length / projPerPage);
    const paginatedProjects = useMemo(() => filteredProjects.slice((projPage - 1) * projPerPage, projPage * projPerPage), [filteredProjects, projPage, projPerPage]);

    const filteredPosts = useMemo(() => {
        const q = searchPosts.toLowerCase();
        if (!q) return posts;
        return posts.filter(p => (p.title || '').toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q));
    }, [posts, searchPosts]);
    const postTotalPages = Math.ceil(filteredPosts.length / postPerPage);
    const paginatedPosts = useMemo(() => filteredPosts.slice((postPage - 1) * postPerPage, postPage * postPerPage), [filteredPosts, postPage, postPerPage]);

    const filteredUsers = useMemo(() => {
        return usersList.filter(u =>
            (u.email || '').toLowerCase().includes(searchUsers.toLowerCase()) ||
            (u.displayName || '').toLowerCase().includes(searchUsers.toLowerCase())
        );
    }, [usersList, searchUsers]);

    const filteredAuditLogs = useMemo(() => {
        return auditLogsList.filter(log =>
            (log.email || '').toLowerCase().includes(searchUsers.toLowerCase()) || // reuse searchUsers input
            (log.ipAddress || '').includes(searchUsers)
        );
    }, [auditLogsList, searchUsers]);
    const usersTotalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const paginatedUsers = useMemo(() => filteredUsers.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage), [filteredUsers, usersPage, usersPerPage]);

    const auditTotalPages = Math.ceil(filteredAuditLogs.length / auditPerPage);
    const paginatedAuditLogs = useMemo(() => filteredAuditLogs.slice((auditPage - 1) * auditPerPage, auditPage * auditPerPage), [filteredAuditLogs, auditPage, auditPerPage]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const q = query(collection(db, "users"), where("email", "==", currentUser.email));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0];
                        const userData = userDoc.data();

                        // STRICT CHECK FOR DISABLED USERS
                        if (userData.isActive === false) {
                            await signOut(auth);
                            setUser(null);
                            setUserRole(null);
                            setUserId(null);
                            setUserDisplayName('');
                            showToast("Your account has been disabled by an administrator.", "error");
                            setIsAuthLoading(false);
                            return;
                        }

                        let fetchedRole = userData.role;

                        setUserId(userDoc.id);
                        setUserDisplayName(userData.displayName || '');

                        // Force kem.phearum@gmail.com to be superadmin
                        if (currentUser.email === 'kem.phearum@gmail.com' && fetchedRole !== 'superadmin') {
                            fetchedRole = 'superadmin';
                            updateDoc(userDoc.ref, { role: 'superadmin' }).catch(console.error);
                        } else if (fetchedRole === 'owner') {
                            // Migrate legacy 'owner' to 'superadmin'
                            fetchedRole = 'superadmin';
                            updateDoc(userDoc.ref, { role: 'superadmin' }).catch(console.error);
                        }

                        setUserRole(fetchedRole);
                    } else if (currentUser.email === 'kem.phearum@gmail.com') {
                        // Auto-create superadmin role for the primary email
                        const newDocRef = await addDoc(collection(db, "users"), {
                            email: currentUser.email,
                            role: 'superadmin',
                            isActive: true,
                            createdAt: serverTimestamp()
                        });
                        setUserId(newDocRef.id);
                        setUserRole('superadmin');
                    } else {
                        // User exists in Auth but not in Firestore Database. 
                        // Auto-create their record.
                        try {
                            const newDocRef = await addDoc(collection(db, "users"), {
                                email: currentUser.email,
                                role: 'pending',
                                isActive: true,
                                createdAt: serverTimestamp()
                            });
                            setUserId(newDocRef.id);
                        } catch (createError) {
                            console.error("Failed to auto-create user document:", createError);
                        }
                        setUserRole('pending');
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    if (currentUser.email === 'kem.phearum@gmail.com') {
                        setUserRole('superadmin');
                    } else {
                        setUserRole('pending');
                    }
                } finally {
                    setIsAuthLoading(false);
                }
            } else {
                setUserRole(null);
                setUserId(null);
                setUserDisplayName('');
                setIsAuthLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const compressImageToBase64 = async (file, options = {}) => {
        const defaultOptions = {
            maxSizeMB: 0.1, // ~100KB to stay well under Firestore 1MB limit
            maxWidthOrHeight: 800,
            useWebWorker: true,
            ...options,
        };
        try {
            const compressedFile = await imageCompression(file, defaultOptions);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(compressedFile);
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        } catch (error) {
            console.error('Error compressing image:', error);
            throw error;
        }
    };


    // Close sidebar on tab change (mobile)
    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setSidebarOpen(false);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!userId) {
            showToast("User record not found!", "error");
            return;
        }

        setLoading(true);
        try {
            await updateDoc(doc(db, "users", userId), {
                displayName: userDisplayName
            });
            showToast("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            showToast("Failed to update profile.", "error");
        } finally {
            setLoading(false);
        }
    };

    // General Helpers
    const fetchSectionData = useCallback(async (section) => {
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
            console.error(`Error fetching ${section} data: `, error);
            showToast(`Failed to load ${section} data.`, 'error');
        }
    }, [showToast]);

    const saveSectionData = async (section, data) => {
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized to make changes.", "error");
            return;
        }
        setLoading(true);
        try {
            await setDoc(doc(db, "content", section), data);
            invalidateCache(`content / ${section} `);
            showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!`);
        } catch (error) {
            console.error(`Error saving ${section}: `, error);
            showToast(`Failed to save ${section}.`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Users Functions
    const fetchUsers = useCallback(async () => {
        if (userRole !== 'superadmin') return;

        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            // Deduplication logic
            const uniqueUsers = new Map();
            const docsToDelete = [];

            querySnapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                const email = data.email?.toLowerCase();

                if (!email) return;

                if (uniqueUsers.has(email)) {
                    // Duplicate found. Keep the oldest or the one with a non-pending role.
                    const existing = uniqueUsers.get(email);

                    // Prefer keeping higher roles over 'pending'
                    const roles = { 'superadmin': 4, 'admin': 3, 'editor': 2, 'pending': 1 };
                    const existingScore = roles[existing.data.role] || 0;
                    const newScore = roles[data.role] || 0;

                    if (newScore > existingScore) {
                        docsToDelete.push(existing.id);
                        uniqueUsers.set(email, { id: docSnap.id, data });
                    } else {
                        docsToDelete.push(docSnap.id);
                    }
                } else {
                    uniqueUsers.set(email, { id: docSnap.id, data });
                }
            });

            // Perform cleanup silently in the background
            if (docsToDelete.length > 0) {
                console.log(`Cleaning up ${docsToDelete.length} duplicate user records...`);
                Promise.all(docsToDelete.map(id => deleteDoc(doc(db, "users", id)))).catch(console.error);
            }

            let finalList = Array.from(uniqueUsers.values()).map(u => ({ id: u.id, ...u.data }));

            // Exclude disabled users from the UI per user request (Option 1)
            finalList = finalList.filter(u => u.isActive !== false);

            // Order by date again (descending)
            finalList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setUsersList(finalList);

        } catch (error) {
            console.error("Error fetching users:", error);
            showToast("Failed to load users.", "error");
        }
    }, [userRole, showToast]);

    const fetchAuditLogs = useCallback(async () => {
        if (userRole !== 'superadmin') return;
        try {
            const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAuditLogsList(logs);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
            showToast("Failed to load audit logs.", "error");
        }
    }, [userRole, showToast]);

    const handleRoleChange = async (userId, newRole) => {
        if (userRole !== 'superadmin') {
            showToast("Only Superadmins can modify users.", "error");
            return;
        }
        try {
            await updateDoc(doc(db, "users", userId), { role: newRole });
            showToast(`Role updated to ${newRole} `);
            fetchUsers();
        } catch (error) {
            console.error("Error updating role:", error);
            showToast('Failed to update role.', 'error');
        }
    };

    const proceedRemoveUser = async (userEmail, userId) => {
        setLoading(true);
        try {
            // Reverting to Soft Disable instead of harsh deletion as requested
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { isActive: false });
            showToast(`User ${userEmail} successfully disabled.`);
            fetchUsers();
        } catch (error) {
            console.error(`Error trying to disable user: `, error);
            showToast(`Failed to disable user.`, 'error');
        } finally {
            setLoading(false);
            setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
        }
    };

    const handleRemoveUser = (userEmail, userId) => {
        if (userRole !== 'superadmin') {
            showToast("Only Superadmins can remove users.", "error");
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Remove User',
            message: `Are you sure you want to disable ${userEmail}?\n\nThey will no longer be able to log in, but their record will remain.`,
            confirmText: 'Yes, Disable',
            type: 'danger',
            onConfirm: () => proceedRemoveUser(userEmail, userId)
        });
    };


    const proceedResetPassword = async (email) => {
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            showToast(`Password reset email sent to ${email} `);
        } catch (error) {
            console.error("Error resetting password:", error);
            showToast("Failed to send reset email.", "error");
        } finally {
            setLoading(false);
            setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
        }
    };

    const handleResetPassword = (email) => {
        if (userRole !== 'superadmin') {
            showToast("Only Superadmins can reset passwords.", "error");
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Reset Password',
            message: `Are you sure you want to send a password reset email to ${email}?`,
            confirmText: 'Send Email',
            type: 'warning',
            onConfirm: () => proceedResetPassword(email)
        });
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (userRole !== 'superadmin') {
            showToast("Only Superadmins can create users.", "error");
            return;
        }
        setLoading(true);
        try {
            // 0. Strict validation: Check if email already exists in Firestore first
            const existingQ = query(collection(db, "users"), where("email", "==", newUserEmail.toLowerCase().trim()));
            const existingSnap = await getDocs(existingQ);

            if (!existingSnap.empty) {
                showToast("This email is already registered in the database.", "error");
                setLoading(false);
                return;
            }

            // 1. Create the new user in Firebase Auth.
            // WARNING: This automatically logs the Superadmin out and the new user in.
            await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword);

            // 2. Since onAuthStateChanged will race with us, we don't manually create the document.
            // We just wait for the auth state listener to generate the 'pending' record.
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 3. Look up their newly auto-created document
            const q = query(collection(db, "users"), where("email", "==", newUserEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // 4. Update the document with their assigned role
                const newDocRef = querySnapshot.docs[0].ref;
                await updateDoc(newDocRef, { role: newUserRole });
            } else {
                // Failsafe: if onAuthStateChanged somehow missed it, we create it
                await addDoc(collection(db, "users"), {
                    email: newUserEmail,
                    role: newUserRole,
                    isActive: true,
                    createdAt: serverTimestamp()
                });
            }

            showToast('User created successfully. You must now log back in as Superadmin.');

            // 5. Force logout because the session is now the new user
            await signOut(auth);

            setShowAddUserForm(false);
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('pending');
        } catch (error) {
            console.error("Error creating user:", error);
            if (error.code === 'auth/email-already-in-use') {
                showToast("This email is already registered.", "error");
            } else if (error.code === 'auth/weak-password') {
                showToast("Password should be at least 6 characters.", "error");
            } else {
                showToast("Failed to create user.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // Role Permissions Functions
    const fetchRolePermissions = useCallback(async () => {
        try {
            const q = query(collection(db, "rolePermissions"));
            const snap = await getDocs(q);
            const perms = {};
            snap.docs.forEach(d => {
                perms[d.data().role] = d.data().allowedTabs || [];
            });
            setRolePermissions(perms);
        } catch (error) {
            console.error("Error fetching role permissions:", error);
        }
    }, []);

    const saveRolePermissions = async (role, allowedTabs) => {
        if (userRole === 'pending' || userRole !== 'superadmin') {
            showToast("Unauthorized.", "error");
            return;
        }
        try {
            // Check if doc exists for this role
            const q = query(collection(db, "rolePermissions"), where("role", "==", role));
            const snap = await getDocs(q);
            if (snap.empty) {
                await addDoc(collection(db, "rolePermissions"), { role, allowedTabs });
            } else {
                await updateDoc(snap.docs[0].ref, { allowedTabs });
            }
            setRolePermissions(prev => ({ ...prev, [role]: allowedTabs }));
            showToast(`Permissions for '${role}' saved!`);
        } catch (error) {
            console.error("Error saving permissions:", error);
            showToast('Failed to save permissions.', 'error');
        }
    };



    // Project Functions
    const fetchProjects = useCallback(async () => {
        try {
            const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            setProjects(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    }, []);

    const handleDeleteProject = async (id) => {
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized.", "error");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteDoc(doc(db, "projects", id));
            invalidateCache('collection:projects');
            setProjects(projects.filter(p => p.id !== id));
            showToast('Project deleted.');
        } catch {
            showToast('Failed to delete project.', 'error');
        }
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized to make changes.", "error");
            return;
        }
        setLoading(true);
        try {
            let finalSlug = project.slug ? project.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            let isDuplicate = true;
            let counter = 1;
            let baseSlug = finalSlug;

            while (isDuplicate) {
                const slugQuery = query(collection(db, "projects"), where("slug", "==", finalSlug));
                const slugSnap = await getDocs(slugQuery);
                isDuplicate = !slugSnap.empty;

                if (isDuplicate) {
                    finalSlug = `${baseSlug} -${counter} `;
                    counter++;
                }
            }

            let imageUrl = '';
            if (projectImage) {
                imageUrl = await compressImageToBase64(projectImage);
            }
            await addDoc(collection(db, "projects"), {
                ...project,
                slug: finalSlug,
                techStack: project.techStack.split(',').map(item => item.trim()),
                imageUrl,
                visible: true,
                featured: false,
                createdAt: serverTimestamp()
            });
            invalidateCache('collection:projects');
            showToast('Project added successfully!');
            setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' });
            setProjectImage(null);
            setShowProjectForm(false);
            fetchProjects();
        } catch {
            showToast('Error adding project.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (p) => {
        setEditingProject(p.id);
        const stack = Array.isArray(p.techStack) ? p.techStack.join(', ') : p.techStack;
        setProject({ ...p, techStack: stack });
        setShowProjectForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized to make changes.", "error");
            return;
        }
        setLoading(true);
        try {
            let finalSlug = project.slug ? project.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            let isDuplicate = true;
            let counter = 1;
            let baseSlug = finalSlug;

            while (isDuplicate) {
                const slugQuery = query(collection(db, "projects"), where("slug", "==", finalSlug));
                const slugSnap = await getDocs(slugQuery);
                isDuplicate = slugSnap.docs.some(doc => doc.id !== editingProject);

                if (isDuplicate) {
                    finalSlug = `${baseSlug} -${counter} `;
                    counter++;
                }
            }

            let imageUrl = project.imageUrl;
            if (projectImage) {
                imageUrl = await compressImageToBase64(projectImage);
            }
            await updateDoc(doc(db, "projects", editingProject), {
                ...project,
                slug: finalSlug,
                techStack: project.techStack.split(',').map(item => item.trim()),
                imageUrl
            });
            showToast('Project updated successfully!');
            setEditingProject(null);
            setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' });
            setProjectImage(null);
            setShowProjectForm(false);
            fetchProjects();
        } catch {
            showToast('Error updating project.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Experience Functions
    const fetchExperiences = useCallback(async () => {
        try {
            const q = query(collection(db, "experience"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            setExperiences(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching experience:", error);
        }
    }, []);

    const handleDeleteExperience = async (id) => {
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized.", "error");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this experience?")) return;
        try {
            await deleteDoc(doc(db, "experience", id));
            invalidateCache('collection:experience');
            setExperiences(experiences.filter(e => e.id !== id));
            showToast('Experience deleted.');
        } catch {
            showToast('Failed to delete experience.', 'error');
        }
    };

    const prepareExperienceForSave = () => {
        const formatMonthYear = (yyyyMm) => {
            if (!yyyyMm) return '';
            const [y, m] = yyyyMm.split('-');
            const d = new Date(y, m - 1);
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        };
        let start = formatMonthYear(experience.startDate);
        let end = experience.isPresent ? 'Present' : formatMonthYear(experience.endDate);

        let finalPeriod = experience.period;
        if (start || end) {
            if (start && end) finalPeriod = `${start} - ${end} `;
            else if (start) finalPeriod = start;
            else if (end) finalPeriod = end;
        }

        // eslint-disable-next-line no-unused-vars
        const { startDate, endDate, isPresent, ...dataToSave } = experience;
        dataToSave.period = finalPeriod;
        return dataToSave;
    };

    const handleAddExperience = async (e) => {
        e.preventDefault();
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized to make changes.", "error");
            return;
        }
        setLoading(true);
        try {
            const dataToSave = prepareExperienceForSave();
            await addDoc(collection(db, "experience"), {
                ...dataToSave,
                visible: true,
                createdAt: serverTimestamp()
            });
            invalidateCache('collection:experience');
            showToast('Experience added successfully!');
            setExperience({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false });
            setShowExperienceForm(false);
            fetchExperiences();
        } catch {
            showToast('Error adding experience.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditExperienceClick = (exp) => {
        setEditingExperience(exp.id);

        let sDate = '';
        let eDate = '';
        let isPres = false;

        if (exp.period) {
            const parts = exp.period.split('-');
            if (parts.length > 0) {
                const start = new Date(parts[0].trim());
                if (!isNaN(start.getTime())) sDate = start.toISOString().substring(0, 7);
            }
            if (parts.length > 1) {
                if (parts[1].toLowerCase().includes('present')) {
                    isPres = true;
                } else {
                    const end = new Date(parts[1].trim());
                    if (!isNaN(end.getTime())) eDate = end.toISOString().substring(0, 7);
                }
            }
        }

        setExperience({ ...exp, startDate: sDate, endDate: eDate, isPresent: isPres });
        setShowExperienceForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateExperience = async (e) => {
        e.preventDefault();
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized to make changes.", "error");
            return;
        }
        setLoading(true);
        try {
            const dataToSave = prepareExperienceForSave();
            await updateDoc(doc(db, "experience", editingExperience), { ...dataToSave });
            showToast('Experience updated successfully!');
            setEditingExperience(null);
            setExperience({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false });
            setShowExperienceForm(false);
            fetchExperiences();
        } catch {
            showToast('Error updating experience.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Toggle visibility for projects or experience
    const toggleVisibility = async (collectionName, id, currentVisible) => {
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized.", "error");
            return;
        }
        try {
            await updateDoc(doc(db, collectionName, id), { visible: !currentVisible });
            invalidateCache(`collection:${collectionName} `);
            if (collectionName === 'projects') {
                setProjects(prev => prev.map(p => p.id === id ? { ...p, visible: !currentVisible } : p));
            } else if (collectionName === 'posts') {
                setPosts(prev => prev.map(p => p.id === id ? { ...p, visible: !currentVisible } : p));
            } else {
                setExperiences(prev => prev.map(e => e.id === id ? { ...e, visible: !currentVisible } : e));
            }
            showToast(`Item ${!currentVisible ? 'visible' : 'hidden'} on homepage.`);
        } catch {
            showToast('Failed to toggle visibility.', 'error');
        }
    };

    // Toggle featured status strictly for projects
    const toggleFeatured = async (id, currentFeatured) => {
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized.", "error");
            return;
        }
        try {
            await updateDoc(doc(db, 'projects', id), { featured: !currentFeatured });
            invalidateCache('collection:projects');
            setProjects(prev => prev.map(p => p.id === id ? { ...p, featured: !currentFeatured } : p));
            showToast(`Project ${!currentFeatured ? 'featured' : 'unfeatured'}.`);
        } catch {
            showToast('Failed to toggle featured status.', 'error');
        }
    };

    // Toggle featured status strictly for posts
    const toggleFeaturedPost = async (id, currentFeatured) => {
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized.", "error");
            return;
        }
        try {
            await updateDoc(doc(db, 'posts', id), { featured: !currentFeatured });
            invalidateCache('collection:posts');
            setPosts(prev => prev.map(p => p.id === id ? { ...p, featured: !currentFeatured } : p));
            showToast(`Post ${!currentFeatured ? 'featured' : 'unfeatured'}.`);
        } catch {
            showToast('Failed to toggle featured status.', 'error');
        }
    };

    // Messages
    const fetchMessages = useCallback(async () => {
        try {
            const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            setMessages(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }, []);

    const handleToggleMessageRead = async (id, currentStatus) => {
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized.", "error");
            return;
        }
        try {
            await updateDoc(doc(db, "messages", id), { isRead: !currentStatus });
            setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: !currentStatus } : m));
            if (viewingMessage && viewingMessage.id === id) {
                setViewingMessage(prev => ({ ...prev, isRead: !currentStatus }));
            }
        } catch {
            showToast('Failed to update message status.', 'error');
        }
    };

    const handleViewMessage = (msg) => {
        setViewingMessage(msg);
        if (!msg.isRead) {
            handleToggleMessageRead(msg.id, false);
        }
    };

    const handleToggleSelectMessage = (id) => {
        setSelectedMessages(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleSelectAllMessages = () => {
        if (selectedMessages.length === paginatedMessages.length) {
            setSelectedMessages([]);
        } else {
            setSelectedMessages(paginatedMessages.map(m => m.id));
        }
    };

    const handleBatchMarkMessages = async (isRead) => {
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized.", "error");
            return;
        }
        if (selectedMessages.length === 0) return;

        try {
            const batch = writeBatch(db);
            selectedMessages.forEach(id => {
                const docRef = doc(db, "messages", id);
                batch.update(docRef, { isRead });
            });
            await batch.commit();
            setMessages(prev => prev.map(m => selectedMessages.includes(m.id) ? { ...m, isRead } : m));
            setSelectedMessages([]);
            showToast(`Marked ${selectedMessages.length} messages as ${isRead ? 'read' : 'unread'}.`);
        } catch {
            showToast('Failed to update messages.', 'error');
        }
    };

    const handleBatchDeleteMessages = async () => {
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized.", "error");
            return;
        }
        if (selectedMessages.length === 0) return;
        if (!window.confirm(`Delete ${selectedMessages.length} messages ? `)) return;

        try {
            const batch = writeBatch(db);
            selectedMessages.forEach(id => {
                const docRef = doc(db, "messages", id);
                batch.delete(docRef);
            });
            await batch.commit();
            setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id)));
            setSelectedMessages([]);
            showToast(`Deleted ${selectedMessages.length} messages.`);
        } catch {
            showToast('Failed to delete messages.', 'error');
        }
    };

    const handleDeleteMessage = async (id) => {
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized.", "error");
            return;
        }
        if (!window.confirm("Delete this message?")) return;
        try {
            await deleteDoc(doc(db, "messages", id));
            setMessages(messages.filter(m => m.id !== id));
            setSelectedMessages(prev => prev.filter(mid => mid !== id));
            if (viewingMessage && viewingMessage.id === id) {
                setViewingMessage(null);
            }
            showToast('Message deleted.');
        } catch {
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
                imageUrl = await compressImageToBase64(homeImage);
            }
            await saveSectionData('home', { ...homeData, profileImageUrl: imageUrl });
            setHomeImage(null);
        } catch {
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
                // Settings favicon should be very small
                faviconUrl = await compressImageToBase64(settingsFavicon, { maxSizeMB: 0.05, maxWidthOrHeight: 256 });
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
    const fetchPosts = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        if (user) {
            // Always fetch role permissions for sidebar dynamic filtering
            fetchRolePermissions();
            if (activeTab === 'projects') fetchProjects();
            else if (activeTab === 'experience') fetchExperiences();
            else if (activeTab === 'messages') fetchMessages();
            else if (activeTab === 'blog') fetchPosts();
            else if (activeTab !== 'users' && activeTab !== 'audit') fetchSectionData(activeTab);
        }
    }, [user, userRole, activeTab, fetchProjects, fetchExperiences, fetchMessages, fetchPosts, fetchRolePermissions, fetchSectionData]);

    useEffect(() => {
        if (activeTab === 'users' && userRole === 'superadmin') {
            fetchUsers();
        }
    }, [activeTab, fetchUsers, userRole]);

    useEffect(() => {
        if (activeTab === 'audit' && userRole === 'superadmin') {
            fetchAuditLogs();
        }
    }, [activeTab, fetchAuditLogs, userRole]);

    const handleSavePost = async (e) => {
        e.preventDefault();
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized to make changes.", "error");
            return;
        }
        setLoading(true);
        try {
            let imageUrl = postForm.coverImage;
            if (postImage) {
                imageUrl = await compressImageToBase64(postImage);
            }

            let finalSlug = postForm.slug ? postForm.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : postForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            let isDuplicate = true;
            let counter = 1;
            let baseSlug = finalSlug;

            while (isDuplicate) {
                const slugQuery = query(collection(db, "posts"), where("slug", "==", finalSlug));
                const slugSnap = await getDocs(slugQuery);
                // True if any returned explicitly matches a document other than the current one
                isDuplicate = slugSnap.docs.some(doc => doc.id !== postForm.id);

                if (isDuplicate) {
                    finalSlug = `${baseSlug} -${counter} `;
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
                await addDoc(collection(db, "posts"), { ...postData, featured: false, createdAt: serverTimestamp() });
                showToast('Post created successfully!');
            }
            invalidateCache('collection:posts');
            setPostForm({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false });
            setShowPostForm(false);
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
        if (userRole === 'pending') {
            showToast("Pending accounts are not authorized.", "error");
            return;
        }
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
                newText = text.substring(0, start) + `** ${selectedText || 'bold text'}** ` + text.substring(end);
                break;
            case 'italic':
                newText = text.substring(0, start) + `* ${selectedText || 'italic text'}* ` + text.substring(end);
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

    const insertMarkdownProject = (syntax) => {
        const textarea = document.getElementById('project-markdown-editor');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = project.content;
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

        setProject({ ...project, content: newText });

        setTimeout(() => {
            textarea.focus();
        }, 0);
    };

    const insertMarkdownExp = (syntax) => {
        const textarea = document.getElementById('exp-markdown-editor');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = experience.description;
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

        setExperience({ ...experience, description: newText });

        setTimeout(() => {
            textarea.focus();
        }, 0);
    };

    // Database Maintenance
    const handleExportDatabase = async () => {
        setLoading(true);
        showToast('Preparing backup, please wait...', 'info');
        try {
            const collectionsToExport = ['posts', 'projects', 'experience', 'messages', 'content'];
            const exportData = {};

            for (const colName of collectionsToExport) {
                exportData[colName] = {};
                const q = query(collection(db, colName));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((docSnap) => {
                    exportData[colName][docSnap.id] = docSnap.data();
                });
            }

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            showToast('Backup downloaded successfully!');
        } catch (error) {
            console.error("Export error:", error);
            showToast('Failed to export database.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleImportDatabase = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm("WARNING: This will overwrite existing data with the same IDs. Are you sure you want to proceed with the restore?")) {
            e.target.value = ''; // Reset input
            return;
        }

        setLoading(true);
        showToast('Restoring backup, please wait...', 'info');

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importData = JSON.parse(event.target.result);

                const restoreTimestamps = (obj) => {
                    if (obj === null || typeof obj !== 'object') return obj;
                    if (Array.isArray(obj)) return obj.map(item => restoreTimestamps(item));
                    if (Object.keys(obj).length === 2 && 'seconds' in obj && 'nanoseconds' in obj) {
                        return new Timestamp(obj.seconds, obj.nanoseconds);
                    }
                    const newObj = {};
                    for (const key in obj) newObj[key] = restoreTimestamps(obj[key]);
                    return newObj;
                };

                const restorePromises = [];
                for (const [colName, docs] of Object.entries(importData)) {
                    for (const [docId, docData] of Object.entries(docs)) {
                        const processedData = restoreTimestamps(docData);
                        const docRef = doc(db, colName, docId);
                        restorePromises.push(setDoc(docRef, processedData));
                    }
                }

                await Promise.all(restorePromises);

                invalidateCache();
                showToast('Restore completed successfully!');

                if (activeTab === 'projects') fetchProjects();
                else if (activeTab === 'experience') fetchExperiences();
                else if (activeTab === 'messages') fetchMessages();
                else if (activeTab === 'blog') fetchPosts();
                else if (activeTab === 'users') fetchUsers();
                else fetchSectionData(activeTab);

            } catch (error) {
                console.error("Import error:", error);
                showToast('Failed to restore database. Invalid file format?', 'error');
            } finally {
                setLoading(false);
                e.target.value = '';
            }
        };
        reader.onerror = () => {
            showToast('Failed to read file.', 'error');
            setLoading(false);
        };
        reader.readAsText(file);
    };

    const handleClearCache = () => {
        invalidateCache();
        showToast('Local app cache cleared successfully!');
    };

    // Auth
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);

                // Add default pending role to users collection if not exists
                const q = query(collection(db, "users"), where("email", "==", email));
                const snap = await getDocs(q);
                if (snap.empty) {
                    await addDoc(collection(db, "users"), {
                        email: email,
                        role: 'pending',
                        isActive: true,
                        createdAt: serverTimestamp()
                    });
                }
                showToast('Account created! You are now logged in.');
            } else {
                await signInWithEmailAndPassword(auth, email, password);

                // Verify the user is not disabled in Firestore
                const q = query(collection(db, "users"), where("email", "==", email));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const userData = snap.docs[0].data();
                    if (userData.isActive === false) {
                        await signOut(auth);
                        throw new Error("Your account has been disabled by an administrator.");
                    }
                }
            }

            // --- Audit Trail Logic ---
            try {
                // Fetch public IP non-blockingly
                const ipRes = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipRes.json();

                // Record the login event
                await addDoc(collection(db, "auditLogs"), {
                    email: email,
                    ipAddress: ipData.ip || 'Unknown',
                    userAgent: navigator.userAgent,
                    timestamp: serverTimestamp()
                });
            } catch (auditError) {
                console.error("Failed to write audit log:", auditError);
                // We intentionally don't throw or show an error toast here to prevent blocking standard login flow
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
    if (isAuthLoading) {
        return (
            <div className={styles.adminLayout} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div
                    className={styles.spinner}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderWidth: '3px',
                        borderColor: 'rgba(100, 255, 218, 0.1)',
                        borderTopColor: '#64ffda'
                    }}
                />
            </div>
        );
    }

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
                    {Object.keys(tabLabels).filter(tab => {
                        if (tab === 'profile') return true;
                        if (userRole === 'superadmin') return true;

                        // Explicitly deny 'users', 'database', and 'audit' to non-superadmins, regardless of rolePermissions
                        if (tab === 'users' || tab === 'database' || tab === 'audit') return false;

                        // Dynamically check permissions from rolePermissions
                        if (userRole && rolePermissions[userRole]) {
                            return rolePermissions[userRole].includes(tab);
                        }

                        // Legacy fallback if no permissions are configured
                        if (userRole === 'admin') return true;
                        if (userRole === 'editor' && (tab === 'projects' || tab === 'blog')) return true;
                        return false;
                    }).map(tab => (
                        <button key={tab} className={activeTab === tab ? styles.active : ''} onClick={() => handleTabClick(tab)}>
                            {icons[tab] || <FileText size={18} />}
                            <span>{tabLabels[tab]}</span>
                            {tab === 'messages' && unreadMessagesCount > 0 && (
                                <span className={styles.badge} style={{ backgroundColor: 'var(--primary-color)', color: '#000' }}>{unreadMessagesCount}</span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>{(userDisplayName || user.email)?.charAt(0).toUpperCase()}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className={styles.userEmail} title={user.email}>{userDisplayName || user.email}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', textTransform: 'capitalize', fontWeight: 'bold' }}>{userRole || 'Loading...'}</span>
                        </div>
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
                        {!showExperienceForm ? (
                            <div className={styles.listSection}>
                                <div className={styles.listSectionHeader}>
                                    <h3 className={styles.listTitle}>Existing Experience <span className={styles.count}>{experiences.length}</span></h3>
                                    <button onClick={() => { setEditingExperience(null); setExperience({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false }); setShowExperienceForm(true); }} className={styles.addBtn}>
                                        ➕ Add New Experience
                                    </button>
                                </div>
                                <div className={styles.searchBox}>
                                    <Search size={16} className={styles.searchIcon} />
                                    <input type="text" placeholder="Search by role or company..." value={searchExperience} onChange={(e) => { setSearchExperience(e.target.value); setExpPage(1); }} />
                                    {searchExperience && <span className={styles.searchResultCount}>{filteredExperiences.length} of {experiences.length}</span>}
                                </div>
                                {filteredExperiences.length === 0 ? (
                                    <div className={styles.emptyState}>{searchExperience ? 'No matching experience found.' : 'No experience entries yet.'}</div>
                                ) : (
                                    <>
                                        {paginatedExperiences.map(exp => (
                                            <div key={exp.id} className={`${styles.listItem} ${exp.visible === false ? styles.hiddenItem : ''}`}>
                                                <div className={styles.listItemInfo}>
                                                    <h4>{exp.role} {exp.visible === false && <span className={styles.hiddenBadge}>Hidden</span>}</h4>
                                                    <p className={styles.listMeta}>{exp.company} • <em>{exp.period}</em></p>
                                                </div>
                                                <div className={styles.listItemActions}>
                                                    <button className={`${styles.visibilityBtn} ${exp.visible === false ? styles.off : ''}`} onClick={() => toggleVisibility('experience', exp.id, exp.visible !== false)} title={exp.visible === false ? 'Show on homepage' : 'Hide from homepage'}>
                                                        {exp.visible === false ? (
                                                            <EyeOff size={16} />
                                                        ) : (
                                                            <Eye size={16} />
                                                        )}
                                                    </button>
                                                    <button className={styles.editBtn} onClick={() => handleEditExperienceClick(exp)} title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className={styles.deleteBtn} onClick={() => handleDeleteExperience(exp.id)} title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <Pagination currentPage={expPage} totalPages={expTotalPages} onPageChange={setExpPage} perPage={expPerPage} onPerPageChange={(v) => { setExpPerPage(v); setExpPage(1); }} totalItems={filteredExperiences.length} />
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3>{editingExperience ? '✏️ Edit Experience' : '➕ Add New Experience'}</h3>
                                    <button onClick={() => { setEditingExperience(null); setExperience({ company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false }); setShowExperienceForm(false); }} className={styles.cancelBtn}>
                                        Cancel & Return
                                    </button>
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
                                    <div className={styles.formGrid}>
                                        <div className={styles.inputGroup}>
                                            <label>Start Date</label>
                                            <input type="month" value={experience.startDate || ''} onChange={(e) => setExperience({ ...experience, startDate: e.target.value })} required />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>
                                                End Date
                                                <span style={{ float: 'right', fontSize: '0.85rem' }}>
                                                    <input type="checkbox" checked={experience.isPresent} onChange={(e) => setExperience({ ...experience, isPresent: e.target.checked })} style={{ marginRight: '0.3rem', width: 'auto' }} />
                                                    Present
                                                </span>
                                            </label>
                                            <input type="month" value={experience.endDate || ''} onChange={(e) => setExperience({ ...experience, endDate: e.target.value })} disabled={experience.isPresent} required={!experience.isPresent} />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                        <div className={styles.editorHeader}>
                                            <label>Description (Markdown)</label>
                                            <div className={styles.toolbar}>
                                                {!isExpPreviewMode && (
                                                    <div className={styles.formatGroup}>
                                                        <button type="button" onClick={() => insertMarkdownExp('bold')} title="Bold"><Bold size={16} /></button>
                                                        <button type="button" onClick={() => insertMarkdownExp('italic')} title="Italic"><Italic size={16} /></button>
                                                        <button type="button" onClick={() => insertMarkdownExp('link')} title="Link"><LinkIcon size={16} /></button>
                                                        <button type="button" onClick={() => insertMarkdownExp('code')} title="Code Block"><Code size={16} /></button>
                                                    </div>
                                                )}
                                                <button type="button" className={styles.previewToggle} onClick={() => setIsExpPreviewMode(!isExpPreviewMode)}>
                                                    {isExpPreviewMode ? <><Edit2 size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
                                                </button>
                                            </div>
                                        </div>
                                        {isExpPreviewMode ? (
                                            <div className={styles.previewBox}>
                                                <MarkdownRenderer content={experience.description || '*Nothing to preview...*'} />
                                            </div>
                                        ) : (
                                            <textarea
                                                id="exp-markdown-editor"
                                                placeholder="Use markdown to format your description..."
                                                value={experience.description}
                                                onChange={(e) => setExperience({ ...experience, description: e.target.value })}
                                                rows="8"
                                                required
                                                style={{ fontFamily: 'monospace' }}
                                            />
                                        )}
                                    </div>
                                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                                        {loading ? <><span className={styles.spinner} /> Saving...</> : (editingExperience ? 'Update Experience' : 'Add Experience')}
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                )}

                {/* ========== PROJECTS TAB ========== */}
                {activeTab === 'projects' && (
                    <>
                        {!showProjectForm ? (
                            <div className={styles.listSection}>
                                <div className={styles.listSectionHeader}>
                                    <h3 className={styles.listTitle}>Existing Projects <span className={styles.count}>{projects.length}</span></h3>
                                    <button onClick={() => { setEditingProject(null); setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' }); setProjectImage(null); setIsProjectPreviewMode(false); setShowProjectForm(true); }} className={styles.addBtn}>
                                        ➕ Add New Project
                                    </button>
                                </div>
                                <div className={styles.searchBox}>
                                    <Search size={16} className={styles.searchIcon} />
                                    <input type="text" placeholder="Search by title or technology..." value={searchProjects} onChange={(e) => { setSearchProjects(e.target.value); setProjPage(1); }} />
                                    {searchProjects && <span className={styles.searchResultCount}>{filteredProjects.length} of {projects.length}</span>}
                                </div>
                                {filteredProjects.length === 0 ? (
                                    <div className={styles.emptyState}>{searchProjects ? 'No matching projects found.' : 'No projects yet.'}</div>
                                ) : (
                                    <>
                                        {paginatedProjects.map(p => (
                                            <div key={p.id} className={`${styles.listItem} ${p.visible === false ? styles.hiddenItem : ''}`}>
                                                <div className={styles.listItemInfo}>
                                                    <h4>{p.title} {p.visible === false && <span className={styles.hiddenBadge}>Hidden</span>}</h4>
                                                    <div className={styles.techTags}>
                                                        {(Array.isArray(p.techStack) ? p.techStack : []).map((t, i) => (
                                                            <span key={i} className={styles.techTag}>{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className={styles.itemActions} style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {p.slug && (
                                                        <button onClick={() => window.open(`#/projects/${p.slug}`, '_blank')} title="View Detail" className={styles.editBtn}>
                                                            <ExternalLink size={16} />
                                                        </button>
                                                    )}
                                                    {userRole !== 'editor' && (
                                                        <>
                                                            <button onClick={() => toggleFeatured(p.id, p.featured)} title={p.featured ? "Unfeature from Homepage" : "Feature on Homepage"} className={styles.editBtn}>
                                                                <Star size={16} fill={p.featured ? "currentColor" : "none"} style={{ color: p.featured ? '#FFD700' : 'inherit' }} />
                                                            </button>
                                                            <button onClick={() => toggleVisibility('projects', p.id, p.visible !== false)} title={p.visible !== false ? "Hide from Projects Page" : "Show on Projects Page"} className={styles.editBtn}>
                                                                {p.visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => handleEditClick(p)} className={styles.editBtn} title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {userRole !== 'editor' && (
                                                        <button onClick={() => handleDeleteProject(p.id)} className={styles.deleteBtn} title="Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <Pagination currentPage={projPage} totalPages={projTotalPages} onPageChange={setProjPage} perPage={projPerPage} onPerPageChange={(v) => { setProjPerPage(v); setProjPage(1); }} totalItems={filteredProjects.length} />
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3>{editingProject ? '✏️ Edit Project' : '➕ Add New Project'}</h3>
                                    <button onClick={() => { setEditingProject(null); setProject({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', slug: '', content: '' }); setProjectImage(null); setIsProjectPreviewMode(false); setShowProjectForm(false); }} className={styles.cancelBtn}>
                                        Cancel & Return
                                    </button>
                                </div>
                                <form onSubmit={editingProject ? handleUpdateProject : handleAddProject} className={styles.form}>
                                    <div className={styles.inputGroup}>
                                        <label>Project Title</label>
                                        <input type="text" placeholder="e.g. Portfolio Website" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Slug (URL) <span className={styles.hint}>(leave empty to auto-generate)</span></label>
                                        <input type="text" placeholder="my-project-url" value={project.slug || ''} onChange={(e) => setProject({ ...project, slug: e.target.value })} />
                                    </div>
                                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                        <label>Short Description (Excerpt)</label>
                                        <textarea placeholder="Describe what this project does..." value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} rows="2" required />
                                    </div>
                                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                                        <div className={styles.editorHeader}>
                                            <label>Full Content (Markdown)</label>
                                            <div className={styles.toolbar}>
                                                {!isProjectPreviewMode && (
                                                    <div className={styles.formatGroup}>
                                                        <button type="button" onClick={() => insertMarkdownProject('bold')} title="Bold"><Bold size={16} /></button>
                                                        <button type="button" onClick={() => insertMarkdownProject('italic')} title="Italic"><Italic size={16} /></button>
                                                        <button type="button" onClick={() => insertMarkdownProject('link')} title="Link"><LinkIcon size={16} /></button>
                                                        <button type="button" onClick={() => insertMarkdownProject('code')} title="Code Block"><Code size={16} /></button>
                                                    </div>
                                                )}
                                                <button type="button" className={styles.previewToggle} onClick={() => setIsProjectPreviewMode(!isProjectPreviewMode)}>
                                                    {isProjectPreviewMode ? <><Edit2 size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
                                                </button>
                                            </div>
                                        </div>
                                        {isProjectPreviewMode ? (
                                            <div className={styles.previewBox}>
                                                <MarkdownRenderer content={project.content || '*Nothing to preview...*'} />
                                            </div>
                                        ) : (
                                            <textarea
                                                id="project-markdown-editor"
                                                placeholder="# Project Overview\nWrite full technical details in Markdown..."
                                                value={project.content || ''}
                                                onChange={(e) => setProject({ ...project, content: e.target.value })}
                                                rows="12"
                                                style={{ fontFamily: 'monospace' }}
                                            />
                                        )}
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
                        )}
                    </>
                )}

                {/* ========== BLOG TAB ========== */}
                {activeTab === 'blog' && (
                    <div className={styles.section} style={{ paddingBottom: '4rem' }}>
                        {!showPostForm ? (
                            <div className={styles.listSection} style={{ marginTop: '0' }}>
                                <div className={styles.listSectionHeader}>
                                    <h3 className={styles.listTitle}>Published Posts <span className={styles.count}>{posts.length}</span></h3>
                                    <button onClick={() => { setPostForm({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false }); setPostImage(null); setIsPreviewMode(false); setShowPostForm(true); }} className={styles.addBtn}>
                                        📝 Add New Post
                                    </button>
                                </div>
                                <div className={styles.searchBox}>
                                    <Search size={16} className={styles.searchIcon} />
                                    <input type="text" placeholder="Search by title or excerpt..." value={searchPosts} onChange={(e) => { setSearchPosts(e.target.value); setPostPage(1); }} />
                                    {searchPosts && <span className={styles.searchResultCount}>{filteredPosts.length} of {posts.length}</span>}
                                </div>

                                {filteredPosts.length === 0 ? (
                                    <div className={styles.emptyState}>{searchPosts ? 'No matching posts found.' : 'No posts yet.'}</div>
                                ) : (
                                    <>
                                        {paginatedPosts.map(post => (
                                            <div key={post.id} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.75rem', borderRadius: '12px' }}>
                                                <div className={styles.itemInfo}>
                                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{post.title}</h4>
                                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{post.excerpt}</p>
                                                    <div className={styles.meta} style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        <span className={styles.date}>{post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                                        <span style={{ marginLeft: '1rem', color: post.visible ? 'var(--primary-color)' : '#ff9800' }}>
                                                            {post.visible ? 'Published' : 'Draft'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={styles.itemActions} style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => window.open(`#/blog/${post.slug}`, '_blank')} title="View" className={styles.editBtn}>
                                                        <ExternalLink size={16} />
                                                    </button>
                                                    {userRole !== 'editor' && (
                                                        <>
                                                            <button onClick={() => toggleFeaturedPost(post.id, post.featured)} title={post.featured ? "Unfeature from Homepage" : "Feature on Homepage"} className={styles.editBtn}>
                                                                <Star size={16} fill={post.featured ? "currentColor" : "none"} style={{ color: post.featured ? '#FFD700' : 'inherit' }} />
                                                            </button>
                                                            <button onClick={() => toggleVisibility('posts', post.id, post.visible)} title={post.visible ? "Hide" : "Show"} className={styles.editBtn}>
                                                                {post.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => { setPostForm(post); setShowPostForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Edit" className={styles.editBtn}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {userRole !== 'editor' && (
                                                        <button onClick={() => handleDeletePost(post.id)} className={styles.deleteBtn} title="Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <Pagination currentPage={postPage} totalPages={postTotalPages} onPageChange={setPostPage} perPage={postPerPage} onPerPageChange={(v) => { setPostPerPage(v); setPostPage(1); }} totalItems={filteredPosts.length} />
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className={styles.card}>
                                <div className={styles.cardHeader} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0 }}>{postForm.id ? '✏️ Edit Post' : '📝 New Blog Post'}</h3>
                                    <button onClick={() => { setPostForm({ id: null, title: '', slug: '', excerpt: '', content: '', coverImage: '', tags: '', visible: true, featured: false }); setPostImage(null); setIsPreviewMode(false); setShowPostForm(false); }} className={styles.cancelBtn}>
                                        Cancel & Return
                                    </button>
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
                                    </div>
                                </form>
                            </div>
                        )}
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
                            <div className={styles.inputGroup}>
                                <label>Blog Filters <span className={styles.hint}>(comma separated, overrides auto-detection)</span></label>
                                <input type="text" placeholder="Tutorial, Tech, Security..." value={settingsData.blogFilters || ''} onChange={(e) => setSettingsData({ ...settingsData, blogFilters: e.target.value })} />
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
                {activeTab === 'profile' && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3>👤 Edit Profile</h3></div>
                        <form onSubmit={handleSaveProfile} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label>Display Name</label>
                                <input type="text" placeholder="Kem Phearum" value={userDisplayName} onChange={(e) => setUserDisplayName(e.target.value)} />
                                <span className={styles.hint}>This name will be displayed in the Admin sidebar instead of your email address.</span>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Email Address</label>
                                <input type="text" value={user.email} disabled style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-secondary)', opacity: 0.7 }} />
                            </div>
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? <><span className={styles.spinner} /> Saving...</> : 'Save Profile'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ========== MESSAGES TAB ========== */}
                {activeTab === 'messages' && (
                    <div className={styles.section} style={{ paddingBottom: '4rem' }}>
                        <div className={styles.listSection} style={{ marginTop: '0' }}>
                            <div className={styles.listSectionHeader}>
                                <h3 className={styles.listTitle}>Inbox <span className={styles.count}>{messages.length}</span></h3>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div className={styles.searchBox} style={{ margin: 0, flex: 1, minWidth: '250px' }}>
                                    <Search size={16} className={styles.searchIcon} />
                                    <input type="text" placeholder="Search by name, email, or message..." value={searchMessages} onChange={(e) => { setSearchMessages(e.target.value); setMessagesPage(1); }} />
                                    {searchMessages && <span className={styles.searchResultCount}>{filteredMessages.length} of {messages.length}</span>}
                                </div>

                                {selectedMessages.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                                            {selectedMessages.length} selected
                                        </span>
                                        <button onClick={() => handleBatchMarkMessages(true)} className={styles.editBtn} title="Mark as Read" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}>
                                            <MailOpen size={14} /> Read
                                        </button>
                                        <button onClick={() => handleBatchMarkMessages(false)} className={styles.editBtn} title="Mark as Unread" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}>
                                            <Mail size={14} /> Unread
                                        </button>
                                        <button onClick={handleBatchDeleteMessages} className={styles.deleteBtn} title="Delete Selected" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            {filteredMessages.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <p>{searchMessages ? 'No matching messages found.' : 'No messages yet.'}</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1rem', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={paginatedMessages.length > 0 && selectedMessages.length === paginatedMessages.length}
                                            onChange={handleSelectAllMessages}
                                            style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                                            title="Select All on this page"
                                        />
                                        <div>Message Details</div>
                                        <div style={{ textAlign: 'right' }}>Date</div>
                                    </div>

                                    {paginatedMessages.map(msg => {
                                        const isUnread = !msg.isRead;
                                        const isSelected = selectedMessages.includes(msg.id);

                                        return (
                                            <div
                                                key={msg.id}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'auto 1fr auto',
                                                    gap: '1rem',
                                                    padding: '1rem 1.5rem',
                                                    background: isSelected ? 'rgba(100, 255, 218, 0.05)' : (isUnread ? 'rgba(255, 255, 255, 0.03)' : 'transparent'),
                                                    border: `1px solid ${isSelected ? 'rgba(100, 255, 218, 0.2)' : 'rgba(255,255,255,0.04)'}`,
                                                    borderLeft: isUnread ? '3px solid var(--primary-color)' : `1px solid ${isSelected ? 'rgba(100, 255, 218, 0.2)' : 'rgba(255,255,255,0.04)'}`,
                                                    borderRadius: '8px',
                                                    alignItems: 'center',
                                                    transition: 'all 0.2s ease',
                                                    marginBottom: '0.5rem',
                                                    cursor: 'pointer'
                                                }}
                                                className={styles.userGridRowHover}
                                                onClick={(e) => {
                                                    // Don't open if clicking checkbox or action buttons
                                                    if (e.target.type !== 'checkbox' && !e.target.closest('button')) {
                                                        handleViewMessage(msg);
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectMessage(msg.id)}
                                                    style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                                                />
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontWeight: isUnread ? 'bold' : 'normal', color: isUnread ? 'white' : 'var(--text-primary)', fontSize: '0.95rem' }}>{msg.name}</span>
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>&lt;{msg.email}&gt;</span>
                                                    </div>
                                                    <div style={{ color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {msg.message}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                    <span style={{ color: isUnread ? 'var(--primary-color)' : 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: isUnread ? 'bold' : 'normal' }}>
                                                        {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleToggleMessageRead(msg.id, msg.isRead); }}
                                                            className={styles.editBtn}
                                                            title={msg.isRead ? "Mark as Unread" : "Mark as Read"}
                                                        >
                                                            {msg.isRead ? <Mail size={16} /> : <MailOpen size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                                            className={styles.deleteBtn}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <Pagination currentPage={messagesPage} totalPages={messagesTotalPages} onPageChange={setMessagesPage} perPage={messagesPerPage} onPerPageChange={(v) => { setMessagesPerPage(v); setMessagesPage(1); }} totalItems={filteredMessages.length} />
                                </>
                            )}
                        </div>
                    </div>
                )}
                {/* ========== DATABASE TAB ========== */}
                {activeTab === 'database' && (
                    <div className={styles.section} style={{ paddingBottom: '4rem' }}>
                        <div className={styles.cardHeader} style={{ marginBottom: '1.5rem' }}>
                            <h3>🗄️ Database</h3>
                        </div>

                        <div className={styles.grid} style={{ marginTop: '2rem' }}>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h4>Export Data</h4>
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        Download a complete JSON backup of all your portfolio collections. Keep this safe!
                                    </p>
                                    <button onClick={handleExportDatabase} disabled={loading} className={styles.submitBtn} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                        <Database size={16} /> {loading ? 'Processing...' : 'Download Full Backup'}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h4>Restore Data</h4>
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        Upload a previously exported JSON backup file to overwrite and restore your database. <strong>Warning: This cannot be undone.</strong>
                                    </p>
                                    <div className={styles.fileDropzone} style={{ padding: '1rem', minHeight: 'auto' }}>
                                        <input type="file" accept=".json,application/json" onChange={handleImportDatabase} disabled={loading} />
                                        <div className={styles.fileDropzoneContent} style={{ flexDirection: 'row', gap: '1rem', height: '100px' }}>
                                            <Upload size={20} />
                                            <span style={{ fontSize: '0.9rem' }}>{loading ? 'Restoring...' : 'Select Backup JSON'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h4>System Cache</h4>
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        The application aggressively caches database requests in-memory to save bandwidth and costs. Use this to force a hard refresh.
                                    </p>
                                    <button onClick={handleClearCache} className={styles.cancelBtn} style={{ width: '100%', padding: '0.8rem' }}>
                                        Clear Local App Cache
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== USERS TAB ========== */}
                {activeTab === 'users' && (
                    <div className={styles.section} style={{ paddingBottom: '4rem' }}>
                        <div className={styles.listSection} style={{ marginTop: '0' }}>
                            <div className={styles.listSectionHeader}>
                                <h3 className={styles.listTitle}>User Management <span className={styles.count}>{usersList.length}</span></h3>
                            </div>

                            {userRole !== 'superadmin' ? (
                                <div className={styles.emptyState}>Only Super Admins can manage users.</div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <div className={styles.searchBox} style={{ margin: 0, flex: 1, marginRight: '1rem' }}>
                                            <Search size={16} className={styles.searchIcon} />
                                            <input type="text" placeholder="Search by email or role..." value={searchUsers} onChange={(e) => { setSearchUsers(e.target.value); setUsersPage(1); }} />
                                            {searchUsers && <span className={styles.searchResultCount}>{filteredUsers.length} of {usersList.length}</span>}
                                        </div>

                                        <button
                                            onClick={() => setShowAddUserForm(!showAddUserForm)}
                                            className={styles.primaryBtn}
                                            style={{ margin: 0 }}
                                        >
                                            {showAddUserForm ? 'Cancel' : '+ Add User'}
                                        </button>
                                    </div>

                                    {showAddUserForm && (
                                        <form onSubmit={handleAddUser} className={styles.formContainer} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Create New User</h4>

                                            <div className={styles.warningBox} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                                <p style={{ color: 'var(--accent-color)', margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>
                                                    <strong>Warning:</strong> Creating a new user logs you out as Superadmin and automatically logs the new user in. You will be redirected to the login screen and will need to log back in as Superadmin.
                                                </p>
                                            </div>

                                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                                    <label>Email Address</label>
                                                    <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required placeholder="user@example.com" />
                                                </div>
                                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                                    <label>Temporary Password</label>
                                                    <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
                                                </div>
                                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                                    <label>Initial Role</label>
                                                    <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                                                        <option value="pending">Pending</option>
                                                        <option value="editor">Editor</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button type="submit" className={styles.primaryBtn} disabled={loading} style={{ width: '100%' }}>
                                                {loading ? 'Creating User & Swapping Session...' : 'Create User'}
                                            </button>
                                        </form>
                                    )}

                                    {filteredUsers.length === 0 ? (
                                        <div className={styles.emptyState}>{searchUsers ? 'No matching users found.' : 'No users registered yet.'}</div>
                                    ) : (
                                        <>
                                            <div className={styles.userGridHeader}>
                                                <div>User</div>
                                                <div>Role</div>
                                                <div>Registered</div>
                                                <div style={{ textAlign: 'right' }}>Actions</div>
                                            </div>
                                            {paginatedUsers.map(u => {
                                                const initials = (u.displayName || u.email || '??').split(/[@.\s]/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
                                                const avatarColors = {
                                                    superadmin: 'linear-gradient(135deg, #10b981, #059669)',
                                                    admin: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                    editor: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                    pending: 'linear-gradient(135deg, #ef4444, #dc2626)'
                                                };
                                                const roleBadgeClass = {
                                                    superadmin: styles.roleSuperadmin,
                                                    admin: styles.roleAdmin,
                                                    editor: styles.roleEditor,
                                                    pending: styles.rolePending
                                                }[u.role] || styles.rolePending;
                                                const roleLabels = { superadmin: '⭐ Super Admin', admin: '🛡 Admin', editor: '✏️ Editor', pending: '⏳ Pending' };

                                                const isUserDisabled = u.isActive === false;

                                                return (
                                                    <div key={u.id} className={styles.userCard} style={{ opacity: isUserDisabled ? 0.6 : 1, filter: isUserDisabled ? 'grayscale(100%)' : 'none' }}>
                                                        <div className={styles.userIdentity}>
                                                            <div className={styles.userAvatar} style={{ background: avatarColors[u.role] || avatarColors.pending }}>
                                                                {initials}
                                                            </div>
                                                            <div className={styles.userIdentityText}>
                                                                <span className={styles.userEmailText} title={u.email}>
                                                                    {isUserDisabled ? <strike>{u.email}</strike> : u.email}
                                                                </span>
                                                                {u.displayName && <span className={styles.userDisplayName}>{u.displayName}</span>}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {isUserDisabled ? (
                                                                <span className={`${styles.roleBadge} ${styles.rolePending}`} style={{ background: 'rgba(255,255,255,0.1)', color: '#888', border: '1px solid rgba(255,255,255,0.2)' }}>
                                                                    🚫 Disabled
                                                                </span>
                                                            ) : u.email === user.email ? (
                                                                <span className={`${styles.roleBadge} ${roleBadgeClass}`}>
                                                                    {roleLabels[u.role] || u.role}
                                                                </span>
                                                            ) : (
                                                                <div className={styles.roleSelectWrapper}>
                                                                    <select
                                                                        className={styles.roleSelect}
                                                                        value={u.role}
                                                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                                    >
                                                                        <option value="pending">Pending</option>
                                                                        <option value="editor">Editor</option>
                                                                        <option value="admin">Admin</option>
                                                                        <option value="superadmin">Super Admin</option>
                                                                    </select>
                                                                    <ChevronDown size={14} className={styles.roleSelectIcon} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={styles.userMeta}>
                                                            {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                                                        </div>
                                                        <div className={styles.userActions}>
                                                            <button
                                                                onClick={() => handleResetPassword(u.email)}
                                                                className={styles.userActionBtn}
                                                                title="Send Password Reset Email"
                                                            >
                                                                🔑 Reset
                                                            </button>
                                                            {u.email === user.email ? (
                                                                <span className={styles.youBadge}>✓ You</span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleRemoveUser(u.email, u.id)}
                                                                    className={styles.userActionBtn}
                                                                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                                                    title="Remove User"
                                                                >
                                                                    🚫 Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <Pagination currentPage={usersPage} totalPages={usersTotalPages} onPageChange={setUsersPage} perPage={usersPerPage} onPerPageChange={(v) => { setUsersPerPage(v); setUsersPage(1); }} totalItems={filteredUsers.length} />
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {/* ========== ROLE PERMISSIONS MANAGER ========== */}
                        {userRole === 'superadmin' && (
                            <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 className={styles.listTitle} style={{ marginBottom: '0.25rem' }}>Role Permissions</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Control which sidebar tabs each role can access.</p>
                                    </div>
                                    <button onClick={() => {
                                        if (!showRolePerms) {
                                            // Initialize editingRolePerms with current state
                                            const allRoles = ['pending', 'editor', 'admin'];
                                            const initial = {};
                                            allRoles.forEach(r => { initial[r] = [...(rolePermissions[r] || [])]; });
                                            setEditingRolePerms(initial);
                                        }
                                        setShowRolePerms(!showRolePerms);
                                    }} className={styles.primaryBtn}>
                                        {showRolePerms ? 'Close Editor' : '⚙ Configure Permissions'}
                                    </button>
                                </div>

                                {showRolePerms && (() => {
                                    const managedRoles = ['pending', 'editor', 'admin'];
                                    const allTabs = Object.keys(tabLabels).filter(t => t !== 'profile' && t !== 'users');

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            {managedRoles.map(role => (
                                                <div key={role} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
                                                    <h4 style={{ margin: '0 0 1rem 0', textTransform: 'capitalize', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                                        {role === 'pending' ? '⏳ Pending' : role === 'editor' ? '✏️ Editor' : '🛡 Admin'} Role
                                                    </h4>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                                                        {allTabs.map(tab => {
                                                            const checked = (editingRolePerms[role] || []).includes(tab);
                                                            return (
                                                                <label key={tab} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', padding: '0.4rem 0.75rem', borderRadius: '8px', border: `1px solid ${checked ? 'rgba(100,255,218,0.3)' : 'rgba(255,255,255,0.08)'}`, background: checked ? 'rgba(100,255,218,0.07)' : 'transparent', color: checked ? 'var(--primary-color)' : 'var(--text-secondary)', transition: 'all 0.2s ease' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        style={{ accentColor: 'var(--primary-color)' }}
                                                                        onChange={e => {
                                                                            const current = [...(editingRolePerms[role] || [])];
                                                                            const updated = e.target.checked
                                                                                ? [...current, tab]
                                                                                : current.filter(t => t !== tab);
                                                                            setEditingRolePerms(prev => ({ ...prev, [role]: updated }));
                                                                        }}
                                                                    />
                                                                    {tabLabels[tab]}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                    <button
                                                        onClick={() => saveRolePermissions(role, editingRolePerms[role] || [])}
                                                        className={styles.primaryBtn}
                                                        style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                                                    >
                                                        Save {role} permissions
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {/* ========== AUDIT LOGS TAB ========== */}
                {activeTab === 'audit' && (
                    <div className={styles.section} style={{ paddingBottom: '4rem' }}>
                        <div className={styles.listSection} style={{ marginTop: '0' }}>
                            <div className={styles.listSectionHeader}>
                                <h3 className={styles.listTitle}>Login Audit Trail <span className={styles.count}>{auditLogsList.length}</span></h3>
                            </div>

                            {userRole !== 'superadmin' ? (
                                <div className={styles.emptyState}>Only Super Admins can view audit logs.</div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <div className={styles.searchBox} style={{ margin: 0, flex: 1, marginRight: '1rem' }}>
                                            <Search size={16} className={styles.searchIcon} />
                                            <input type="text" placeholder="Search by email or IP..." value={searchUsers} onChange={(e) => { setSearchUsers(e.target.value); setAuditPage(1); }} />
                                            {searchUsers && <span className={styles.searchResultCount}>{filteredAuditLogs.length} of {auditLogsList.length}</span>}
                                        </div>
                                    </div>

                                    {filteredAuditLogs.length === 0 ? (
                                        <div className={styles.emptyState}>{searchUsers ? 'No matching logs found.' : 'No audit logs recorded yet.'}</div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 1.5fr', gap: '1rem', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                <div>User Email</div>
                                                <div>IP Address</div>
                                                <div>User Agent</div>
                                                <div>Timestamp</div>
                                            </div>
                                            {paginatedAuditLogs.map(log => (
                                                <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 1.5fr', gap: '1rem', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '0.85rem', alignItems: 'center', transition: 'background 0.2s ease', cursor: 'default', ':hover': { background: 'rgba(255,255,255,0.04)' } }} className={styles.userGridRowHover}>
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--primary-color)' }}>
                                                        {log.email}
                                                    </div>
                                                    <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                                        {log.ipAddress}
                                                    </div>
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }} title={log.userAgent}>
                                                        {log.userAgent}
                                                    </div>
                                                    <div style={{ color: 'var(--text-primary)' }}>
                                                        {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Unknown'}
                                                    </div>
                                                </div>
                                            ))}
                                            <Pagination currentPage={auditPage} totalPages={auditTotalPages} onPageChange={setAuditPage} perPage={auditPerPage} onPerPageChange={(v) => { setAuditPerPage(v); setAuditPage(1); }} totalItems={filteredAuditLogs.length} />
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* ========== CUSTOM CONFIRMATION MODAL ========== */}
            {confirmDialog.isOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.confirmModal}>
                        <div className={`${styles.modalHeader} ${styles[confirmDialog.type]}`}>
                            <h3>{confirmDialog.title}</h3>
                        </div>
                        <div className={styles.modalBody}>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{confirmDialog.message}</p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' })}
                            >
                                Cancel
                            </button>
                            <button
                                className={`${styles.confirmBtn} ${styles[confirmDialog.type]}`}
                                onClick={confirmDialog.onConfirm}
                            >
                                {confirmDialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ========== MESSAGE VIEW MODAL ========== */}
            {viewingMessage && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.confirmModal} style={{ width: '90%', maxWidth: '600px', background: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className={styles.modalHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Mail size={20} style={{ color: 'var(--primary-color)' }} />
                                Message Details
                            </h3>
                            <button onClick={() => setViewingMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody} style={{ padding: '1.5rem 0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, auto) 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'right' }}>From:</div>
                                <div>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{viewingMessage.name}</span>
                                    <br />
                                    <a href={`mailto:${viewingMessage.email}`} style={{ color: 'var(--primary-color)', fontSize: '0.9rem', textDecoration: 'none' }}>{viewingMessage.email}</a>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'right' }}>Date:</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {viewingMessage.createdAt?.seconds ? new Date(viewingMessage.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                </div>
                            </div>
                            <div style={{ padding: '0 1.5rem' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Message:</div>
                                <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0, padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    {viewingMessage.message}
                                </p>
                            </div>
                        </div>
                        <div className={styles.modalFooter} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteMessage(viewingMessage.id)}
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    className={styles.editBtn}
                                    onClick={() => { handleToggleMessageRead(viewingMessage.id, viewingMessage.isRead); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    {viewingMessage.isRead ? <><Mail size={16} /> Mark Unread</> : <><MailOpen size={16} /> Mark Read</>}
                                </button>
                                <button
                                    className={styles.confirmBtn}
                                    style={{ background: 'var(--primary-color)', color: '#000', border: 'none' }}
                                    onClick={() => setViewingMessage(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
