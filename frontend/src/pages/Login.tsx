import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { BrainCircuit, GraduationCap, Users, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    login(email, selectedRole);
    // Redirect based on selected role
    if (selectedRole === 'ADMIN') navigate('/admin');
    else if (selectedRole === 'FACULTY') navigate('/faculty');
    else navigate('/student');
  };

  const selectRole = (role: UserRole, defaultEmail: string) => {
    setSelectedRole(role);
    setEmail(defaultEmail);
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <BrainCircuit size={48} color="var(--primary)" />
          <h2 style={styles.title}>Aegis LMS</h2>
          <p style={{ color: 'var(--text-muted)' }}>AI-Powered Learning Management System</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Persona Quick Select:</label>
            <div style={styles.roleGrid}>
              <div 
                style={{
                  ...styles.roleCard,
                  borderColor: selectedRole === 'STUDENT' ? 'var(--primary)' : 'var(--border)',
                  background: selectedRole === 'STUDENT' ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                }}
                onClick={() => selectRole('STUDENT', 'student@aegis.edu')}
                className="transition-all"
              >
                <GraduationCap size={20} color={selectedRole === 'STUDENT' ? 'var(--primary)' : 'var(--text-muted)'} />
                <span>Student</span>
              </div>
              
              <div 
                style={{
                  ...styles.roleCard,
                  borderColor: selectedRole === 'FACULTY' ? 'var(--primary)' : 'var(--border)',
                  background: selectedRole === 'FACULTY' ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                }}
                onClick={() => selectRole('FACULTY', 'faculty@aegis.edu')}
                className="transition-all"
              >
                <UserCheck size={20} color={selectedRole === 'FACULTY' ? 'var(--primary)' : 'var(--text-muted)'} />
                <span>Faculty</span>
              </div>

              <div 
                style={{
                  ...styles.roleCard,
                  borderColor: selectedRole === 'ADMIN' ? 'var(--primary)' : 'var(--border)',
                  background: selectedRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                }}
                onClick={() => selectRole('ADMIN', 'admin@aegis.edu')}
                className="transition-all"
              >
                <Users size={20} color={selectedRole === 'ADMIN' ? 'var(--primary)' : 'var(--text-muted)'} />
                <span>Admin</span>
              </div>
            </div>
          </div>

          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@aegis.edu"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
            Enter Platform
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at center, #111428 0%, #0b0d19 100%)',
    padding: '16px'
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
    textAlign: 'center'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    background: 'linear-gradient(to right, #ffffff, #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    textAlign: 'left'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginTop: '4px'
  },
  roleCard: {
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    textAlign: 'center'
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem'
  }
};
