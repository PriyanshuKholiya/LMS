import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (!user) navigate('/login');
    else if (user.role === 'ADMIN') navigate('/admin');
    else if (user.role === 'FACULTY') navigate('/faculty');
    else navigate('/student');
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <ShieldAlert size={64} color="var(--error)" />
        <h2 style={styles.title}>Access Denied</h2>
        <p style={styles.message}>
          You do not have the required permissions to view this resource. 
          Please contact system administration if you believe this is an error.
        </p>
        <button onClick={handleGoHome} className="btn btn-primary" style={styles.btn}>
          Back to Dashboard
        </button>
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
    background: '#0b0d19',
    padding: '16px'
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '20px'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  message: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    lineHeight: 1.6
  },
  btn: {
    marginTop: '10px',
    padding: '10px 24px'
  }
};
