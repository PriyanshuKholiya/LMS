import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import { ShieldAlert, Award, UserCheck } from 'lucide-react';
import { HeaderNotifications } from './HeaderNotifications';

export const Header: React.FC = () => {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleRoleChange = (role: UserRole) => {
    switchRole(role);
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'FACULTY') navigate('/faculty');
    else navigate('/student');
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return <ShieldAlert size={16} color="#ef4444" />;
      case 'FACULTY': return <UserCheck size={16} color="#f59e0b" />;
      case 'STUDENT': return <Award size={16} color="#10b981" />;
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

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <div style={styles.roleSwitcherContainer}>
          <span style={styles.switcherLabel}>Testing Sandbox:</span>
          <select 
            value={user.role} 
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            style={styles.switcherSelect}
          >
            <option value="STUDENT">Student Persona</option>
            <option value="FACULTY">Faculty Persona</option>
            <option value="ADMIN">Super Admin Persona</option>
          </select>
        </div>
      </div>
      
      <div style={styles.right}>
        <HeaderNotifications />

        <div style={styles.divider}></div>
        
        <div style={styles.profile}>
          <div style={styles.profileDetails}>
            <span style={styles.profileName}>{user.name}</span>
            <div style={{ ...styles.roleBadge, ...getRoleBadgeStyle(user.role) }}>
              {getRoleIcon(user.role)}
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{user.role}</span>
            </div>
          </div>
          <div style={styles.avatar}>
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: '70px',
    backgroundColor: 'var(--bg-sidebar)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'fixed',
    top: 0,
    right: 0,
    left: '260px',
    zIndex: 99
  },
  left: {
    display: 'flex',
    alignItems: 'center'
  },
  roleSwitcherContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border)'
  },
  switcherLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 500
  },
  switcherSelect: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
    padding: '2px 8px',
    width: 'auto'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  notificationBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: 'var(--border)'
  },
  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  profileDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px'
  },
  profileName: {
    fontSize: '0.9rem',
    fontWeight: 600
  },
  roleBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '20px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1.1rem',
    border: '2px solid rgba(255, 255, 255, 0.1)'
  }
};
