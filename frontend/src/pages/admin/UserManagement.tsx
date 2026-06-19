import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  ShieldAlert, 
  UserCheck, 
  Award, 
  X, 
  Info,
  Server,
  CloudLightning
} from 'lucide-react';
import { type UserRole } from '../../context/AuthContext';
import { userService, type UserItem } from '../../services/users';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isMockMode, setIsMockMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('STUDENT');
  const [formPassword, setFormPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load users from API or Mock Fallback
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aegis_token') || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setIsMockMode(false);
      } else {
        throw new Error('unauthorized');
      }
    } catch (err) {
      setIsMockMode(true);
      const data = await userService.getUsers();
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formName || !formEmail) return;

    // Check email uniqueness locally or API will handle it
    const emailExists = users.some(u => u.email.toLowerCase() === formEmail.toLowerCase());
    if (emailExists) {
      setErrorMsg('A user with this email already exists.');
      return;
    }

    try {
      await userService.createUser({
        name: formName,
        email: formEmail,
        role: formRole,
        password: formPassword
      });
      fetchUsers();
      closeAddModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating user.');
    }
  };

  // Edit User
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedUser || !formName || !formEmail) return;

    // Email uniqueness check
    const emailExists = users.some(u => u.email.toLowerCase() === formEmail.toLowerCase() && u.id !== selectedUser.id);
    if (emailExists) {
      setErrorMsg('A user with this email already exists.');
      return;
    }

    try {
      await userService.updateUser(selectedUser.id, {
        name: formName,
        email: formEmail,
        role: formRole,
        password: formPassword || undefined
      });
      fetchUsers();
      closeEditModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating user.');
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await userService.deleteUser(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error deleting user.');
    }
  };

  const openAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('STUDENT');
    setFormPassword('');
    setErrorMsg('');
    setIsAddOpen(true);
  };

  const closeAddModal = () => {
    setIsAddOpen(false);
  };

  const openEditModal = (user: UserItem) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPassword('');
    setErrorMsg('');
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setSelectedUser(null);
  };

  // Filtering
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Role Badges
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return <ShieldAlert size={14} color="#ef4444" />;
      case 'FACULTY': return <UserCheck size={14} color="#f59e0b" />;
      case 'STUDENT': return <Award size={14} color="#10b981" />;
    }
  };

  const getRoleBadgeStyle = (role: UserRole): React.CSSProperties => {
    switch (role) {
      case 'ADMIN':
        return { background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'FACULTY':
        return { background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'STUDENT':
        return { background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    }
  };

  // Statistics
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const facultyCount = users.filter(u => u.role === 'FACULTY').length;
  const studentCount = users.filter(u => u.role === 'STUDENT').length;

  return (
    <div>
      {/* Upper header controls */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>User Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Create, manage, and edit credentials/roles across Aegis LMS.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary" style={styles.addButton}>
          <UserPlus size={16} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Mode Status Panel */}
      <div style={styles.statusIndicator} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isMockMode ? (
            <>
              <CloudLightning size={16} color="#f59e0b" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b' }}>Sandbox Mock Mode Active</span>
            </>
          ) : (
            <>
              <Server size={16} color="#10b981" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>Live Database Connected</span>
            </>
          )}
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {isMockMode 
            ? "API server offline or unauthenticated. Mutations are saved to browser localStorage." 
            : "Directly querying the backend PostgreSQL database."
          }
        </span>
      </div>

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        <div className="glass-panel" style={styles.statCard}>
          <span style={styles.statLabel}>Total Users</span>
          <span style={styles.statValue}>{users.length}</span>
        </div>
        <div className="glass-panel" style={styles.statCard}>
          <span style={styles.statLabel}>Administrators</span>
          <span style={{ ...styles.statValue, color: '#ef4444' }}>{adminCount}</span>
        </div>
        <div className="glass-panel" style={styles.statCard}>
          <span style={styles.statLabel}>Faculty Members</span>
          <span style={{ ...styles.statValue, color: '#f59e0b' }}>{facultyCount}</span>
        </div>
        <div className="glass-panel" style={styles.statCard}>
          <span style={styles.statLabel}>Students</span>
          <span style={{ ...styles.statValue, color: '#10b981' }}>{studentCount}</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={styles.filterBar} className="glass-panel">
        <div style={styles.searchWrapper}>
          <Search size={18} color="var(--text-muted)" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterWrapper}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={styles.roleSelect}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Super Admin</option>
            <option value="FACULTY">Faculty</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email Address</th>
              <th style={styles.th}>Role / Persona</th>
              <th style={styles.th}>Date Registered</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={styles.emptyCell}>
                  <Users size={36} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                  <div>No users found matching the filter criteria.</div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, color: '#ffffff' }}>{user.name}</div>
                  </td>
                  <td style={{ ...styles.td, color: 'var(--text-muted)' }}>{user.email}</td>
                  <td style={styles.td}>
                    <div style={{ ...styles.roleBadge, ...getRoleBadgeStyle(user.role) }}>
                      {getRoleIcon(user.role)}
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{user.role}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, color: 'var(--text-muted)' }}>
                    {new Date(user.created_at).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td style={{ ...styles.td }}>
                    <div style={styles.actionsCell}>
                      <button 
                        onClick={() => openEditModal(user)} 
                        style={styles.actionBtn} 
                        title="Edit User"
                      >
                        <Edit size={14} color="#a1a1aa" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)} 
                        style={styles.actionBtn} 
                        title="Delete User"
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add New User Account</h3>
              <button onClick={closeAddModal} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div style={styles.errorAlert}>
                <Info size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} style={styles.modalForm}>
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  placeholder="e.g. John Doe"
                  required 
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email Address</label>
                <input 
                  type="email" 
                  value={formEmail} 
                  onChange={(e) => setFormEmail(e.target.value)} 
                  placeholder="e.g. jdoe@aegis.edu"
                  required 
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Platform Role</label>
                <select 
                  value={formRole} 
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                >
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="ADMIN">Super Admin</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Password {isMockMode && "(Optional in Sandbox)"}</label>
                <input 
                  type="password" 
                  value={formPassword} 
                  onChange={(e) => setFormPassword(e.target.value)} 
                  placeholder="Minimum 6 characters"
                  required={!isMockMode}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={closeAddModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditOpen && selectedUser && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit User Details</h3>
              <button onClick={closeEditModal} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div style={styles.errorAlert}>
                <Info size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleEditUser} style={styles.modalForm}>
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  required 
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email Address</label>
                <input 
                  type="email" 
                  value={formEmail} 
                  onChange={(e) => setFormEmail(e.target.value)} 
                  required 
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Platform Role</label>
                <select 
                  value={formRole} 
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                >
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="ADMIN">Super Admin</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Reset Password (leave empty to keep current)</label>
                <input 
                  type="password" 
                  value={formPassword} 
                  onChange={(e) => setFormPassword(e.target.value)} 
                  placeholder="New password (optional)"
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={closeEditModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '4px'
  },
  addButton: {
    gap: '8px',
    padding: '10px 20px'
  },
  statusIndicator: {
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border)',
    borderRadius: '10px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '32px'
  },
  statCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  statLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    marginBottom: '20px',
    gap: '20px'
  },
  searchWrapper: {
    position: 'relative',
    flex: 1
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none'
  },
  searchInput: {
    paddingLeft: '44px'
  },
  filterWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  roleSelect: {
    width: '160px',
    background: 'rgba(9, 9, 11, 0.6)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  th: {
    padding: '16px 20px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tr: {
    borderBottom: '1px solid var(--border)',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '16px 20px',
    fontSize: '0.95rem'
  },
  emptyCell: {
    padding: '60px 20px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.95rem'
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px'
  },
  actionsCell: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px'
  },
  actionBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px'
  },
  modalCard: {
    width: '100%',
    maxWidth: '480px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    animation: 'scaleUp 0.2s ease-out'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    borderRadius: '50%',
    transition: 'color 0.2s'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase'
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ef4444',
    fontSize: '0.85rem'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px'
  }
};
