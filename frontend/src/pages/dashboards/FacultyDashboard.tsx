import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Instructor Workspace</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back, Professor {user?.name.split(' ')[1] || user?.name}. Reviewing course activities.</p>
      </div>

      <div style={styles.grid}>
        <div className="glass-panel" style={styles.mainCol}>
          <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Active Grading Queue</h3>
          <div style={styles.queueList}>
            <div style={styles.queueItem}>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Intro to Deep Learning - Assignment 2</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Submitted by Emily Watson • 2 hours ago</p>
              </div>
              <Link to="/faculty/grading" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                Review
              </Link>
            </div>
            
            <div style={styles.queueItem}>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Database Systems - Quiz 1 Attempts</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>4 pending manual reviews for text answers</p>
              </div>
              <Link to="/faculty/grading" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                Review
              </Link>
            </div>
          </div>
        </div>

        <div style={styles.sidebarCol}>
          <div className="glass-panel" style={styles.widgetCard}>
            <div style={styles.widgetTop}>
              <ClipboardCheck size={20} color="var(--primary)" />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Attendance Alert</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '10px 0 16px 0' }}>
              Database Systems attendance sheet has not been logged for today.
            </p>
            <Link to="/faculty/attendance" className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}>
              Record Attendance
            </Link>
          </div>

          <div className="glass-panel" style={styles.widgetCard}>
            <div style={styles.widgetTop}>
              <BookOpen size={20} color="#10b981" />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Course Management</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '10px 0 16px 0' }}>
              Create modules, add lessons, or publish assignments for your courses.
            </p>
            <Link to="/faculty/courses" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}>
              Manage Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px'
  },
  mainCol: {
    padding: '32px'
  },
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  queueItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.01)'
  },
  sidebarCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  widgetCard: {
    padding: '24px'
  },
  widgetTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }
};
