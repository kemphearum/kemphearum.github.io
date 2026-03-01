import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, orderBy, query, setDoc, getDoc, updateDoc, where, Timestamp, writeBatch, limit, getCountFromServer } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
import styles from './Admin.module.scss';
import { useNavigate } from 'react-router-dom';
import { invalidateCache } from '../hooks/useFirebaseData';
import {
    LayoutDashboard, Users, LogOut, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Check, X, Shield, Settings, Activity, FileText, Code, Database, Globe, Download, Upload, Mail, Eye, Trash2, Github, ExternalLink, Calendar, Search, FileEdit, Plus, RefreshCw, Smartphone, Key, BarChart2, Folder, Clock, Server, EyeOff, Layout, Type, ShieldAlert, BookOpen, AlertCircle, Edit, Edit2, List, User, UserPlus, Bold, Italic, Link as LinkIcon, Sun, Moon, Star, ArrowUpDown, MailOpen, Monitor, Tablet, TrendingUp, MapPin, Share2, Eye as EyeIcon
} from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useTheme } from '../context/ThemeContext';
import { sortData } from '../utils/sortData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Icons as small components
const icons = {
    analytics: (
        <BarChart2 size={18} />
    ),
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
    database: 'Database',
    users: 'Users',
    audit: 'Audit Logs',
    analytics: 'Analytics'
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

// Reusable SortableHeader component
const SortableHeader = ({ label, field, sortField, sortDirection, onSort, style }) => (
    <div
        onClick={() => onSort(field)}
        style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'color 0.2s ease', ...style }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-color)'}
        onMouseLeave={e => e.currentTarget.style.color = ''}
    >
        {label}
        {sortField === field
            ? (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
            : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
    </div>
);

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

    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 992);
    const [sidebarPersistent, setSidebarPersistent] = useState(() => {
        const stored = localStorage.getItem('adminSidebarPersistent');
        return stored !== null ? JSON.parse(stored) : true;
    });

    useEffect(() => {
        localStorage.setItem('adminSidebarPersistent', JSON.stringify(sidebarPersistent));
    }, [sidebarPersistent]);

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
    const [viewingProject, setViewingProject] = useState(null);

    // Experience State
    const [experiences, setExperiences] = useState([]);
    const [experience, setExperience] = useState({
        company: '', role: '', period: '', description: '', startDate: '', endDate: '', isPresent: false
    });
    const [editingExperience, setEditingExperience] = useState(null);
    const [showExperienceForm, setShowExperienceForm] = useState(false);
    const [isExpPreviewMode, setIsExpPreviewMode] = useState(false);
    const [viewingExperience, setViewingExperience] = useState(null);

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
    const [viewingPost, setViewingPost] = useState(null);
    const [searchMessages, setSearchMessages] = useState('');
    const [messagesPage, setMessagesPage] = useState(1);
    const [messagesPerPage, setMessagesPerPage] = useState(10);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [viewingMessage, setViewingMessage] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [messages, setMessages] = useState([]);

    // Users & Audit State
    const [usersList, setUsersList] = useState([]);

    // Database Health State
    const [dbHealth, setDbHealth] = useState({
        posts: 0,
        projects: 0,
        experiences: 0,
        messages: 0,
        auditLogs: 0,
        users: 0,
        lastUpdated: null,
        loading: false
    });

    // Daily Usage Tracker State
    const [dailyUsage, setDailyUsage] = useState(() => {
        const stored = localStorage.getItem('firebase_daily_usage');
        const today = new Date().toDateString();
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.date === today) return parsed;
        }
        return { date: today, reads: 0, writes: 0, deletes: 0 };
    });

    useEffect(() => {
        localStorage.setItem('firebase_daily_usage', JSON.stringify(dailyUsage));
    }, [dailyUsage]);

    const trackRead = useCallback((count = 1) => {
        setDailyUsage(prev => {
            const today = new Date().toDateString();
            if (prev.date !== today) return { date: today, reads: count, writes: 0, deletes: 0 };
            return { ...prev, reads: prev.reads + count };
        });
    }, []);

    const trackWrite = useCallback((count = 1) => {
        setDailyUsage(prev => {
            const today = new Date().toDateString();
            if (prev.date !== today) return { date: today, reads: 0, writes: count, deletes: 0 };
            return { ...prev, writes: prev.writes + count };
        });
    }, []);

    const trackDelete = useCallback((count = 1) => {
        setDailyUsage(prev => {
            const today = new Date().toDateString();
            if (prev.date !== today) return { date: today, reads: 0, writes: 0, deletes: count };
            return { ...prev, deletes: prev.deletes + count };
        });
    }, []);

    const SOFT_DOC_LIMIT = 50000;
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiveDays, setArchiveDays] = useState(30);
    const [auditLogsList, setAuditLogsList] = useState([]);
    const [selectedAuditLog, setSelectedAuditLog] = useState(null);

    // Analytics State
    const [visits, setVisits] = useState([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsRange, setAnalyticsRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], preset: '30d' };
    });
    const [analyticsDetail, setAnalyticsDetail] = useState(null); // 'visits' | 'countries' | 'devices' | 'pages' | null

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

    // Sort State
    const [expSort, setExpSort] = useState({ field: 'period', dir: 'desc' });
    const [projSort, setProjSort] = useState({ field: 'title', dir: 'asc' });
    const [postSort, setPostSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [usersSort, setUsersSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [msgSort, setMsgSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [auditSort, setAuditSort] = useState({ field: 'timestamp', dir: 'desc' });

    const toggleSort = useCallback((setter, pageSetter) => (field) => {
        setter(prev => ({
            field,
            dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc'
        }));
        pageSetter(1);
    }, []);

    const handleExpSort = useMemo(() => toggleSort(setExpSort, setExpPage), [toggleSort]);
    const handleProjSort = useMemo(() => toggleSort(setProjSort, setProjPage), [toggleSort]);
    const handlePostSort = useMemo(() => toggleSort(setPostSort, setPostPage), [toggleSort]);
    const handleUsersSort = useMemo(() => toggleSort(setUsersSort, setUsersPage), [toggleSort]);
    const handleMsgSort = useMemo(() => toggleSort(setMsgSort, setMessagesPage), [toggleSort]);
    const handleAuditSort = useMemo(() => toggleSort(setAuditSort, setAuditPage), [toggleSort]);


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
        return sortData(result, msgSort);
    }, [messages, searchMessages, msgSort]);

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
        const filtered = !q ? experiences : experiences.filter(e => (e.role || '').toLowerCase().includes(q) || (e.company || '').toLowerCase().includes(q));
        return sortData(filtered, expSort);
    }, [experiences, searchExperience, expSort]);
    const expTotalPages = Math.ceil(filteredExperiences.length / expPerPage);
    const paginatedExperiences = useMemo(() => filteredExperiences.slice((expPage - 1) * expPerPage, expPage * expPerPage), [filteredExperiences, expPage, expPerPage]);

    const filteredProjects = useMemo(() => {
        const q = searchProjects.toLowerCase();
        const filtered = !q ? projects : projects.filter(p => (p.title || '').toLowerCase().includes(q) || (Array.isArray(p.techStack) ? p.techStack.join(' ') : '').toLowerCase().includes(q));
        return sortData(filtered, projSort);
    }, [projects, searchProjects, projSort]);
    const projTotalPages = Math.ceil(filteredProjects.length / projPerPage);
    const paginatedProjects = useMemo(() => filteredProjects.slice((projPage - 1) * projPerPage, projPage * projPerPage), [filteredProjects, projPage, projPerPage]);

    const filteredPosts = useMemo(() => {
        const q = searchPosts.toLowerCase();
        const filtered = !q ? posts : posts.filter(p => (p.title || '').toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q));
        return sortData(filtered, postSort);
    }, [posts, searchPosts, postSort]);
    const postTotalPages = Math.ceil(filteredPosts.length / postPerPage);
    const paginatedPosts = useMemo(() => filteredPosts.slice((postPage - 1) * postPerPage, postPage * postPerPage), [filteredPosts, postPage, postPerPage]);

    const filteredUsers = useMemo(() => {
        const filtered = usersList.filter(u =>
            (u.email || '').toLowerCase().includes(searchUsers.toLowerCase()) ||
            (u.displayName || '').toLowerCase().includes(searchUsers.toLowerCase())
        );
        return sortData(filtered, usersSort);
    }, [usersList, searchUsers, usersSort]);

    const filteredAuditLogs = useMemo(() => {
        const filtered = auditLogsList.filter(log =>
            (log.email || '').toLowerCase().includes(searchUsers.toLowerCase()) ||
            (log.ipAddress || '').includes(searchUsers)
        );
        return sortData(filtered, auditSort);
    }, [auditLogsList, searchUsers, auditSort]);
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


    // Handle Navigation Tab clicks
    const handleTabClick = (tab) => {
        setActiveTab(tab);
        if (!sidebarPersistent || window.innerWidth <= 900) {
            setSidebarOpen(false); // Only auto-close if not persistent or on mobile
        }
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
            trackWrite(1);
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
                trackRead(querySnapshot.size);
                const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProjects(list);
            }
            if (section === 'blog') {
                const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                trackRead(querySnapshot.size);
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
            trackWrite(1);
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
            trackRead(querySnapshot.size);

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
                Promise.all(docsToDelete.map(id => { trackDelete(1); return deleteDoc(doc(db, "users", id)); })).catch(console.error);
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
            setLoading(true);
            const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100)); // Limit to last 100 for performance
            const querySnapshot = await getDocs(q);
            trackRead(querySnapshot.size);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAuditLogsList(data);
        } catch (error) {
            console.error("Error fetching audit logs: ", error);
            showToast("Failed to load audit logs.", "error");
        } finally {
            setLoading(false);
        }
    }, [userRole, showToast]);

    // Database Health Functions
    const fetchDatabaseHealth = useCallback(async () => {
        if (userRole !== 'superadmin') return;
        try {
            setDbHealth(prev => ({ ...prev, loading: true }));

            // Map common collections, executing count queries in parallel
            const collectionsToCount = {
                posts: 'posts',
                projects: 'projects',
                experiences: 'experience',
                messages: 'messages', // Changed from 'contact_messages' to 'messages' based on existing code
                auditLogs: 'auditLogs', // Changed from 'audit_logs' to 'auditLogs' based on existing code
                users: 'users'
            };

            const counts = {};
            await Promise.all(
                Object.entries(collectionsToCount).map(async ([key, colName]) => {
                    const collRef = collection(db, colName);
                    try {
                        const snapshot = await getCountFromServer(collRef);
                        counts[key] = snapshot.data().count;
                    } catch (e) {
                        // Some collections might not exist yet or fail perms, default to 0
                        counts[key] = 0;
                    }
                })
            );

            setDbHealth({
                ...counts,
                lastUpdated: new Date(),
                loading: false
            });
        } catch (error) {
            console.error("Error fetching database health stats: ", error);
            setDbHealth(prev => ({ ...prev, loading: false }));
            showToast("Failed to load database health stats.", "error");
        }
    }, [userRole, showToast]);

    const fetchAnalytics = useCallback(async () => {
        if (userRole !== 'superadmin' && userRole !== 'admin') return;
        setAnalyticsLoading(true);
        try {
            const startDate = new Date(analyticsRange.start + 'T00:00:00');
            const endDate = new Date(analyticsRange.end + 'T23:59:59');

            const q = query(
                collection(db, "visits"),
                where("timestamp", ">=", startDate),
                where("timestamp", "<=", endDate),
                orderBy("timestamp", "desc")
            );

            const querySnapshot = await getDocs(q);
            trackRead(querySnapshot.size);
            const visitDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVisits(visitDocs);
        } catch (error) {
            console.error("Error fetching analytics:", error);
            showToast("Failed to load analytics data.", "error");
        } finally {
            setAnalyticsLoading(false);
        }
    }, [userRole, showToast, analyticsRange]);

    const handleAnalyticsPreset = useCallback((preset) => {
        const end = new Date();
        const start = new Date();
        switch (preset) {
            case '7d': start.setDate(end.getDate() - 7); break;
            case '30d': start.setDate(end.getDate() - 30); break;
            case '90d': start.setDate(end.getDate() - 90); break;
            case 'all': start.setFullYear(2020); break;
            default: start.setDate(end.getDate() - 30);
        }
        setAnalyticsRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], preset });
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        if (userRole !== 'superadmin') {
            showToast("Only Superadmins can modify users.", "error");
            return;
        }
        try {
            await updateDoc(doc(db, "users", userId), { role: newRole });
            trackWrite(1);
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
            trackWrite(1);
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
            trackRead(existingSnap.size);

            if (!existingSnap.empty) {
                showToast("This email is already registered in the database.", "error");
                setLoading(false);
                return;
            }

            // 1. Create the new user using the REST API to prevent signing out the current Superadmin
            const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

            const signupResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPassword,
                    returnSecureToken: false
                })
            });

            const signupData = await signupResponse.json();

            if (!signupResponse.ok) {
                throw new Error(signupData.error?.message || 'Failed to create user in Authentication');
            }

            // 2. Add the user directly to Firestore
            await addDoc(collection(db, "users"), {
                email: newUserEmail,
                role: newUserRole,
                isActive: true,
                createdAt: serverTimestamp()
            });

            showToast('User created successfully.');

            // Fetch to update the local list
            fetchUsers();

            setShowAddUserForm(false);
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('pending');
        } catch (error) {
            console.error("Error creating user:", error);
            if (error.message.includes('EMAIL_EXISTS')) {
                showToast("This email is already registered.", "error");
            } else if (error.message.includes('WEAK_PASSWORD')) {
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
            trackRead(snap.size);
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
                trackWrite(1);
            } else {
                await updateDoc(snap.docs[0].ref, { allowedTabs });
                trackWrite(1);
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
            trackRead(querySnapshot.size);
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
            trackDelete(1);
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
            trackWrite(1);
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
            trackWrite(1);
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
            trackRead(querySnapshot.size);
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
            trackDelete(1);
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
            trackWrite(1);
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
            trackWrite(1);
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
            trackWrite(1);
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
            trackWrite(1);
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
            trackWrite(1);
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
            trackRead(querySnapshot.size);
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

        // Optimistic UI Update
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: !currentStatus } : m));
        setViewingMessage(prev => (prev && prev.id === id) ? { ...prev, isRead: !currentStatus } : prev);

        try {
            await updateDoc(doc(db, "messages", id), { isRead: !currentStatus });
            trackWrite(1);
        } catch {
            // Revert on error
            setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: currentStatus } : m));
            setViewingMessage(prev => (prev && prev.id === id) ? { ...prev, isRead: currentStatus } : prev);
            showToast('Failed to update message status.', 'error');
        }
    };

    const handleViewMessage = (msg) => {
        if (!msg.isRead) {
            setViewingMessage({ ...msg, isRead: true });
            handleToggleMessageRead(msg.id, false);
        } else {
            setViewingMessage(msg);
        }
    };

    const handleToggleSelectMessage = (id) => {
        setSelectedMessages(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleSelectAllMessages = () => {
        const paginatedIds = paginatedMessages.map(m => m.id);
        const allSelected = paginatedIds.every(id => selectedMessages.includes(id)) && paginatedIds.length > 0;

        if (allSelected) {
            // Uncheck all on current page
            setSelectedMessages(prev => prev.filter(id => !paginatedIds.includes(id)));
        } else {
            // Check all on current page (add only those not already selected)
            setSelectedMessages(prev => {
                const newSelections = paginatedIds.filter(id => !prev.includes(id));
                return [...prev, ...newSelections];
            });
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
            trackWrite(selectedMessages.length);
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
            trackDelete(selectedMessages.length);
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
            trackDelete(1);
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
            trackRead(querySnapshot.size);
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
            // Always fetch messages to show the unread badge globally in the sidebar
            fetchMessages();

            if (activeTab === 'projects') fetchProjects();
            else if (activeTab === 'experience') fetchExperiences();
            else if (activeTab === 'blog') fetchPosts();
            else if (activeTab !== 'users' && activeTab !== 'audit' && activeTab !== 'database' && activeTab !== 'analytics' && activeTab !== 'messages') fetchSectionData(activeTab);
        }
    }, [user, userRole, activeTab, fetchProjects, fetchExperiences, fetchMessages, fetchPosts, fetchRolePermissions, fetchSectionData]);

    useEffect(() => {
        if (activeTab === 'users' && userRole === 'superadmin') {
            fetchUsers();
            fetchAuditLogs();
        }
        if (activeTab === 'database' && userRole === 'superadmin') {
            fetchDatabaseHealth();
        }
    }, [activeTab, fetchUsers, userRole, fetchAuditLogs, fetchDatabaseHealth]);

    useEffect(() => {
        if (activeTab === 'audit' && userRole === 'superadmin') {
            fetchAuditLogs();
        }
    }, [activeTab, fetchAuditLogs, userRole]);

    useEffect(() => {
        if (activeTab === 'analytics' && (userRole === 'superadmin' || userRole === 'admin')) {
            fetchAnalytics();
        }
    }, [activeTab, fetchAnalytics, userRole]);

    // ======= ANALYTICS DATA PROCESSING =======
    const CHART_COLORS = ['#64ffda', '#7c4dff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4fc3f7', '#f48fb1', '#ce93d8', '#ffab91', '#80cbc4'];

    const dailyVisits = useMemo(() => {
        if (!visits.length) return [];
        const grouped = {};
        visits.forEach(v => {
            const date = v.date || (v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toISOString().split('T')[0] : null);
            if (!date) return;
            if (!grouped[date]) grouped[date] = { total: 0, sessions: new Set() };
            grouped[date].total++;
            if (v.sessionId) grouped[date].sessions.add(v.sessionId);
        });
        return Object.entries(grouped)
            .map(([date, data]) => ({ date, visits: data.total, unique: data.sessions.size }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [visits]);

    const countryData = useMemo(() => {
        if (!visits.length) return [];
        const grouped = {};
        visits.forEach(v => {
            const country = v.country || 'Unknown';
            grouped[country] = (grouped[country] || 0) + 1;
        });
        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [visits]);

    const topPages = useMemo(() => {
        if (!visits.length) return [];
        const grouped = {};
        visits.forEach(v => {
            const path = v.path || '/';
            grouped[path] = (grouped[path] || 0) + 1;
        });
        return Object.entries(grouped)
            .map(([path, count]) => ({ path: path === '/' ? 'Home' : path.replace(/^\//, ''), count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [visits]);

    const deviceData = useMemo(() => {
        if (!visits.length) return [];
        const grouped = {};
        visits.forEach(v => {
            const device = v.device || 'unknown';
            const label = device.charAt(0).toUpperCase() + device.slice(1);
            grouped[label] = (grouped[label] || 0) + 1;
        });
        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [visits]);

    const summaryStats = useMemo(() => {
        if (!visits.length) return { total: 0, unique: 0, topCountry: '-', topPage: '-' };
        const uniqueSessions = new Set(visits.map(v => v.sessionId).filter(Boolean));
        const topCountry = countryData.length > 0 ? countryData[0].name : '-';
        const topPage = topPages.length > 0 ? topPages[0].path : '-';
        return { total: visits.length, unique: uniqueSessions.size, topCountry, topPage };
    }, [visits, countryData, topPages]);

    const cityData = useMemo(() => {
        if (!visits.length) return [];
        const grouped = {};
        visits.forEach(v => {
            const city = v.city || 'Unknown';
            const country = v.country || '';
            const key = `${city}, ${country}`.replace(/, $/, '');
            grouped[key] = (grouped[key] || 0) + 1;
        });
        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [visits]);

    const referrerData = useMemo(() => {
        if (!visits.length) return [];
        const grouped = {};
        visits.forEach(v => {
            const ref = v.referrer || 'Direct';
            grouped[ref] = (grouped[ref] || 0) + 1;
        });
        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [visits]);

    const parseBrowser = (ua) => {
        if (!ua) return 'Unknown';
        if (ua.includes('Edg/')) return 'Edge';
        if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
        if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
        if (ua.includes('Firefox/')) return 'Firefox';
        if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
        return 'Other';
    };

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
                trackWrite(1);
                showToast('Post updated successfully!');
            } else {
                await addDoc(collection(db, "posts"), { ...postData, featured: false, createdAt: serverTimestamp() });
                trackWrite(1);
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
            trackDelete(1);
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
        if (userRole !== 'superadmin') return;

        try {
            setLoading(true);
            const collectionsToExport = ['posts', 'projects', 'experience', 'messages', 'auditLogs', 'users', 'content'];
            const dbRef = db;

            let exportData = {
                exportDate: new Date().toISOString(),
                collections: {}
            };

            for (const collName of collectionsToExport) {
                try {
                    const q = query(collection(dbRef, collName));
                    const querySnapshot = await getDocs(q);
                    trackRead(querySnapshot.size);

                    if (!querySnapshot.empty) {
                        exportData.collections[collName] = {};
                        querySnapshot.forEach((doc) => {
                            exportData.collections[collName][doc.id] = doc.data();
                        });
                    }
                } catch (colError) {
                    console.warn(`Skipping collection ${collName} due to permissions or absence:`, colError);
                }
            }

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            showToast("Database exported successfully!", "success");
        } catch (error) {
            console.error("Error exporting database:", error);
            showToast("Failed to export database.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveData = async (daysOld = 30) => {
        if (userRole !== 'superadmin') return;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

        try {
            setShowArchiveConfirm(false); // Close modal if open
            setLoading(true);
            showToast("Gathering data to archive...", "success");

            const archivedData = {
                archiveDate: new Date().toISOString(),
                cutoffDate: cutoffDate.toISOString(),
                collections: { messages: {}, auditLogs: {} }
            };

            // 1. Fetch old Messages
            const oldMessagesQ = query(collection(db, 'messages'), where('createdAt', '<', cutoffTimestamp));
            const oldMessagesSnap = await getDocs(oldMessagesQ);
            trackRead(oldMessagesSnap.size);

            // 2. Fetch old Audit Logs
            const oldLogsQ = query(collection(db, 'auditLogs'), where('timestamp', '<', cutoffTimestamp));
            const oldLogsSnap = await getDocs(oldLogsQ);
            trackRead(oldLogsSnap.size);

            // 3. Fetch old Analytics (visits)
            const oldVisitsQ = query(collection(db, 'visits'), where('timestamp', '<', cutoffTimestamp));
            const oldVisitsSnap = await getDocs(oldVisitsQ);
            trackRead(oldVisitsSnap.size);

            // 4. Build Backup JSON
            const batch = writeBatch(db);
            let deletionCount = 0;

            oldMessagesSnap.forEach(docSnap => {
                archivedData.collections.messages[docSnap.id] = docSnap.data();
                batch.delete(docSnap.ref);
                deletionCount++;
            });

            oldLogsSnap.forEach(docSnap => {
                archivedData.collections.auditLogs[docSnap.id] = docSnap.data();
                batch.delete(docSnap.ref);
                deletionCount++;
            });

            oldVisitsSnap.forEach(docSnap => {
                if (!archivedData.collections.visits) archivedData.collections.visits = {};
                archivedData.collections.visits[docSnap.id] = docSnap.data();
                batch.delete(docSnap.ref);
                deletionCount++;
            });

            if (deletionCount === 0) {
                showToast(`No records found older than ${daysOld} days.`, "success");
                setLoading(false);
                return;
            }

            // 4. Trigger Download
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archivedData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `portfolio_ARCHIVE_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            // 5. Commit Deletion Batch
            await batch.commit();
            trackDelete(deletionCount);

            showToast(`Successfully archived and deleted ${deletionCount} old records.`, "success");
            fetchDatabaseHealth(); // Refresh counts
            if (activeTab === 'audit') fetchAuditLogs();
            if (activeTab === 'messages') fetchMessages();

        } catch (error) {
            console.error("Error archiving data:", error);
            showToast("Failed to archive data. Check console.", "error");
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
                trackWrite(restorePromises.length);

                invalidateCache();
                showToast('Restore completed successfully!');

                if (activeTab === 'audit') fetchAuditLogs();
                if (activeTab === 'analytics') fetchAnalytics();
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
                trackRead(snap.size);
                if (snap.empty) {
                    await addDoc(collection(db, "users"), {
                        email: email,
                        role: 'pending',
                        isActive: true,
                        createdAt: serverTimestamp()
                    });
                    trackWrite(1);
                }
                showToast('Account created! You are now logged in.');
            } else {
                await signInWithEmailAndPassword(auth, email, password);

                // Verify the user is not disabled in Firestore
                const q = query(collection(db, "users"), where("email", "==", email));
                const snap = await getDocs(q);
                trackRead(snap.size);
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
                let currentIp = 'Unknown';
                let locData = { country: 'Unknown', city: 'Unknown' };
                try {
                    const ipRes = await fetch('https://ipapi.co/json/');
                    const ipData = await ipRes.json();
                    if (ipData.ip) currentIp = ipData.ip;
                    if (ipData.country_name) locData.country = ipData.country_name;
                    if (ipData.city) locData.city = ipData.city;
                } catch (e) {
                    try {
                        const fallbackRes = await fetch('https://api.ipify.org?format=json');
                        const fallbackData = await fallbackRes.json();
                        if (fallbackData.ip) currentIp = fallbackData.ip;
                    } catch (fallbackErr) { }
                }

                // Record the login event
                await addDoc(collection(db, "auditLogs"), {
                    email: email,
                    ipAddress: currentIp,
                    country: locData.country,
                    city: locData.city,
                    userAgent: navigator.userAgent,
                    deviceType: getDeviceType(),
                    sessionId: getSessionId(),
                    timestamp: serverTimestamp()
                });
                trackWrite(1);
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

            {/* Top Navigation Bar */}
            <div className={styles.topNavBar}>
                <div className={styles.topNavLeft}>
                    <button className={styles.menuToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <span /><span /><span />
                    </button>
                    <span className={styles.brand}>Admin<span>.</span></span>
                </div>

                <div className={styles.headerRight}>
                    <button onClick={() => navigate('/')} className={styles.viewSiteBtn}>
                        <ExternalLink size={16} />
                        <span className={styles.hideOnMobile}>View Live Site</span>
                    </button>

                    <div className={styles.topActions}>
                        <button onClick={toggleTheme} className={styles.topActionBtn} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {(userRole === 'superadmin' || (userRole && rolePermissions[userRole]?.includes('settings'))) && (
                            <button onClick={() => handleTabClick('settings')} className={`${styles.topActionBtn} ${activeTab === 'settings' ? styles.activeBarTab : ''}`} title="Settings">
                                {icons['settings']}
                            </button>
                        )}

                        <button onClick={() => handleTabClick('profile')} className={`${styles.topActionBtn} ${activeTab === 'profile' ? styles.activeBarTab : ''}`} title="My Profile">
                            {icons['profile']}
                        </button>

                        <button onClick={() => signOut(auth)} className={`${styles.topActionBtn} ${styles.logoutActionBtn}`} title="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>

                    <div className={styles.headerUserInfo}>
                        <div className={styles.headerAvatar}>{(userDisplayName || user.email)?.charAt(0).toUpperCase()}</div>
                        <div className={styles.headerUserText}>
                            <span className={styles.headerUserEmail} title={user.email}>{userDisplayName || user.email}</span>
                            <span className={styles.headerUserRole}>{userRole || 'Loading...'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backdrop */}
            {sidebarOpen && <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarClosed : ''} ${sidebarOpen ? styles.sidebarOpenMobile : ''}`}>
                <nav className={styles.sidebarNav}>
                    {Object.keys(tabLabels).filter(tab => {
                        if (userRole === 'superadmin') return true;

                        // Explicitly deny restricted tabs to non-superadmins
                        if (tab === 'users' || tab === 'database' || tab === 'audit') return false;

                        // Dynamically check permissions
                        if (userRole && rolePermissions[userRole]) {
                            return rolePermissions[userRole].includes(tab);
                        }

                        // Legacy fallback 
                        if (userRole === 'admin') return true;
                        if (userRole === 'editor') {
                            const editorAllowedTabs = ['home', 'about', 'experience', 'projects', 'blog', 'messages', 'contact'];
                            return editorAllowedTabs.includes(tab);
                        }
                        return false;
                    }).map(tab => (
                        <button key={tab} className={activeTab === tab ? styles.active : ''} onClick={() => handleTabClick(tab)}>
                            {icons[tab] || <FileText size={18} />}
                            <span>{tabLabels[tab]}</span>
                            {tab === 'messages' && unreadMessagesCount > 0 && (
                                <span className={styles.badge} style={{ background: 'linear-gradient(135deg, #6C63FF, #8B83FF)', color: '#fff', boxShadow: '0 2px 8px rgba(108, 99, 255, 0.4)' }}>{unreadMessagesCount}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className={`${styles.mainContent} ${!sidebarOpen ? styles.contentExpanded : ''}`}>
                <div className={styles.contentHeader}>
                    <div>
                        <h1>{tabLabels[activeTab] || (activeTab === 'profile' ? 'My Profile' : 'Settings')}</h1>
                        <p className={styles.headerSubtitle}>Manage your portfolio {activeTab}</p>
                    </div>
                </div>

                {/* ========== EXPERIENCE TAB ========== */}
                {activeTab === 'experience' && (
                    <>
                        {!showExperienceForm ? (
                            <div className={styles.listSection}>
                                <div className={styles.listSectionHeader}>
                                    <h3 className={styles.listTitle}>Existing Experience</h3>
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
                                        <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', alignItems: 'center' }}>
                                            <SortableHeader label="Role" field="role" sortField={expSort.field} sortDirection={expSort.dir} onSort={handleExpSort} />
                                            <SortableHeader label="Company" field="company" sortField={expSort.field} sortDirection={expSort.dir} onSort={handleExpSort} />
                                            <SortableHeader label="Period" field="period" sortField={expSort.field} sortDirection={expSort.dir} onSort={handleExpSort} />
                                        </div>
                                        {paginatedExperiences.map(exp => (
                                            <div key={exp.id} className={`${styles.listItem} ${exp.visible === false ? styles.hiddenItem : ''} ${styles.clickableRow}`} onClick={() => setViewingExperience(exp)} style={{ cursor: 'pointer' }}>
                                                <div className={styles.listItemInfo}>
                                                    <h4>{exp.role} {exp.visible === false && <span className={styles.hiddenBadge}>Hidden</span>}</h4>
                                                    <p className={styles.listMeta}>{exp.company} • <em>{exp.period}</em></p>
                                                </div>
                                                <div className={styles.listItemActions}>
                                                    <button className={`${styles.visibilityBtn} ${exp.visible === false ? styles.off : ''}`} onClick={(e) => { e.stopPropagation(); toggleVisibility('experience', exp.id, exp.visible !== false); }} title={exp.visible === false ? 'Show on homepage' : 'Hide from homepage'}>
                                                        {exp.visible === false ? (
                                                            <EyeOff size={16} />
                                                        ) : (
                                                            <Eye size={16} />
                                                        )}
                                                    </button>
                                                    <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); handleEditExperienceClick(exp); }} title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); handleDeleteExperience(exp.id); }} title="Delete">
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
                        {/* Experience Details Modal */}
                        {viewingExperience && (
                            <div className={styles.modalOverlay} onClick={() => setViewingExperience(null)}>
                                <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                                    <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                                        <h3>{icons.experience || '👔'} Experience Details</h3>
                                        <button onClick={() => setViewingExperience(null)} className={styles.closeBtn}><X size={20} /></button>
                                    </div>
                                    <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '75vh' }}>
                                        <div className={styles.detailGrid} style={{ marginBottom: '1.5rem' }}>
                                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Company</span><span className={styles.detailValue}>{viewingExperience.company}</span></div>
                                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Role</span><span className={styles.detailValue}>{viewingExperience.role}</span></div>
                                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Period</span><span className={styles.detailValue}>{viewingExperience.period}</span></div>
                                        </div>
                                        <div style={{ background: 'var(--input-bg)', padding: '1rem', borderRadius: '8px' }}>
                                            <MarkdownRenderer content={viewingExperience.description} />
                                        </div>
                                    </div>
                                    <div className={styles.modalFooter}>
                                        <button onClick={() => setViewingExperience(null)} className={styles.confirmBtn} style={{ background: 'var(--primary-color)', color: '#000' }}>Done</button>
                                    </div>
                                </div>
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
                                    <h3 className={styles.listTitle}>Existing Projects</h3>
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
                                        <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', alignItems: 'center' }}>
                                            <SortableHeader label="Title" field="title" sortField={projSort.field} sortDirection={projSort.dir} onSort={handleProjSort} />
                                            <SortableHeader label="Featured" field="featured" sortField={projSort.field} sortDirection={projSort.dir} onSort={handleProjSort} />
                                            <SortableHeader label="Visibility" field="visible" sortField={projSort.field} sortDirection={projSort.dir} onSort={handleProjSort} />
                                        </div>
                                        {paginatedProjects.map(p => (
                                            <div key={p.id} className={`${styles.listItem} ${p.visible === false ? styles.hiddenItem : ''} ${styles.clickableRow}`} onClick={() => setViewingProject(p)} style={{ cursor: 'pointer' }}>
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
                                                        <button onClick={(e) => { e.stopPropagation(); window.open(`#/projects/${p.slug}`, '_blank'); }} title="View Detail" className={styles.editBtn}>
                                                            <ExternalLink size={16} />
                                                        </button>
                                                    )}
                                                    {userRole !== 'editor' && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); toggleFeatured(p.id, p.featured); }} title={p.featured ? "Unfeature from Homepage" : "Feature on Homepage"} className={styles.editBtn}>
                                                                <Star size={16} fill={p.featured ? "currentColor" : "none"} style={{ color: p.featured ? '#FFD700' : 'inherit' }} />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); toggleVisibility('projects', p.id, p.visible !== false); }} title={p.visible !== false ? "Hide from Projects Page" : "Show on Projects Page"} className={styles.editBtn}>
                                                                {p.visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); handleEditClick(p); }} className={styles.editBtn} title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {userRole !== 'editor' && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className={styles.deleteBtn} title="Delete">
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
                        {/* Project Details Modal */}
                        {viewingProject && (
                            <div className={styles.modalOverlay} onClick={() => setViewingProject(null)}>
                                <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                                    <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                                        <h3>{icons.projects || '🗂️'} Project Details</h3>
                                        <button onClick={() => setViewingProject(null)} className={styles.closeBtn}><X size={20} /></button>
                                    </div>
                                    <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '75vh' }}>
                                        <div className={styles.detailGrid} style={{ marginBottom: '1.5rem' }}>
                                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Title</span><span className={styles.detailValue}>{viewingProject.title}</span></div>
                                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Excerpt</span><span className={styles.detailValue}>{viewingProject.description}</span></div>
                                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                                <span className={styles.detailLabel}>Tech Stack</span>
                                                <div className={styles.techTags} style={{ marginTop: '0.25rem' }}>
                                                    {(Array.isArray(viewingProject.techStack) ? viewingProject.techStack : []).map((t, i) => (
                                                        <span key={i} className={styles.techTag} style={{ background: 'rgba(255,255,255,0.1)' }}>{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className={styles.detailItem} style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center' }}>
                                                {viewingProject.liveUrl && <a href={viewingProject.liveUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ExternalLink size={14} /> Live Demo</a>}
                                                {viewingProject.githubUrl && <a href={viewingProject.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><LinkIcon size={14} /> GitHub</a>}
                                            </div>
                                        </div>
                                        <div style={{ background: 'var(--input-bg)', padding: '1rem', borderRadius: '8px' }}>
                                            <MarkdownRenderer content={viewingProject.content || '*No extended content...*'} />
                                        </div>
                                    </div>
                                    <div className={styles.modalFooter}>
                                        <button onClick={() => setViewingProject(null)} className={styles.confirmBtn} style={{ background: 'var(--primary-color)', color: '#000' }}>Done</button>
                                    </div>
                                </div>
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
                                    <h3 className={styles.listTitle}>Published Posts</h3>
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
                                        <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', alignItems: 'center' }}>
                                            <SortableHeader label="Title" field="title" sortField={postSort.field} sortDirection={postSort.dir} onSort={handlePostSort} />
                                            <SortableHeader label="Date" field="createdAt" sortField={postSort.field} sortDirection={postSort.dir} onSort={handlePostSort} />
                                            <SortableHeader label="Status" field="visible" sortField={postSort.field} sortDirection={postSort.dir} onSort={handlePostSort} />
                                            <SortableHeader label="Featured" field="featured" sortField={postSort.field} sortDirection={postSort.dir} onSort={handlePostSort} />
                                        </div>
                                        {paginatedPosts.map(post => (
                                            <div key={post.id} className={`${styles.listItem} ${styles.clickableRow}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '0.75rem', borderRadius: '12px', cursor: 'pointer' }} onClick={() => setViewingPost(post)}>
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
                                                    <button onClick={(e) => { e.stopPropagation(); window.open(`#/blog/${post.slug}`, '_blank'); }} title="View" className={styles.editBtn}>
                                                        <ExternalLink size={16} />
                                                    </button>
                                                    {userRole !== 'editor' && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); toggleFeaturedPost(post.id, post.featured); }} title={post.featured ? "Unfeature from Homepage" : "Feature on Homepage"} className={styles.editBtn}>
                                                                <Star size={16} fill={post.featured ? "currentColor" : "none"} style={{ color: post.featured ? '#FFD700' : 'inherit' }} />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); toggleVisibility('posts', post.id, post.visible); }} title={post.visible ? "Hide" : "Show"} className={styles.editBtn}>
                                                                {post.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); setPostForm(post); setShowPostForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Edit" className={styles.editBtn}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {userRole !== 'editor' && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }} className={styles.deleteBtn} title="Delete">
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
                        {/* Blog Details Modal */}
                        {viewingPost && (
                            <div className={styles.modalOverlay} onClick={() => setViewingPost(null)}>
                                <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                                    <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                                        <h3>{icons.blog || '📝'} Post Details</h3>
                                        <button onClick={() => setViewingPost(null)} className={styles.closeBtn}><X size={20} /></button>
                                    </div>
                                    <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '75vh' }}>
                                        <div className={styles.detailGrid} style={{ marginBottom: '1.5rem' }}>
                                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Title</span><span className={styles.detailValue}>{viewingPost.title}</span></div>
                                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Excerpt</span><span className={styles.detailValue}>{viewingPost.excerpt}</span></div>
                                            <div className={styles.detailItem}><span className={styles.detailLabel}>Status</span><span className={styles.detailValue}>{viewingPost.visible ? 'Published' : 'Draft'}</span></div>
                                            <div className={styles.detailItem}><span className={styles.detailLabel}>Date</span><span className={styles.detailValue}>{viewingPost.createdAt?.seconds ? new Date(viewingPost.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}</span></div>
                                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                                <span className={styles.detailLabel}>Tags</span>
                                                <div className={styles.techTags} style={{ marginTop: '0.25rem' }}>
                                                    {(Array.isArray(viewingPost.tags) ? viewingPost.tags : (viewingPost.tags ? viewingPost.tags.split(',') : [])).map((t, i) => t.trim() && (
                                                        <span key={i} className={styles.techTag} style={{ background: 'rgba(255,255,255,0.1)' }}>{t.trim()}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {viewingPost.coverImage && (
                                            <div style={{ marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden' }}>
                                                <img src={viewingPost.coverImage} alt="Cover" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        <div style={{ background: 'var(--input-bg)', padding: '1rem', borderRadius: '8px' }}>
                                            <MarkdownRenderer content={viewingPost.content || '*No content...*'} />
                                        </div>
                                    </div>
                                    <div className={styles.modalFooter}>
                                        <button onClick={() => setViewingPost(null)} className={styles.confirmBtn} style={{ background: 'var(--primary-color)', color: '#000' }}>Done</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========== HOME CONTENT TAB ========== */}
                {
                    activeTab === 'home' && (
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
                    )
                }

                {/* ========== ABOUT TAB ========== */}
                {
                    activeTab === 'about' && (
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
                    )
                }

                {/* ========== CONTACT TAB ========== */}
                {
                    activeTab === 'contact' && (
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
                    )
                }

                {/* ========== SETTINGS TAB ========== */}
                {
                    activeTab === 'settings' && (
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

                                {/* Navigation Preferences */}
                                <div className={styles.inputGroup}>
                                    <label>Navigation Preferences</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--input-border)', cursor: 'pointer' }} onClick={() => setSidebarPersistent(!sidebarPersistent)}>
                                        <input
                                            type="checkbox"
                                            checked={sidebarPersistent}
                                            onChange={(e) => {
                                                // Handled by div onClick to make the whole row clickable
                                            }}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Keep Sidebar Open on Select</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>If disabled, the sidebar will automatically collapse when you click a navigation item on large screens.</div>
                                        </div>
                                    </div>
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
                    )
                }

                {/* ========== MESSAGES TAB ========== */}
                {
                    activeTab === 'profile' && (
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
                    )
                }

                {/* ========== MESSAGES TAB ========== */}
                {
                    activeTab === 'messages' && (
                        <div className={styles.section} style={{ paddingBottom: '4rem' }}>
                            <div className={styles.listSection} style={{ marginTop: '0' }}>
                                <div className={styles.listSectionHeader}>
                                    <h3 className={styles.listTitle}>
                                        Inbox
                                        {unreadMessagesCount > 0 && (
                                            <span className={styles.count} style={{ background: 'linear-gradient(135deg, #6C63FF, #8B83FF)', color: '#fff', fontWeight: 'bold', marginLeft: '0.5rem', boxShadow: '0 2px 8px rgba(108, 99, 255, 0.4)' }}>
                                                {unreadMessagesCount} Unread
                                            </span>
                                        )}
                                    </h3>
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
                                                checked={paginatedMessages.length > 0 && paginatedMessages.every(msg => selectedMessages.includes(msg.id))}
                                                onChange={handleSelectAllMessages}
                                                style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                                                title="Select All on this page"
                                            />
                                            <SortableHeader label="Message Details" field="name" sortField={msgSort.field} sortDirection={msgSort.dir} onSort={handleMsgSort} />
                                            <SortableHeader label="Date" field="createdAt" sortField={msgSort.field} sortDirection={msgSort.dir} onSort={handleMsgSort} style={{ justifyContent: 'flex-end' }} />
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
                                                        background: isSelected ? 'rgba(100, 255, 218, 0.05)' : (isUnread ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.015)'),
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
                                                                {msg.isRead ? <MailOpen size={16} /> : <Mail size={16} />}
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
                    )
                }
                {/* ========== DATABASE TAB ========== */}
                {
                    activeTab === 'database' && (
                        <div className={styles.section} style={{ paddingBottom: '4rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                <div className={styles.cardHeader} style={{ marginBottom: 0, display: 'block' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                        <Database size={24} /> Database Management
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: 0 }}>
                                        Monitor Firebase health and manage your data backups.
                                    </p>
                                </div>
                                <button onClick={fetchDatabaseHealth} className={styles.iconBtn} title="Refresh Database Health" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                                    <RefreshCw size={18} className={dbHealth.loading ? styles.spin : ''} />
                                </button>
                            </div>

                            {/* Database Health Section */}
                            <div style={{ marginBottom: '2.5rem' }}>
                                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <BarChart2 size={18} /> Storage Health
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: 'auto' }}>
                                        {dbHealth.lastUpdated ? `Last checked: ${dbHealth.lastUpdated.toLocaleTimeString()}` : 'Counting...'}
                                    </span>
                                </h4>

                                {/* Capacity Progress Bar */}
                                {(() => {
                                    const totalDocs = (dbHealth.posts || 0) + (dbHealth.projects || 0) + (dbHealth.messages || 0) + (dbHealth.auditLogs || 0) + (dbHealth.users || 0);
                                    let capacityPercentage = (totalDocs / SOFT_DOC_LIMIT) * 100;
                                    if (capacityPercentage > 100) capacityPercentage = 100;

                                    let barColor = '#10b981'; // green
                                    if (capacityPercentage > 75) barColor = '#f59e0b'; // yellow
                                    if (capacityPercentage > 90) barColor = '#ef4444'; // red

                                    return (
                                        <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Free Tier Document Usage (50k Limit Estimate)</span>
                                                <span style={{ fontWeight: 'bold', color: barColor }}>{capacityPercentage.toFixed(2)}% ({totalDocs.toLocaleString()} Docs)</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${capacityPercentage}%`, height: '100%', background: barColor, transition: 'width 1s ease-out' }}></div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div className={styles.detailGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                                    <div className={styles.detailItem} style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                                        <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FileText size={14} /> Posts</span>
                                        <span className={styles.detailValue} style={{ fontSize: '1.25rem', color: '#38bdf8' }}>{dbHealth.loading ? '...' : dbHealth.posts}</span>
                                    </div>
                                    <div className={styles.detailItem} style={{ background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.1)' }}>
                                        <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Code size={14} /> Projects</span>
                                        <span className={styles.detailValue} style={{ fontSize: '1.25rem', color: '#a78bfa' }}>{dbHealth.loading ? '...' : dbHealth.projects}</span>
                                    </div>
                                    <div className={styles.detailItem} style={{ background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.1)' }}>
                                        <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> Messages</span>
                                        <span className={styles.detailValue} style={{ fontSize: '1.25rem', color: '#34d399' }}>{dbHealth.loading ? '...' : dbHealth.messages}</span>
                                    </div>
                                    <div className={styles.detailItem} style={{ background: 'rgba(251, 146, 60, 0.05)', border: '1px solid rgba(251, 146, 60, 0.1)' }}>
                                        <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Shield size={14} /> Audit Logs</span>
                                        <span className={styles.detailValue} style={{ fontSize: '1.25rem', color: '#fb923c' }}>{dbHealth.loading ? '...' : dbHealth.auditLogs}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Today's Estimated Activity Section */}
                            <div style={{ marginBottom: '2.5rem' }}>
                                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Activity size={18} /> Today's Estimated Activity
                                    <span
                                        title="This tracks estimated Firebase operations from this Admin Panel session only. Actual billing usage may differ slightly. Counters reset automatically at midnight."
                                        style={{ marginLeft: '0.25rem', cursor: 'help', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--border-color)', fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}
                                    >?</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setDailyUsage({ date: new Date().toDateString(), reads: 0, writes: 0, deletes: 0 })}
                                            title="Reset today's counters"
                                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s ease' }}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                        >
                                            <RefreshCw size={10} /> Reset
                                        </button>
                                    </span>
                                </h4>

                                <div className={styles.detailGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    {[
                                        { label: 'Reads', value: dailyUsage.reads, limit: 50000, color: '#38bdf8', bgTint: 'rgba(56, 189, 248, 0.06)', borderTint: 'rgba(56, 189, 248, 0.15)', icon: <Eye size={15} /> },
                                        { label: 'Writes', value: dailyUsage.writes, limit: 20000, color: '#a78bfa', bgTint: 'rgba(167, 139, 250, 0.06)', borderTint: 'rgba(167, 139, 250, 0.15)', icon: <Edit2 size={15} /> },
                                        { label: 'Deletes', value: dailyUsage.deletes, limit: 20000, color: '#fb923c', bgTint: 'rgba(251, 146, 60, 0.06)', borderTint: 'rgba(251, 146, 60, 0.15)', icon: <Trash2 size={15} /> }
                                    ].map(({ label, value, limit, color, bgTint, borderTint, icon }) => {
                                        let pct = (value / limit) * 100;
                                        if (pct > 100) pct = 100;
                                        let barColor = color;
                                        if (pct > 75) barColor = '#f59e0b';
                                        if (pct > 90) barColor = '#ef4444';

                                        return (
                                            <div key={label} className={styles.detailItem} style={{ background: bgTint, border: `1px solid ${borderTint}`, borderTop: `3px solid ${color}`, padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                        {icon} {label}
                                                    </span>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', background: 'var(--card-bg)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                                        {pct.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                                                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: barColor, lineHeight: 1 }}>
                                                        {value.toLocaleString()}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        / {limit.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${Math.max(pct, 1)}%`,
                                                        height: '100%',
                                                        background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)`,
                                                        borderRadius: '5px',
                                                        transition: 'width 0.8s ease-out',
                                                        boxShadow: `0 0 8px ${barColor}40`
                                                    }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>


                            <div className={styles.grid}>
                                <div className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <h4>Full Data Export</h4>
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                            Download a complete JSON backup of all your portfolio collections. Keep this safe on your local drive!
                                        </p>
                                        <button onClick={handleExportDatabase} disabled={loading} className={styles.submitBtn} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                            <Database size={16} /> {loading ? 'Processing...' : 'Download Full Backup'}
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <h4>Full Data Restore</h4>
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                            Upload a previously exported JSON backup file to overwrite and restore your entire database. <strong>Warning: This cannot be undone.</strong>
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

                                {/* Maintenance Actions */}
                                <div className={styles.card} style={{ gridColumn: '1 / -1', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)' }}>
                                    <div className={styles.cardHeader} style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fb923c' }}>
                                            <Trash2 size={16} /> Archive & Purge Old Data
                                        </h4>
                                    </div>
                                    <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '300px' }}>
                                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                                Prevent your Firebase Free Tier from filling up. This tool downloads old <strong>Messages</strong>, <strong>Audit Logs</strong>, and <strong>Analytics</strong> as a JSON file, and then <strong>permanently deletes them</strong> from Firestore.
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                                <label style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>Delete records older than:</label>
                                                <select
                                                    value={archiveDays}
                                                    onChange={(e) => setArchiveDays(Number(e.target.value))}
                                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                                >
                                                    <option value={7}>7 Days (1 Week)</option>
                                                    <option value={14}>14 Days (2 Weeks)</option>
                                                    <option value={30}>30 Days (1 Month)</option>
                                                    <option value={90}>90 Days (3 Months)</option>
                                                    <option value={180}>180 Days (6 Months)</option>
                                                    <option value={365}>365 Days (1 Year)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowArchiveConfirm(true)}
                                            disabled={loading}
                                            className={styles.deleteBtn}
                                            style={{
                                                padding: '0.8rem 1.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                whiteSpace: 'nowrap',
                                                color: '#ef4444',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                            }}
                                        >
                                            <Trash2 size={16} /> {loading ? 'Archiving...' : `Archive & Delete (>${archiveDays} Days)`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* ========== CUSTOM ARCHIVE CONFIRMATION MODAL ========== */}
                {showArchiveConfirm && (
                    <div className={styles.modalOverlay} onClick={() => setShowArchiveConfirm(false)} style={{ zIndex: 1100 }}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: 0 }}>
                            <div className={styles.modalHeader} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem', background: 'rgba(239, 68, 68, 0.05)' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', margin: 0 }}>
                                    <Trash2 size={20} /> Confirm Permanent Archive
                                </h3>
                                <button onClick={() => setShowArchiveConfirm(false)} className={styles.closeBtn}><X size={20} /></button>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                                    You are about to permanently delete all <strong>Messages</strong>, <strong>Audit Logs</strong>, and <strong>Analytics</strong> older than {archiveDays} days from your active Firebase database.
                                </p>
                                <div style={{ background: 'var(--card-bg)', pading: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.5rem', padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                        <Database size={16} style={{ color: '#38bdf8' }} /> <strong>Step 1:</strong> Download full JSON Backup
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                        <Trash2 size={16} style={{ color: '#ef4444' }} /> <strong>Step 2:</strong> Permanently Delete from Database
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
                                    Are you absolutely sure you wish to proceed?
                                </p>
                            </div>
                            <div className={styles.modalFooter} style={{ padding: '1.25rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button onClick={() => setShowArchiveConfirm(false)} className={styles.cancelBtn} style={{ padding: '0.6rem 1.25rem' }}>Cancel</button>
                                <button onClick={() => handleArchiveData(archiveDays)} className={styles.deleteBtn} style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Trash2 size={16} /> Confirm & Archive
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== USERS TAB ========== */}
                {
                    activeTab === 'users' && (
                        <div className={styles.section} style={{ paddingBottom: '4rem' }}>
                            <div className={styles.listSection} style={{ marginTop: '0' }}>
                                <div className={styles.listSectionHeader}>
                                    <h3 className={styles.listTitle}>User Management</h3>
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

                                        {/* Add User Button */}                                        {filteredUsers.length === 0 ? (
                                            <div className={styles.emptyState}>{searchUsers ? 'No matching users found.' : 'No users registered yet.'}</div>
                                        ) : (
                                            <>
                                                <div className={styles.userGridHeader}>
                                                    <SortableHeader label="User" field="email" sortField={usersSort.field} sortDirection={usersSort.dir} onSort={handleUsersSort} />
                                                    <SortableHeader label="Role" field="role" sortField={usersSort.field} sortDirection={usersSort.dir} onSort={handleUsersSort} />
                                                    <SortableHeader label="Registered" field="createdAt" sortField={usersSort.field} sortDirection={usersSort.dir} onSort={handleUsersSort} />
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
                                                        <div
                                                            key={u.id}
                                                            className={`${styles.userCard} ${styles.userGridRowHover}`}
                                                            style={{
                                                                opacity: isUserDisabled ? 0.6 : 1,
                                                                filter: isUserDisabled ? 'grayscale(100%)' : 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={(e) => {
                                                                if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT' && !e.target.closest('button') && !e.target.closest('select')) {
                                                                    setViewingUser(u);
                                                                }
                                                            }}
                                                        >
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
                                                                ) : (
                                                                    <span className={`${styles.roleBadge} ${roleBadgeClass}`}>
                                                                        {roleLabels[u.role] || u.role}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className={styles.userMeta}>
                                                                {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                                                            </div>
                                                            <div className={styles.userActions} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                {u.email === user.email ? (
                                                                    <span className={styles.youBadge} style={{ margin: 'auto 0 auto auto' }}>✓ You</span>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            title="Edit Profile"
                                                                            className={styles.editBtn}
                                                                            onClick={(e) => { e.stopPropagation(); setViewingUser(u); }}
                                                                        >
                                                                            <Edit size={16} />
                                                                        </button>
                                                                        <button
                                                                            title="Send Password Reset"
                                                                            className={styles.editBtn}
                                                                            onClick={(e) => { e.stopPropagation(); handleResetPassword(u.email); }}
                                                                        >
                                                                            <Key size={16} />
                                                                        </button>
                                                                        <button
                                                                            title="Remove User"
                                                                            className={styles.deleteBtn}
                                                                            disabled={userRole !== 'superadmin' || u.role === 'superadmin'}
                                                                            onClick={(e) => { e.stopPropagation(); handleRemoveUser(u.email, u.id); }}
                                                                            style={{ opacity: (userRole !== 'superadmin' || u.role === 'superadmin') ? 0.3 : 1, cursor: (userRole !== 'superadmin' || u.role === 'superadmin') ? 'not-allowed' : 'pointer' }}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </>
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
                    )
                }

                {/* ========== AUDIT LOGS TAB ========== */}
                {
                    activeTab === 'audit' && (
                        <div className={styles.section} style={{ paddingBottom: '4rem' }}>
                            <div className={styles.listSection} style={{ marginTop: '0' }}>
                                <div className={styles.listSectionHeader}>
                                    <h3 className={styles.listTitle}>Login Audit Trail</h3>
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
                                                    <SortableHeader label="User Email" field="email" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                                    <SortableHeader label="IP Address" field="ipAddress" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                                    <SortableHeader label="User Agent" field="userAgent" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                                    <SortableHeader label="Timestamp" field="timestamp" sortField={auditSort.field} sortDirection={auditSort.dir} onSort={handleAuditSort} />
                                                </div>
                                                {paginatedAuditLogs.map(log => (
                                                    <div key={log.id} onClick={() => setSelectedAuditLog(log)} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 1.5fr', gap: '1rem', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '0.85rem', alignItems: 'center', transition: 'background 0.2s ease', cursor: 'pointer' }} className={styles.userGridRowHover}>
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

                            {/* Audit Details Modal */}
                            {selectedAuditLog && (
                                <div className={styles.modalOverlay} onClick={() => setSelectedAuditLog(null)} style={{ zIndex: 1100 }}>
                                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: 0, animation: 'modalFadeIn 0.25s ease forwards' }}>
                                        <div className={styles.modalHeader} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem', background: 'rgba(100, 255, 218, 0.03)' }}>
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color, #64ffda)', margin: 0 }}>
                                                <Shield size={20} /> Audit Log Details
                                            </h3>
                                            <button onClick={() => setSelectedAuditLog(null)} className={styles.closeBtn}><X size={20} /></button>
                                        </div>
                                        <div style={{ padding: '1.5rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                                                {[
                                                    { label: 'User Email', value: selectedAuditLog.email, icon: <Mail size={14} />, color: '#38bdf8', span: false },
                                                    { label: 'IP Address', value: selectedAuditLog.ipAddress, icon: <Globe size={14} />, color: '#a78bfa', span: false },
                                                    { label: 'Device', value: selectedAuditLog.deviceType || 'Unknown', icon: <Monitor size={14} />, color: '#fb923c', span: false },
                                                    { label: 'Country', value: selectedAuditLog.country || 'Unknown', icon: <Globe size={14} />, color: '#34d399', span: false },
                                                    { label: 'City', value: selectedAuditLog.city || 'Unknown', icon: <MapPin size={14} />, color: '#f472b6', span: false },
                                                    { label: 'Session ID', value: selectedAuditLog.sessionId || 'Unknown', icon: <Key size={14} />, color: '#fbbf24', span: false },
                                                    { label: 'Timestamp', value: selectedAuditLog.timestamp?.seconds ? new Date(selectedAuditLog.timestamp.seconds * 1000).toLocaleString() : 'Unknown', icon: <Clock size={14} />, color: '#64ffda', span: true },
                                                    { label: 'User Agent', value: selectedAuditLog.userAgent || 'Unknown', icon: <Monitor size={14} />, color: '#94a3b8', span: true },
                                                ].map((item, idx) => (
                                                    <div key={idx} style={{
                                                        gridColumn: item.span ? 'span 2' : 'auto',
                                                        background: 'var(--card-bg, rgba(255,255,255,0.02))',
                                                        border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
                                                        borderRadius: '10px',
                                                        padding: '0.85rem 1rem',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.35rem',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.color}40`; e.currentTarget.style.background = `${item.color}08`; }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color, rgba(255,255,255,0.06))'; e.currentTarget.style.background = 'var(--card-bg, rgba(255,255,255,0.02))'; }}
                                                    >
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: item.color, fontWeight: 600 }}>
                                                            {item.icon} {item.label}
                                                        </span>
                                                        <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-word', lineHeight: 1.5 }}>
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.modalFooter} style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button onClick={() => setSelectedAuditLog(null)} className={styles.cancelBtn} style={{ padding: '0.5rem 1.25rem' }}>Close</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* ========== ANALYTICS TAB ========== */}
                {
                    activeTab === 'analytics' && (
                        <div className={styles.section} style={{ paddingBottom: '4rem' }}>
                            {analyticsLoading ? (
                                <div className={styles.analyticsLoading}>
                                    <div className={styles.analyticsSpinner} />
                                    <span>Loading analytics data…</span>
                                </div>
                            ) : (
                                <>
                                    {/* ---- Date Range Filter ---- */}
                                    <div className={styles.dateFilterBar}>
                                        <div className={styles.datePresets}>
                                            {[{ label: '7D', value: '7d' }, { label: '30D', value: '30d' }, { label: '90D', value: '90d' }, { label: 'All', value: 'all' }].map(p => (
                                                <button key={p.value} className={`${styles.presetBtn} ${analyticsRange.preset === p.value ? styles.presetActive : ''}`} onClick={() => handleAnalyticsPreset(p.value)}>{p.label}</button>
                                            ))}
                                        </div>
                                        <div className={styles.dateInputs}>
                                            <Calendar size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                            <input type="date" value={analyticsRange.start} onChange={(e) => setAnalyticsRange(prev => ({ ...prev, start: e.target.value, preset: '' }))} className={styles.dateInput} />
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>to</span>
                                            <input type="date" value={analyticsRange.end} onChange={(e) => setAnalyticsRange(prev => ({ ...prev, end: e.target.value, preset: '' }))} className={styles.dateInput} />
                                        </div>
                                    </div>

                                    {/* ---- Stat Summary Cards ---- */}
                                    <div className={styles.analyticsGrid}>
                                        <div className={styles.statCard}>
                                            <div className={styles.statIcon}><EyeIcon size={20} /></div>
                                            <div className={styles.statValue}>{summaryStats.total.toLocaleString()}</div>
                                            <div className={styles.statLabel}>Total Page Views</div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <div className={styles.statIcon}><Users size={20} /></div>
                                            <div className={styles.statValue}>{summaryStats.unique.toLocaleString()}</div>
                                            <div className={styles.statLabel}>Unique Visitors</div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <div className={styles.statIcon}><Globe size={20} /></div>
                                            <div className={styles.statValue} style={{ fontSize: '1.3rem' }}>{summaryStats.topCountry}</div>
                                            <div className={styles.statLabel}>Top Country</div>
                                        </div>
                                        <div className={styles.statCard}>
                                            <div className={styles.statIcon}><TrendingUp size={20} /></div>
                                            <div className={styles.statValue} style={{ fontSize: '1.3rem' }}>{summaryStats.topPage}</div>
                                            <div className={styles.statLabel}>Most Visited Page</div>
                                        </div>
                                    </div>

                                    {/* ---- Visits Over Time (Line Chart) ---- */}
                                    <div className={styles.chartCard}>
                                        <div className={styles.chartTitle}>
                                            <TrendingUp size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                                            Visits Over Time {analyticsRange.preset === '7d' ? '(Last 7 Days)' : analyticsRange.preset === '30d' ? '(Last 30 Days)' : analyticsRange.preset === '90d' ? '(Last 90 Days)' : analyticsRange.preset === 'all' ? '(All Time)' : `(${analyticsRange.start} — ${analyticsRange.end})`}
                                            <button className={styles.detailBtn} onClick={() => setAnalyticsDetail('visits')} style={{ marginLeft: 'auto' }}>View Details</button>
                                            <button className={styles.analyticsRefreshBtn} onClick={fetchAnalytics} disabled={analyticsLoading}>
                                                <RefreshCw size={14} /> Refresh
                                            </button>
                                        </div>
                                        {dailyVisits.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={320}>
                                                <LineChart data={dailyVisits} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                                    <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(v) => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }} />
                                                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                                                    <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} />
                                                    <Line type="monotone" dataKey="visits" stroke="#64ffda" strokeWidth={2} dot={false} name="Page Views" />
                                                    <Line type="monotone" dataKey="unique" stroke="#7c4dff" strokeWidth={2} dot={false} name="Unique Visitors" />
                                                    <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className={styles.emptyState}><p>No visit data available yet.</p></div>
                                        )}
                                    </div>

                                    {/* ---- Country Breakdown + Device Breakdown ---- */}
                                    <div className={styles.chartRow}>
                                        <div className={styles.chartCard}>
                                            <div className={styles.chartTitle}>
                                                <Globe size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                                                Visitors by Country
                                                <button className={styles.detailBtn} onClick={() => setAnalyticsDetail('countries')} style={{ marginLeft: 'auto' }}>View Details</button>
                                            </div>
                                            {countryData.length > 0 ? (
                                                <>
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <PieChart>
                                                            <Pie data={countryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                                                                {countryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <ul className={styles.legendList}>
                                                        {countryData.map((entry, i) => (
                                                            <li key={entry.name} className={styles.legendItem}>
                                                                <span className={styles.legendDot} style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                                {entry.name} ({entry.value})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </>
                                            ) : (
                                                <div className={styles.emptyState}><p>No country data.</p></div>
                                            )}
                                        </div>

                                        <div className={styles.chartCard}>
                                            <div className={styles.chartTitle}>
                                                <Monitor size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                                                Device Breakdown
                                                <button className={styles.detailBtn} onClick={() => setAnalyticsDetail('devices')} style={{ marginLeft: 'auto' }}>View Details</button>
                                            </div>
                                            {deviceData.length > 0 ? (
                                                <>
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <PieChart>
                                                            <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                                                                {deviceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <ul className={styles.legendList}>
                                                        {deviceData.map((entry, i) => (
                                                            <li key={entry.name} className={styles.legendItem}>
                                                                <span className={styles.legendDot} style={{ background: CHART_COLORS[(i + 3) % CHART_COLORS.length] }} />
                                                                {entry.name === 'Desktop' ? <><Monitor size={12} /> </> : entry.name === 'Mobile' ? <><Smartphone size={12} /> </> : entry.name === 'Tablet' ? <><Tablet size={12} /> </> : null}
                                                                {entry.name} ({entry.value})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </>
                                            ) : (
                                                <div className={styles.emptyState}><p>No device data.</p></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ---- City Breakdown + Traffic Sources ---- */}
                                    <div className={styles.chartRow}>
                                        <div className={styles.chartCard}>
                                            <div className={styles.chartTitle}>
                                                <MapPin size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                                                Top Cities
                                                <button className={styles.detailBtn} onClick={() => setAnalyticsDetail('cities')} style={{ marginLeft: 'auto' }}>View Details</button>
                                            </div>
                                            {cityData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <BarChart data={cityData.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                                                        <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                                                        <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={140} />
                                                        <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                                        <Bar dataKey="value" name="Visits" radius={[0, 6, 6, 0]}>
                                                            {cityData.slice(0, 6).map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className={styles.emptyState}><p>No city data.</p></div>
                                            )}
                                        </div>

                                        <div className={styles.chartCard}>
                                            <div className={styles.chartTitle}>
                                                <Share2 size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                                                Traffic Sources
                                                <button className={styles.detailBtn} onClick={() => setAnalyticsDetail('referrers')} style={{ marginLeft: 'auto' }}>View Details</button>
                                            </div>
                                            {referrerData.length > 0 ? (
                                                <>
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <PieChart>
                                                            <Pie data={referrerData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                                                                {referrerData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 5) % CHART_COLORS.length]} />)}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <ul className={styles.legendList}>
                                                        {referrerData.map((entry, i) => (
                                                            <li key={entry.name} className={styles.legendItem}>
                                                                <span className={styles.legendDot} style={{ background: CHART_COLORS[(i + 5) % CHART_COLORS.length] }} />
                                                                {entry.name} ({entry.value})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </>
                                            ) : (
                                                <div className={styles.emptyState}><p>No referrer data.</p></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ---- Top Pages (Bar Chart) ---- */}
                                    <div className={styles.chartCard}>
                                        <div className={styles.chartTitle}>
                                            <FileText size={18} style={{ color: 'var(--primary-color, #64ffda)' }} />
                                            Top Visited Pages
                                            <button className={styles.detailBtn} onClick={() => setAnalyticsDetail('pages')} style={{ marginLeft: 'auto' }}>View Details</button>
                                        </div>
                                        {topPages.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={Math.max(200, topPages.length * 40)}>
                                                <BarChart data={topPages} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                                                    <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                                                    <YAxis dataKey="path" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={120} />
                                                    <Tooltip contentStyle={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                                    <Bar dataKey="count" name="Page Views" radius={[0, 6, 6, 0]}>
                                                        {topPages.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className={styles.emptyState}><p>No page data.</p></div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                }
            </main >

            {/* ========== ANALYTICS DETAIL MODAL ========== */}
            {
                analyticsDetail && (
                    <div className={styles.modalBackdrop} onClick={() => setAnalyticsDetail(null)}>
                        <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.detailModalHeader}>
                                <h3>
                                    {analyticsDetail === 'visits' && <><TrendingUp size={20} /> All Visits Log ({visits.length})</>}
                                    {analyticsDetail === 'countries' && <><Globe size={20} /> Visitors by Country</>}
                                    {analyticsDetail === 'devices' && <><Monitor size={20} /> Device Breakdown</>}
                                    {analyticsDetail === 'pages' && <><FileText size={20} /> All Visited Pages</>}
                                    {analyticsDetail === 'cities' && <><MapPin size={20} /> Visitors by City</>}
                                    {analyticsDetail === 'referrers' && <><Share2 size={20} /> Traffic Sources</>}
                                </h3>
                                <button onClick={() => setAnalyticsDetail(null)} className={styles.detailCloseBtn}><X size={20} /></button>
                            </div>
                            <div className={styles.detailModalBody}>
                                {analyticsDetail === 'visits' && (
                                    <table className={styles.detailTable}>
                                        <thead>
                                            <tr><th>#</th><th>Page</th><th>Country</th><th>City</th><th>Device</th><th>Browser</th><th>IP</th><th>Referrer</th><th>Session</th><th>Date & Time</th></tr>
                                        </thead>
                                        <tbody>
                                            {visits.length > 0 ? visits.map((v, i) => (
                                                <tr key={v.id || i}>
                                                    <td>{i + 1}</td>
                                                    <td>{v.path || '/'}</td>
                                                    <td>{v.countryCode ? <span title={v.country}>{v.countryCode}</span> : (v.country || 'Unknown')}</td>
                                                    <td>{v.city || '-'}</td>
                                                    <td style={{ textTransform: 'capitalize' }}>{v.device || '-'}</td>
                                                    <td>{parseBrowser(v.userAgent)}</td>
                                                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{v.ip || '-'}</td>
                                                    <td style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.referrer}>{v.referrer || '-'}</td>
                                                    <td style={{ fontSize: '0.7rem', fontFamily: 'monospace', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={v.sessionId}>{v.sessionId ? v.sessionId.slice(0, 8) + '…' : '-'}</td>
                                                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toLocaleString() : v.date || '-'}</td>
                                                </tr>
                                            )) : <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No visit data.</td></tr>}
                                        </tbody>
                                    </table>
                                )}
                                {analyticsDetail === 'countries' && (
                                    <table className={styles.detailTable}>
                                        <thead>
                                            <tr><th>#</th><th>Country</th><th>Visits</th><th>% Share</th></tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const allCountries = {};
                                                visits.forEach(v => { const c = v.country || 'Unknown'; allCountries[c] = (allCountries[c] || 0) + 1; });
                                                const sorted = Object.entries(allCountries).sort((a, b) => b[1] - a[1]);
                                                const total = visits.length || 1;
                                                return sorted.length > 0 ? sorted.map(([name, count], i) => (
                                                    <tr key={name}>
                                                        <td>{i + 1}</td>
                                                        <td>{name}</td>
                                                        <td>{count}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--input-bg)' }}>
                                                                    <div style={{ width: `${(count / total * 100).toFixed(0)}%`, height: '100%', borderRadius: '3px', background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.78rem', minWidth: '40px' }}>{(count / total * 100).toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No country data.</td></tr>;
                                            })()}
                                        </tbody>
                                    </table>
                                )}
                                {analyticsDetail === 'devices' && (
                                    <table className={styles.detailTable}>
                                        <thead>
                                            <tr><th>#</th><th>Device</th><th>Visits</th><th>% Share</th></tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const allDevices = {};
                                                visits.forEach(v => { const d = v.device || 'unknown'; const label = d.charAt(0).toUpperCase() + d.slice(1); allDevices[label] = (allDevices[label] || 0) + 1; });
                                                const sorted = Object.entries(allDevices).sort((a, b) => b[1] - a[1]);
                                                const total = visits.length || 1;
                                                return sorted.length > 0 ? sorted.map(([name, count], i) => (
                                                    <tr key={name}>
                                                        <td>{i + 1}</td>
                                                        <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {name === 'Desktop' ? <Monitor size={14} /> : name === 'Mobile' ? <Smartphone size={14} /> : name === 'Tablet' ? <Tablet size={14} /> : null}
                                                            {name}
                                                        </td>
                                                        <td>{count}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--input-bg)' }}>
                                                                    <div style={{ width: `${(count / total * 100).toFixed(0)}%`, height: '100%', borderRadius: '3px', background: CHART_COLORS[(i + 3) % CHART_COLORS.length] }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.78rem', minWidth: '40px' }}>{(count / total * 100).toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No device data.</td></tr>;
                                            })()}
                                        </tbody>
                                    </table>
                                )}
                                {analyticsDetail === 'pages' && (
                                    <table className={styles.detailTable}>
                                        <thead>
                                            <tr><th>#</th><th>Page Path</th><th>Views</th><th>% Share</th></tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const allPages = {};
                                                visits.forEach(v => { const p = v.path || '/'; allPages[p] = (allPages[p] || 0) + 1; });
                                                const sorted = Object.entries(allPages).sort((a, b) => b[1] - a[1]);
                                                const total = visits.length || 1;
                                                return sorted.length > 0 ? sorted.map(([path, count], i) => (
                                                    <tr key={path}>
                                                        <td>{i + 1}</td>
                                                        <td>{path === '/' ? '/ (Home)' : path}</td>
                                                        <td>{count}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--input-bg)' }}>
                                                                    <div style={{ width: `${(count / total * 100).toFixed(0)}%`, height: '100%', borderRadius: '3px', background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.78rem', minWidth: '40px' }}>{(count / total * 100).toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No page data.</td></tr>;
                                            })()}
                                        </tbody>
                                    </table>
                                )}
                                {analyticsDetail === 'cities' && (
                                    <table className={styles.detailTable}>
                                        <thead>
                                            <tr><th>#</th><th>City</th><th>Visits</th><th>% Share</th></tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const allCities = {};
                                                visits.forEach(v => {
                                                    const city = v.city || 'Unknown';
                                                    const country = v.country || '';
                                                    const key = `${city}${country ? ', ' + country : ''}`;
                                                    allCities[key] = (allCities[key] || 0) + 1;
                                                });
                                                const sorted = Object.entries(allCities).sort((a, b) => b[1] - a[1]);
                                                const total = visits.length || 1;
                                                return sorted.length > 0 ? sorted.map(([name, count], i) => (
                                                    <tr key={name}>
                                                        <td>{i + 1}</td>
                                                        <td><MapPin size={12} style={{ marginRight: '0.4rem', verticalAlign: 'middle', color: 'var(--text-secondary)' }} />{name}</td>
                                                        <td>{count}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--input-bg)' }}>
                                                                    <div style={{ width: `${(count / total * 100).toFixed(0)}%`, height: '100%', borderRadius: '3px', background: CHART_COLORS[(i + 2) % CHART_COLORS.length] }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.78rem', minWidth: '40px' }}>{(count / total * 100).toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No city data.</td></tr>;
                                            })()}
                                        </tbody>
                                    </table>
                                )}
                                {analyticsDetail === 'referrers' && (
                                    <table className={styles.detailTable}>
                                        <thead>
                                            <tr><th>#</th><th>Source</th><th>Visits</th><th>% Share</th></tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const allRefs = {};
                                                visits.forEach(v => { const r = v.referrer || 'Direct'; allRefs[r] = (allRefs[r] || 0) + 1; });
                                                const sorted = Object.entries(allRefs).sort((a, b) => b[1] - a[1]);
                                                const total = visits.length || 1;
                                                return sorted.length > 0 ? sorted.map(([name, count], i) => (
                                                    <tr key={name}>
                                                        <td>{i + 1}</td>
                                                        <td><Share2 size={12} style={{ marginRight: '0.4rem', verticalAlign: 'middle', color: 'var(--text-secondary)' }} />{name}</td>
                                                        <td>{count}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--input-bg)' }}>
                                                                    <div style={{ width: `${(count / total * 100).toFixed(0)}%`, height: '100%', borderRadius: '3px', background: CHART_COLORS[(i + 5) % CHART_COLORS.length] }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.78rem', minWidth: '40px' }}>{(count / total * 100).toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No referrer data.</td></tr>;
                                            })()}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ========== CUSTOM CONFIRMATION MODAL ========== */}
            {
                confirmDialog.isOpen && (
                    <div className={styles.modalBackdrop}>
                        <div className={styles.confirmModal}>
                            <div className={`${styles.modalHeader} ${styles[confirmDialog.type]}`}>
                                <h3>{confirmDialog.title}</h3>
                            </div>
                            <div className={styles.modalContent}>
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
                )
            }

            {/* ========== ADD USER MODAL ========== */}
            {
                showAddUserForm && (
                    <div className={styles.modalOverlay} onClick={() => setShowAddUserForm(false)} style={{ zIndex: 1100 }}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: 0 }}>
                            <div className={styles.modalHeader} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', margin: 0 }}>
                                    <UserPlus size={20} /> Create New User
                                </h3>
                                <button onClick={() => setShowAddUserForm(false)} className={styles.closeBtn}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleAddUser}>
                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>Email Address</label>
                                        <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required placeholder="user@example.com" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Temporary Password</label>
                                        <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Initial Role</label>
                                        <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--input-border)' }}>
                                            <option value="pending">Pending</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.modalFooter} style={{ padding: '1.25rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button type="button" onClick={() => setShowAddUserForm(false)} className={styles.cancelBtn} style={{ padding: '0.6rem 1.25rem' }}>Cancel</button>
                                    <button type="submit" className={styles.primaryBtn} disabled={loading} style={{ margin: 0, padding: '0.6rem 1.25rem' }}>
                                        {loading ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* ========== CONFIRM DIALOG MODAL ========== */}
            {
                confirmDialog.isOpen && (
                    <div className={styles.modalOverlay} onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} style={{ zIndex: 1200 }}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: 0 }}>
                            <div className={styles.modalHeader} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem', background: confirmDialog.type === 'danger' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(251, 146, 60, 0.05)' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: confirmDialog.type === 'danger' ? '#ef4444' : '#f97316', margin: 0 }}>
                                    {confirmDialog.type === 'danger' ? <Trash2 size={20} /> : <Key size={20} />} {confirmDialog.title}
                                </h3>
                                <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className={styles.closeBtn}><X size={20} /></button>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {confirmDialog.message}
                                </p>
                            </div>
                            <div className={styles.modalFooter} style={{ padding: '1.25rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className={styles.cancelBtn} style={{ padding: '0.6rem 1.25rem' }}>Cancel</button>
                                <button onClick={confirmDialog.onConfirm} className={confirmDialog.type === 'danger' ? styles.deleteBtn : styles.primaryBtn} style={{ padding: '0.6rem 1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {loading ? 'Processing...' : confirmDialog.confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* ========== MESSAGE VIEW MODAL ========== */}
            {
                viewingMessage && (
                    <div className={styles.modalOverlay} onClick={() => setViewingMessage(null)} style={{ zIndex: 1200 }}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: 0 }}>
                            <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                                <h3>
                                    <Mail size={20} style={{ color: 'var(--primary-color)' }} />
                                    Message Details
                                </h3>
                                <button onClick={() => setViewingMessage(null)} className={styles.closeBtn}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '60vh' }}>
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                        <span className={styles.detailLabel}>From</span>
                                        <span className={styles.detailValue}>
                                            <span style={{ fontWeight: 'bold' }}>{viewingMessage.name}</span><br />
                                            <a href={`mailto:${viewingMessage.email}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', display: 'inline-block', marginTop: '0.2rem' }}>{viewingMessage.email}</a>
                                        </span>
                                    </div>
                                    <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                        <span className={styles.detailLabel}>Date</span>
                                        <span className={styles.detailValue}>
                                            {viewingMessage.createdAt?.seconds ? new Date(viewingMessage.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                        <span className={styles.detailLabel}>Message</span>
                                        <p className={styles.detailValue} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: 0, padding: '1rem', background: 'var(--input-bg)', borderRadius: '8px' }}>
                                            {viewingMessage.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.modalFooter} style={{ justifyContent: 'space-between', marginTop: 'auto' }}>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => { handleDeleteMessage(viewingMessage.id); setViewingMessage(null); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <a
                                        href={`mailto:${viewingMessage.email}?subject=Re: Inquiry from ${encodeURIComponent(viewingMessage.name)}`}
                                        className={styles.submitBtn}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', background: 'transparent', border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', color: 'var(--text-primary)', padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg> Reply
                                    </a>
                                    <button
                                        className={styles.editBtn}
                                        onClick={() => { handleToggleMessageRead(viewingMessage.id, viewingMessage.isRead); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
                                    >
                                        {viewingMessage.isRead ? <><MailOpen size={16} /> Mark Unread</> : <><Mail size={16} /> Mark Read</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* ========== USER VIEW MODAL ========== */}
            {
                viewingUser && (
                    <div className={styles.modalOverlay} onClick={() => setViewingUser(null)} style={{ zIndex: 1200 }}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: 0 }}>
                            <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                                <h3>
                                    <Users size={20} style={{ color: 'var(--primary-color)' }} />
                                    User Details
                                </h3>
                                <button onClick={() => setViewingUser(null)} className={styles.closeBtn}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '60vh' }}>
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                        <span className={styles.detailLabel}>Email Address</span>
                                        <span className={styles.detailValue} style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                            {viewingUser.email}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                        <span className={styles.detailLabel}>Display Name</span>
                                        <span className={styles.detailValue}>
                                            {viewingUser.displayName || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not provided</span>}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Account Role</span>
                                        {viewingUser.email === user.email ? (
                                            <span className={styles.detailValue} style={{ textTransform: 'capitalize', color: viewingUser.role === 'superadmin' ? '#10b981' : (viewingUser.role === 'admin' ? '#8b5cf6' : (viewingUser.role === 'editor' ? '#f59e0b' : 'var(--text-primary)')) }}>
                                                {viewingUser.role} (You)
                                            </span>
                                        ) : (
                                            <div className={styles.roleSelectWrapper} style={{ marginTop: '0.4rem' }}>
                                                <select
                                                    className={styles.roleSelect}
                                                    style={{ width: '100%', padding: '0.6rem', background: 'rgba(255,255,255,0.03)' }}
                                                    value={viewingUser.role}
                                                    onChange={(e) => {
                                                        const newRole = e.target.value;
                                                        handleRoleChange(viewingUser.id, newRole);
                                                        setViewingUser({ ...viewingUser, role: newRole });
                                                    }}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="editor">Editor</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="superadmin">Super Admin</option>
                                                </select>
                                                <ChevronDown size={14} className={styles.roleSelectIcon} style={{ right: '12px' }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Status</span>
                                        <span className={styles.detailValue}>
                                            {viewingUser.isActive === false ? <span style={{ color: '#ef4444' }}>Disabled</span> : <span style={{ color: '#10b981' }}>Active</span>}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                        <span className={styles.detailLabel}>Registration Date</span>
                                        <span className={styles.detailValue}>
                                            {viewingUser.createdAt?.seconds ? new Date(viewingUser.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                        <span className={styles.detailLabel}>User ID</span>
                                        <span className={styles.detailValue} style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {viewingUser.id}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.modalFooter} style={{ justifyContent: 'space-between', marginTop: 'auto' }}>
                                <div>
                                    {viewingUser.email !== user.email && (
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => { handleRemoveUser(viewingUser.email, viewingUser.id); setViewingUser(null); }}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
                                        >
                                            <Trash2 size={16} /> Remove
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        className={styles.submitBtn}
                                        onClick={() => { handleResetPassword(viewingUser.email); setViewingUser(null); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', color: 'var(--text-primary)', padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
                                    >
                                        🔑 Reset Password
                                    </button>
                                    <button
                                        className={styles.confirmBtn}
                                        style={{ background: 'var(--primary-color)', color: '#000', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '8px', fontWeight: '600' }}
                                        onClick={() => setViewingUser(null)}
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Admin;
