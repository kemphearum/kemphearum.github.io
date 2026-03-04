import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth } from '../../../firebase';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Search, Edit, Trash2, Key, X, UserPlus, Users } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { sortData } from '../../../utils/sortData';
import { tabLabels } from '../components/constants';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from '../../Admin.module.scss';

const UsersTab = ({ user, userRole, showToast }) => {
    const [usersList, setUsersList] = useState([]);
    const [searchUsers, setSearchUsers] = useState('');
    const [usersPage, setUsersPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(10);
    const [usersSort, setUsersSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('pending');
    const [viewingUser, setViewingUser] = useState(null);
    const [showRolePerms, setShowRolePerms] = useState(false);
    const [rolePermissions, setRolePermissions] = useState({});
    const [editingRolePerms, setEditingRolePerms] = useState({});
    const [loading, setLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    const { trackRead, trackWrite, trackDelete } = useActivity();

    const handleUsersSort = useCallback((field) => {
        setUsersSort(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
        setUsersPage(1);
    }, []);

    const fetchUsers = useCallback(async () => {
        if (userRole !== 'superadmin') return;
        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            trackRead(querySnapshot.size, 'Fetched users list for management');
            const uniqueUsers = new Map();
            const docsToDelete = [];
            querySnapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                const email = data.email?.toLowerCase();
                if (!email) return;
                if (uniqueUsers.has(email)) {
                    const existing = uniqueUsers.get(email);
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
            if (docsToDelete.length > 0) {
                Promise.all(docsToDelete.map(id => { trackDelete(1, 'Cleaned duplicate user'); return deleteDoc(doc(db, "users", id)); })).catch(console.error);
            }
            let finalList = Array.from(uniqueUsers.values()).map(u => ({ id: u.id, ...u.data }));
            finalList = finalList.filter(u => u.isActive !== false);
            finalList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setUsersList(finalList);
        } catch (error) {
            console.error("Error fetching users:", error);
            showToast("Failed to load users.", "error");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, showToast]);

    const fetchRolePermissions = useCallback(async () => {
        try {
            const q = query(collection(db, "rolePermissions"));
            const snap = await getDocs(q);
            trackRead(snap.size, 'Fetched role permissions');
            const perms = {};
            snap.docs.forEach(d => { perms[d.data().role] = d.data().allowedTabs || []; });
            setRolePermissions(perms);
        } catch (error) { console.error("Error fetching role permissions:", error); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchRolePermissions();
    }, [fetchUsers, fetchRolePermissions]);

    const filteredUsers = useMemo(() => {
        let result = usersList;
        if (searchUsers) {
            const lower = searchUsers.toLowerCase();
            result = result.filter(u => (u.email && u.email.toLowerCase().includes(lower)) || (u.role && u.role.toLowerCase().includes(lower)));
        }
        return sortData(result, usersSort);
    }, [usersList, searchUsers, usersSort]);

    const usersTotalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
    const paginatedUsers = useMemo(() => {
        const start = (usersPage - 1) * usersPerPage;
        return filteredUsers.slice(start, start + usersPerPage);
    }, [filteredUsers, usersPage, usersPerPage]);

    const handleRoleChange = async (userId, newRole) => {
        if (userRole !== 'superadmin') { showToast("Only Superadmins can modify users.", "error"); return; }
        try {
            await updateDoc(doc(db, "users", userId), { role: newRole });
            trackWrite(1);
            showToast(`Role updated to ${newRole}`);
            fetchUsers();
        } catch (error) { console.error("Error updating role:", error); showToast('Failed to update role.', 'error'); }
    };

    const proceedRemoveUser = async (userEmail, userId) => {
        setLoading(true);
        try {
            await updateDoc(doc(db, "users", userId), { isActive: false });
            trackDelete(1, 'Disabled user');
            showToast(`User ${userEmail} successfully disabled.`);
            fetchUsers();
        } catch (error) { console.error("Error disabling user:", error); showToast("Failed to disable user.", "error"); }
        finally { setLoading(false); setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' }); }
    };

    const handleRemoveUser = (userEmail, userId) => {
        if (userRole !== 'superadmin') { showToast("Only Superadmins can remove users.", "error"); return; }
        setConfirmDialog({
            isOpen: true, title: 'Remove User',
            message: `Are you sure you want to disable ${userEmail}?\n\nThey will no longer be able to log in, but their record will remain.`,
            confirmText: 'Yes, Disable', type: 'danger',
            onConfirm: () => proceedRemoveUser(userEmail, userId)
        });
    };

    const proceedResetPassword = async (email) => {
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            showToast(`Password reset email sent to ${email}`);
        } catch (error) { console.error("Error resetting password:", error); showToast("Failed to send reset email.", "error"); }
        finally { setLoading(false); setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' }); }
    };

    const handleResetPassword = (email) => {
        if (userRole !== 'superadmin') { showToast("Only Superadmins can reset passwords.", "error"); return; }
        setConfirmDialog({
            isOpen: true, title: 'Reset Password',
            message: `Are you sure you want to send a password reset email to ${email}?`,
            confirmText: 'Send Email', type: 'warning',
            onConfirm: () => proceedResetPassword(email)
        });
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (userRole !== 'superadmin') { showToast("Only Superadmins can create users.", "error"); return; }
        setLoading(true);
        try {
            const existingQ = query(collection(db, "users"), where("email", "==", newUserEmail.toLowerCase().trim()));
            const existingSnap = await getDocs(existingQ);
            trackRead(existingSnap.size, 'Checked existing user');
            if (!existingSnap.empty) { showToast("This email is already registered in the database.", "error"); setLoading(false); return; }
            const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
            const signupResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newUserEmail, password: newUserPassword, returnSecureToken: false })
            });
            const signupData = await signupResponse.json();
            if (!signupResponse.ok) throw new Error(signupData.error?.message || 'Failed to create user in Authentication');
            await addDoc(collection(db, "users"), { email: newUserEmail, role: newUserRole, isActive: true, createdAt: serverTimestamp() });
            showToast('User created successfully.');
            fetchUsers();
            setShowAddUserForm(false); setNewUserEmail(''); setNewUserPassword(''); setNewUserRole('pending');
        } catch (error) {
            console.error("Error creating user:", error);
            if (error.message.includes('EMAIL_EXISTS')) showToast("This email is already registered.", "error");
            else if (error.message.includes('WEAK_PASSWORD')) showToast("Password should be at least 6 characters.", "error");
            else showToast("Failed to create user.", "error");
        } finally { setLoading(false); }
    };

    const saveRolePermissions = async (role, allowedTabs) => {
        if (userRole !== 'superadmin') { showToast("Unauthorized.", "error"); return; }
        try {
            const q = query(collection(db, "rolePermissions"), where("role", "==", role));
            const snap = await getDocs(q);
            if (snap.empty) { await addDoc(collection(db, "rolePermissions"), { role, allowedTabs }); trackWrite(1, `Created ${role} permissions`); }
            else { await updateDoc(snap.docs[0].ref, { allowedTabs }); trackWrite(1, `Updated ${role} permissions`); }
            setRolePermissions(prev => ({ ...prev, [role]: allowedTabs }));
            showToast(`Permissions for '${role}' saved!`);
        } catch (error) { console.error("Error saving permissions:", error); showToast('Failed to save permissions.', 'error'); }
    };

    return (
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
                            <button onClick={() => setShowAddUserForm(!showAddUserForm)} className={styles.primaryBtn} style={{ margin: 0 }}>
                                {showAddUserForm ? 'Cancel' : '+ Add User'}
                            </button>
                        </div>

                        {filteredUsers.length === 0 ? (
                            <div className={styles.emptyState}>{searchUsers ? 'No matching users found.' : 'No users registered yet.'}</div>
                        ) : (
                            <>
                                <div className={styles.userGridHeader}>
                                    <SortableHeader label="User" field="email" sortField={usersSort.field} sortDirection={usersSort.dir} onSort={handleUsersSort} />
                                    <SortableHeader label="Role" field="role" sortField={usersSort.field} sortDirection={usersSort.dir} onSort={handleUsersSort} />
                                    <SortableHeader label="Registered" field="createdAt" sortField={usersSort.field} sortDirection={usersSort.dir} onSort={handleUsersSort} />
                                    <div style={{ textAlign: 'right' }}>Actions</div>
                                </div>
                                {paginatedUsers.map((u, index) => {
                                    const initials = (u.displayName || u.email || '??').split(/[@.\s]/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
                                    const avatarColors = { superadmin: 'linear-gradient(135deg, #10b981, #059669)', admin: 'linear-gradient(135deg, #6366f1, #8b5cf6)', editor: 'linear-gradient(135deg, #f59e0b, #d97706)', pending: 'linear-gradient(135deg, #ef4444, #dc2626)' };
                                    const roleBadgeClass = { superadmin: styles.roleSuperadmin, admin: styles.roleAdmin, editor: styles.roleEditor, pending: styles.rolePending }[u.role] || styles.rolePending;
                                    const roleLabels = { superadmin: '⭐ Super Admin', admin: '🛡️ Admin', editor: '✍️ Editor', pending: '⏳ Pending' };
                                    const isUserDisabled = u.disabled === true;
                                    return (
                                        <div key={u.id || `user-${index}`} className={`${styles.userCard} ${styles.userGridRowHover}`} style={{ opacity: isUserDisabled ? 0.6 : 1, filter: isUserDisabled ? 'grayscale(100%)' : 'none', cursor: 'pointer' }}
                                            onClick={(e) => { if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT' && !e.target.closest('button') && !e.target.closest('select')) setViewingUser(u); }}>
                                            <div className={styles.userIdentity}>
                                                <div className={styles.userAvatar} style={{ background: avatarColors[u.role] || avatarColors.pending }}>{initials}</div>
                                                <div className={styles.userIdentityText}>
                                                    <span className={styles.userEmailText} title={u.email}>{isUserDisabled ? <strike>{u.email}</strike> : u.email}</span>
                                                    {u.displayName && <span className={styles.userDisplayName}>{u.displayName}</span>}
                                                </div>
                                            </div>
                                            <div>
                                                {isUserDisabled ? (
                                                    <span className={`${styles.roleBadge} ${styles.rolePending}`} style={{ background: 'rgba(255,255,255,0.1)', color: '#888', border: '1px solid rgba(255,255,255,0.2)' }}>🚫 Disabled</span>
                                                ) : (
                                                    <span className={`${styles.roleBadge} ${roleBadgeClass}`}>{roleLabels[u.role] || u.role}</span>
                                                )}
                                            </div>
                                            <div className={styles.userMeta}>{u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}</div>
                                            <div className={styles.userActions} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                {u.email === user.email ? (
                                                    <span className={styles.youBadge} style={{ margin: 'auto 0 auto auto' }}>✓ You</span>
                                                ) : (
                                                    <>
                                                        <button title="Edit Profile" className={styles.editBtn} onClick={(e) => { e.stopPropagation(); setViewingUser(u); }}><Edit size={16} /></button>
                                                        <button title="Send Password Reset" className={styles.editBtn} onClick={(e) => { e.stopPropagation(); handleResetPassword(u.email); }}><Key size={16} /></button>
                                                        <button title="Remove User" className={styles.deleteBtn} disabled={userRole !== 'superadmin' || u.role === 'superadmin'}
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveUser(u.email, u.id); }}
                                                            style={{ opacity: (userRole !== 'superadmin' || u.role === 'superadmin') ? 0.3 : 1, cursor: (userRole !== 'superadmin' || u.role === 'superadmin') ? 'not-allowed' : 'pointer' }}>
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

            {/* Role Permissions Manager */}
            {userRole === 'superadmin' && (
                <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 className={styles.listTitle} style={{ marginBottom: '0.25rem' }}>Role Permissions</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Control which sidebar tabs each role can access.</p>
                        </div>
                        <button onClick={() => {
                            if (!showRolePerms) {
                                const allRoles = ['pending', 'editor', 'admin'];
                                const initial = {};
                                allRoles.forEach(r => { initial[r] = [...(rolePermissions[r] || [])]; });
                                setEditingRolePerms(initial);
                            }
                            setShowRolePerms(!showRolePerms);
                        }} className={styles.primaryBtn}>
                            {showRolePerms ? 'Close Editor' : '⚙️ Configure Permissions'}
                        </button>
                    </div>

                    {showRolePerms && (() => {
                        const managedRoles = ['pending', 'editor', 'admin'];
                        const allTabs = Object.keys(tabLabels).filter(t => t !== 'profile' && t !== 'users');
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {managedRoles.map(role => (
                                    <div key={`role-block-${role}`} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', textTransform: 'capitalize', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                            {role === 'pending' ? '⏳ Pending' : role === 'editor' ? '✍️ Editor' : '🛡️ Admin'} Role
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                                            {allTabs.map(tab => {
                                                const checked = (editingRolePerms[role] || []).includes(tab);
                                                return (
                                                    <label key={`role-${role}-tab-${tab}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', padding: '0.4rem 0.75rem', borderRadius: '8px', border: `1px solid ${checked ? 'rgba(100,255,218,0.3)' : 'rgba(255,255,255,0.08)'}`, background: checked ? 'rgba(100,255,218,0.07)' : 'transparent', color: checked ? 'var(--primary-color)' : 'var(--text-secondary)', transition: 'all 0.2s ease' }}>
                                                        <input type="checkbox" checked={checked} style={{ accentColor: 'var(--primary-color)' }}
                                                            onChange={e => {
                                                                const current = [...(editingRolePerms[role] || [])];
                                                                const updated = e.target.checked ? [...current, tab] : current.filter(t => t !== tab);
                                                                setEditingRolePerms(prev => ({ ...prev, [role]: updated }));
                                                            }} />
                                                        {tabLabels[tab]}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <button onClick={() => saveRolePermissions(role, editingRolePerms[role] || [])} className={styles.primaryBtn} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                                            Save {role} permissions
                                        </button>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Add User Modal */}
            {showAddUserForm && (
                <div className={styles.modalOverlay} onClick={() => setShowAddUserForm(false)} style={{ zIndex: 1100 }}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: 0 }}>
                        <div className={styles.modalHeader} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', margin: 0 }}><UserPlus size={20} /> Create New User</h3>
                            <button onClick={() => setShowAddUserForm(false)} className={styles.closeBtn}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddUser}>
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div className={styles.formGroup}><label>Email Address</label><input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required placeholder="user@example.com" /></div>
                                <div className={styles.formGroup}><label>Temporary Password</label><input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" /></div>
                                <div className={styles.formGroup}>
                                    <label>Initial Role</label>
                                    <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className={styles.standardSelect} style={{ width: '100%' }}>
                                        <option value="pending">Pending</option>
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.modalFooter} style={{ padding: '1.25rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowAddUserForm(false)} className={styles.cancelBtn} style={{ padding: '0.6rem 1.25rem' }}>Cancel</button>
                                <button type="submit" className={styles.primaryBtn} disabled={loading} style={{ margin: 0, padding: '0.6rem 1.25rem' }}>{loading ? 'Creating...' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User View Modal */}
            {viewingUser && (
                <div className={styles.modalOverlay} onClick={() => setViewingUser(null)} style={{ zIndex: 1200 }}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: 0 }}>
                        <div className={styles.modalHeader} style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            <h3><Users size={20} style={{ color: 'var(--primary-color)' }} /> User Details</h3>
                            <button onClick={() => setViewingUser(null)} className={styles.closeBtn}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '60vh' }}>
                            <div className={styles.detailGrid}>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Email Address</span><span className={styles.detailValue} style={{ fontSize: '1rem', fontWeight: 'bold' }}>{viewingUser.email}</span></div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Display Name</span><span className={styles.detailValue}>{viewingUser.displayName || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not provided</span>}</span></div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Account Role</span>
                                    {viewingUser.email === user.email ? (
                                        <span className={styles.detailValue} style={{ textTransform: 'capitalize', color: viewingUser.role === 'superadmin' ? '#10b981' : (viewingUser.role === 'admin' ? '#8b5cf6' : (viewingUser.role === 'editor' ? '#f59e0b' : 'var(--text-primary)')) }}>
                                            {viewingUser.role} (You)
                                        </span>
                                    ) : (
                                        <select className={styles.standardSelect} style={{ width: '100%', marginTop: '0.4rem' }} value={viewingUser.role}
                                            onChange={(e) => { const newRole = e.target.value; handleRoleChange(viewingUser.id, newRole); setViewingUser({ ...viewingUser, role: newRole }); }}>
                                            <option value="pending">Pending</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                            <option value="superadmin">Super Admin</option>
                                        </select>
                                    )}
                                </div>
                                <div className={styles.detailItem}><span className={styles.detailLabel}>Status</span><span className={styles.detailValue}>{viewingUser.isActive === false ? <span style={{ color: '#ef4444' }}>Disabled</span> : <span style={{ color: '#10b981' }}>Active</span>}</span></div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>Registration Date</span><span className={styles.detailValue}>{viewingUser.createdAt?.seconds ? new Date(viewingUser.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}</span></div>
                                <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}><span className={styles.detailLabel}>User ID</span><span className={styles.detailValue} style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewingUser.id}</span></div>
                            </div>
                        </div>
                        <div className={styles.modalFooter} style={{ justifyContent: 'space-between', marginTop: 'auto' }}>
                            <div>
                                {viewingUser.email !== user.email && (
                                    <button className={styles.deleteBtn} onClick={() => { handleRemoveUser(viewingUser.email, viewingUser.id); setViewingUser(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}>
                                        <Trash2 size={16} /> Remove
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button className={styles.submitBtn} onClick={() => { handleResetPassword(viewingUser.email); setViewingUser(null); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', color: 'var(--text-primary)', padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}>
                                    🔑 Reset Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmDialog.isOpen && (
                <ConfirmDialog
                    confirmDialog={confirmDialog}
                    setConfirmDialog={setConfirmDialog}
                />
            )}
        </div>
    );
};

export default UsersTab;
