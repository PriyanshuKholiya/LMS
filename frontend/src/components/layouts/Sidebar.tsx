import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import { 
  BookOpen, 
  BookOpenCheck,
  FileSpreadsheet, 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  BrainCircuit, 
  LogOut
} from 'lucide-react';

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const linksByRole: Record<UserRole, SidebarLink[]> = {
    ADMIN: [
      { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { to: '/admin/courses', label: 'Manage Courses', icon: <BookOpen size={20} /> },
      { to: '/admin/users', label: 'Manage Users', icon: <Users size={20} /> },
      { to: '/admin/analytics', label: 'Platform Stats', icon: <BarChart3 size={20} /> }
    ],
    FACULTY: [
      { to: '/faculty', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { to: '/faculty/courses', label: 'My Courses', icon: <BookOpen size={20} /> },
      { to: '/faculty/grading', label: 'Grading Hub', icon: <BookOpenCheck size={20} /> },
      { to: '/faculty/attendance', label: 'Attendance', icon: <FileSpreadsheet size={20} /> },
      { to: '/faculty/analytics', label: 'Course Analytics', icon: <BarChart3 size={20} /> }
    ],
    STUDENT: [
      { to: '/student', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { to: '/student/courses', label: 'Course Catalog', icon: <GraduationCap size={20} /> },
      { to: '/student/my-enrollments', label: 'My Learning', icon: <BookOpen size={20} /> },
      { to: '/student/analytics', label: 'My Progress', icon: <BarChart3 size={20} /> },
      { to: '/student/ai-tutor', label: 'AI Tutor', icon: <BrainCircuit size={20} /> }
    ]
  };

  const navLinks = linksByRole[user.role] || [];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <BrainCircuit size={24} color="#6366f1" />
        </div>
        <span style={styles.logoText}>Aegis LMS</span>
      </div>

      <nav style={styles.nav}>
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/faculty' || link.to === '/student'}
            style={({ isActive }) => ({
              ...styles.link,
              backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent'
            })}
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}>
        <button onClick={logout} style={styles.logoutBtn} className="transition-all">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '260px',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100
  },
  logoContainer: {
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: '12px',
    borderBottom: '1px solid var(--border)'
  },
  logoIcon: {
    background: 'rgba(99, 102, 241, 0.12)',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
    background: 'linear-gradient(to right, #ffffff, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  nav: {
    flex: 1,
    padding: '24px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 24px',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: 500,
    transition: 'all 0.2s'
  },
  footer: {
    padding: '20px 24px',
    borderTop: '1px solid var(--border)'
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    padding: '10px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: 500
  }
};
