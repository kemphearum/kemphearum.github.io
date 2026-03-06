import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import UserService from '../../../services/UserService';
import { Search, Edit, Trash2, Key, X, UserPlus, Users } from 'lucide-react';
import { useActivity } from '../../../hooks/useActivity';
import { sortData } from '../../../utils/sortData';
import { tabLabels } from '../components/constants';
import SortableHeader from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import BaseModal from '../components/BaseModal';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import styles from '../../Admin.module.scss';

const UsersTab = ({ user, userRole, showToast }) => {
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
    const [editingRolePerms, setEditingRolePerms] = useState({});
    const [loading, setLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger' });
    const { trackRead, trackWrite, trackDelete } = useActivity();
    const queryClient = useQueryClient();

    const { data: usersList = [], isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => UserService.fetchUsers(userRole, trackRead, trackDelete),
        enabled: userRole === 'superadmin'
    });

    const { data: rolePermissions = {} } = useQuery({
        queryKey: ['rolePermissions'],
        queryFn: () => UserService.fetchRolePermissions(trackRead),
        enabled: userRole === 'superadmin'
    });

    const handleUsersSort = useCallback((field) => {
        setUsersSort(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
        setUsersPage(1);
    }, []);

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
        try {
            await UserService.updateRole(userRole, userId, newRole, trackWrite);
            showToast(`Role updated to ${newRole}`);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error) { console.error("Error updating role:", error); showToast(error.message || 'Failed to update role.', 'error'); }
    };

    const proceedRemoveUser = async (userEmail, userId) => {
        setLoading(true);
        try {
            await UserService.removeUser(userRole, userId, trackDelete);
            showToast(`User ${userEmail} successfully disabled.`);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error) { console.error("Error disabling user:", error); showToast(error.message || "Failed to disable user.", "error"); }
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
            await UserService.sendPasswordReset(userRole, email);
            showToast(`Password reset email sent to ${email}`);
        } catch (error) { console.error("Error resetting password:", error); showToast(error.message || "Failed to send reset email.", "error"); }
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
        setLoading(true);
        try {
            await UserService.createUser(userRole, newUserEmail, newUserPassword, newUserRole, trackRead);
            showToast('User created successfully.');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowAddUserForm(false); setNewUserEmail(''); setNewUserPassword(''); setNewUserRole('pending');
        } catch (error) {
            console.error("Error creating user:", error);
            showToast(error.message || "Failed to create user.", "error");
        } finally { setLoading(false); }
    };

    const saveRolePermissions = async (role, allowedTabs) => {
        if (userRole !== 'superadmin') { showToast("Unauthorized.", "error"); return; }
        try {
            await UserService.saveRolePermissions(role, allowedTabs, trackWrite);
            queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
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
            <BaseModal
                isOpen={showAddUserForm}
                onClose={() => setShowAddUserForm(false)}
                zIndex={1300}
                maxWidth="480px"
                contentStyle={{ borderRadius: '20px' }}
                headerStyle={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem 2rem' }}
                headerContent={
                    <h3 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserPlus size={22} style={{ color: 'var(--primary-color)' }} /> Create New User
                    </h3>
                }
                bodyStyle={{ padding: 0 }}
            >
                <form onSubmit={handleAddUser}>
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <FormInput
                            label="Email Address"
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            required
                            placeholder="user@example.com"
                        />
                        <FormInput
                            label="Temporary Password"
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            required
                            placeholder="Min 6 characters"
                            minLength={6}
                        />
                        <FormSelect
                            label="Initial Role"
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value)}
                            options={[
                                { value: 'pending', label: '⏳ Pending Verification' },
                                { value: 'editor', label: '✍️ Content Editor' },
                                { value: 'admin', label: '🛡️ System Admin' }
                            ]}
                        />
                    </div>
                    <div className={styles.modalFooter} style={{ padding: '1.25rem 2rem', background: 'transparent', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" onClick={() => setShowAddUserForm(false)} className={styles.cancelBtn} style={{ padding: '0.6rem 1.25rem' }}>Cancel</button>
                        <button type="submit" className={styles.primaryBtn} disabled={loading} style={{ margin: 0, padding: '0.6rem 1.75rem' }}>{loading ? 'Creating...' : 'Create User'}</button>
                    </div>
                </form>
            </BaseModal>

            {/* User View Modal */}
            {viewingUser && (
                <BaseModal
                    isOpen={!!viewingUser}
                    onClose={() => setViewingUser(null)}
                    zIndex={1200}
                    maxWidth="650px"
                    contentStyle={{ borderRadius: '20px' }}
                    headerStyle={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem 2rem' }}
                    headerContent={
                        <h3 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={22} style={{ color: 'var(--primary-color)' }} /> User Account Profile
                        </h3>
                    }
                    bodyStyle={{ padding: 0 }}
                    footerStyle={{ padding: '1.5rem 2rem', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    footerContent={
                        <>
                            <div>
                                {viewingUser.email !== user.email && (
                                    <button className={styles.deleteBtn} onClick={() => { handleRemoveUser(viewingUser.email, viewingUser.id); setViewingUser(null); }} style={{ padding: '0.6rem 1.25rem', margin: 0 }}>
                                        <Trash2 size={16} /> Disable User Account
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                <button className={styles.editBtn} onClick={() => { handleResetPassword(viewingUser.email); setViewingUser(null); }}
                                    style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '0.6rem 1.25rem', margin: 0 }}>
                                    🔑 Send Reset Email
                                </button>
                                <button onClick={() => setViewingUser(null)} className={styles.primaryBtn} style={{ padding: '0.6rem 1.5rem', margin: 0 }}>Done</button>
                            </div>
                        </>
                    }
                >
                    <div style={{ padding: '2rem', overflowY: 'auto', maxHeight: '70vh' }}>
                        <div className={styles.detailGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                <span className={styles.detailLabel}>Authentication Email</span>
                                <span className={styles.detailValue} style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{viewingUser.email}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Display Name</span>
                                <span className={styles.detailValue} style={{ fontSize: '1rem' }}>{viewingUser.displayName || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.6 }}>Not set by user</span>}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Status & Security</span>
                                <span className={styles.detailValue} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {viewingUser.isActive === false ? <span style={{ color: '#ef4444', fontWeight: 'bold' }}>● Disabled</span> : <span style={{ color: '#10b981', fontWeight: 'bold' }}>● Active Account</span>}
                                </span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Administrative Role</span>
                                {viewingUser.email === user.email ? (
                                    <div style={{ marginTop: '0.6rem' }}>
                                        <span className={`${styles.roleBadge} ${viewingUser.role === 'superadmin' ? styles.roleSuperadmin : (viewingUser.role === 'admin' ? styles.roleAdmin : styles.roleEditor)}`}>
                                            {viewingUser.role.toUpperCase()} (YOU)
                                        </span>
                                    </div>
                                ) : (
                                    <select className={styles.standardSelect} style={{ width: '100%', marginTop: '0.4rem', fontSize: '0.85rem' }} value={viewingUser.role}
                                        onChange={(e) => { const newRole = e.target.value; handleRoleChange(viewingUser.id, newRole); setViewingUser({ ...viewingUser, role: newRole }); }}>
                                        <option value="pending">Pending</option>
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                        <option value="superadmin">Super Admin</option>
                                    </select>
                                )}
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Registration Date</span>
                                <span className={styles.detailValue} style={{ fontSize: '0.9rem' }}>{viewingUser.createdAt?.seconds ? new Date(viewingUser.createdAt.seconds * 1000).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : 'Unknown'}</span>
                            </div>
                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                <span className={styles.detailLabel}>System Universal ID (UID)</span>
                                <span className={styles.detailValue} style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>{viewingUser.id}</span>
                            </div>
                        </div>
                    </div>
                </BaseModal>
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
